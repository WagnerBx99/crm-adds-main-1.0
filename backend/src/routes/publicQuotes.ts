import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/public-quotes
 * Listar orçamentos públicos
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, convertedToOrder, search, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (convertedToOrder !== undefined) {
      where.convertedToOrder = convertedToOrder === 'true';
    }
    
    if (search) {
      where.OR = [
        { customerName: { contains: String(search), mode: 'insensitive' } },
        { customerEmail: { contains: String(search), mode: 'insensitive' } },
        { customerCompany: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [quotes, total] = await Promise.all([
      prisma.publicQuote.findMany({
        where,
        include: {
          products: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.publicQuote.count({ where })
    ]);
    
    res.json({
      data: quotes,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar orçamentos' 
    });
  }
});

/**
 * GET /api/public-quotes/:id
 * Obter orçamento por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.publicQuote.findUnique({
      where: { id },
      include: {
        products: true
      }
    });
    
    if (!quote) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Orçamento não encontrado' 
      });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar orçamento' 
    });
  }
});

/**
 * POST /api/public-quotes
 * Criar novo orçamento público (não requer autenticação)
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      customerName, customerEmail, customerPhone, customerCompany,
      description, priority, products
    } = req.body;
    
    if (!customerName || !customerEmail) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome e email do cliente são obrigatórios' 
      });
    }
    
    const quote = await prisma.publicQuote.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        description,
        priority: priority || 'normal',
        products: products ? {
          create: products.map((p: { productId: string; productName: string; quantity: number }) => ({
            productId: p.productId,
            productName: p.productName,
            quantity: p.quantity || 1
          }))
        } : undefined
      },
      include: {
        products: true
      }
    });
    
    res.status(201).json(quote);
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar orçamento' 
    });
  }
});

/**
 * PUT /api/public-quotes/:id
 * Atualizar orçamento
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customerName, customerEmail, customerPhone, customerCompany,
      description, status, priority
    } = req.body;
    
    const existingQuote = await prisma.publicQuote.findUnique({
      where: { id }
    });
    
    if (!existingQuote) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Orçamento não encontrado' 
      });
    }
    
    const quote = await prisma.publicQuote.update({
      where: { id },
      data: {
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone !== undefined ? customerPhone : undefined,
        customerCompany: customerCompany !== undefined ? customerCompany : undefined,
        description: description !== undefined ? description : undefined,
        status: status || undefined,
        priority: priority || undefined
      },
      include: {
        products: true
      }
    });
    
    res.json(quote);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar orçamento' 
    });
  }
});

/**
 * POST /api/public-quotes/:id/convert
 * Converter orçamento em pedido
 */
router.post('/:id/convert', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.publicQuote.findUnique({
      where: { id },
      include: { products: true }
    });
    
    if (!quote) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Orçamento não encontrado' 
      });
    }
    
    if (quote.convertedToOrder) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Orçamento já foi convertido em pedido' 
      });
    }
    
    // Criar ou buscar cliente
    let customer = await prisma.customer.findFirst({
      where: { email: quote.customerEmail }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: quote.customerName,
          email: quote.customerEmail,
          phone: quote.customerPhone,
          company: quote.customerCompany
        }
      });
    }
    
    // Criar pedido
    const order = await prisma.order.create({
      data: {
        title: `Pedido - ${quote.customerName}`,
        description: quote.description,
        customerId: customer.id,
        status: 'FAZER',
        priority: quote.priority,
        orderType: 'ORCAMENTO_PUBLICO',
        history: {
          create: {
            status: 'FAZER',
            comment: `Pedido criado a partir do orçamento #${quote.id}`,
            userId: req.user!.id
          }
        }
      },
      include: {
        customer: true
      }
    });
    
    // Atualizar orçamento
    await prisma.publicQuote.update({
      where: { id },
      data: {
        convertedToOrder: true,
        convertedOrderId: order.id
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CONVERT_QUOTE_TO_ORDER',
        entityType: 'PUBLIC_QUOTE',
        entityId: id,
        details: `Orçamento convertido em pedido #${order.id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ quote, order });
  } catch (error) {
    console.error('Erro ao converter orçamento:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao converter orçamento em pedido' 
    });
  }
});

/**
 * DELETE /api/public-quotes/:id
 * Excluir orçamento
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.publicQuote.findUnique({
      where: { id }
    });
    
    if (!quote) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Orçamento não encontrado' 
      });
    }
    
    await prisma.publicQuote.delete({
      where: { id }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_QUOTE',
        entityType: 'PUBLIC_QUOTE',
        entityId: id,
        details: `Orçamento de ${quote.customerName} excluído`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao excluir orçamento' 
    });
  }
});

export default router;
