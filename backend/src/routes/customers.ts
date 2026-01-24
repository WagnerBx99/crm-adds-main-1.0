import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/customers
 * Listar todos os clientes
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, personType, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (personType) {
      where.personType = personType;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { company: { contains: String(search), mode: 'insensitive' } },
        { document: { contains: String(search) } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.customer.count({ where })
    ]);
    
    res.json({
      data: customers,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar clientes' 
    });
  }
});

/**
 * GET /api/customers/:id
 * Obter cliente por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Cliente não encontrado' 
      });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar cliente' 
    });
  }
});

/**
 * POST /api/customers
 * Criar novo cliente
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      name, email, phone, company, personType, document,
      zipCode, city, state, address, neighborhood, number,
      complement, logo, inscricaoEstadual, inscricaoMunicipal,
      nomeFantasia, tinyId
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome é obrigatório' 
      });
    }
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        company,
        personType: personType || 'FISICA',
        document,
        zipCode,
        city,
        state,
        address,
        neighborhood,
        number,
        complement,
        logo,
        inscricaoEstadual,
        inscricaoMunicipal,
        nomeFantasia,
        tinyId
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        details: `Cliente ${customer.name} criado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar cliente' 
    });
  }
});

/**
 * PUT /api/customers/:id
 * Atualizar cliente
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, company, personType, document,
      zipCode, city, state, address, neighborhood, number,
      complement, logo, inscricaoEstadual, inscricaoMunicipal,
      nomeFantasia, tinyId
    } = req.body;
    
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });
    
    if (!existingCustomer) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Cliente não encontrado' 
      });
    }
    
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        company: company !== undefined ? company : undefined,
        personType: personType || undefined,
        document: document !== undefined ? document : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        address: address !== undefined ? address : undefined,
        neighborhood: neighborhood !== undefined ? neighborhood : undefined,
        number: number !== undefined ? number : undefined,
        complement: complement !== undefined ? complement : undefined,
        logo: logo !== undefined ? logo : undefined,
        inscricaoEstadual: inscricaoEstadual !== undefined ? inscricaoEstadual : undefined,
        inscricaoMunicipal: inscricaoMunicipal !== undefined ? inscricaoMunicipal : undefined,
        nomeFantasia: nomeFantasia !== undefined ? nomeFantasia : undefined,
        tinyId: tinyId !== undefined ? tinyId : undefined
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        details: `Cliente ${customer.name} atualizado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(customer);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar cliente' 
    });
  }
});

/**
 * DELETE /api/customers/:id
 * Excluir cliente
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: { select: { id: true } } }
    });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Cliente não encontrado' 
      });
    }
    
    // Verificar se tem pedidos associados
    if (customer.orders.length > 0) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Cliente possui pedidos associados e não pode ser excluído' 
      });
    }
    
    await prisma.customer.delete({
      where: { id }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: id,
        details: `Cliente ${customer.name} excluído`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao excluir cliente' 
    });
  }
});

export default router;
