import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/orders
 * Listar todos os pedidos
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      status, priority, orderType, customerId, assignedToId,
      search, page = '1', limit = '50' 
    } = req.query;
    
    const where: any = {};
    
    // PRESTADOR só vê seus próprios pedidos
    if (req.user?.role === 'PRESTADOR') {
      where.assignedToId = req.user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (orderType) {
      where.orderType = orderType;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { customer: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, company: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          labels: true,
          products: {
            include: { product: true }
          },
          _count: {
            select: { 
              comments: true, 
              attachments: true,
              history: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.order.count({ where })
    ]);
    
    res.json({
      data: orders,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar pedidos' 
    });
  }
});

/**
 * GET /api/orders/kanban
 * Obter pedidos agrupados por status (para Kanban)
 */
router.get('/kanban', authenticate, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    
    // PRESTADOR só vê seus próprios pedidos
    if (req.user?.role === 'PRESTADOR') {
      where.assignedToId = req.user.id;
    }
    
    // Não mostrar arquivados no Kanban por padrão
    where.status = { not: 'ARQUIVADO' };
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        labels: true,
        products: {
          include: { product: { select: { id: true, name: true } } }
        },
        checklists: {
          include: { items: true }
        },
        _count: {
          select: { 
            comments: true, 
            attachments: true,
            artworkImages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Agrupar por status
    const statuses = [
      'FAZER', 'AJUSTE', 'APROVACAO', 'AGUARDANDO_APROVACAO', 
      'APROVADO', 'ARTE_APROVADA', 'PRODUCAO', 'EXPEDICAO', 
      'FINALIZADO', 'ENTREGUE', 'FATURADO'
    ];
    
    const kanban = statuses.map(status => ({
      id: status,
      title: status.replace(/_/g, ' '),
      orders: orders.filter(order => order.status === status)
    }));
    
    res.json(kanban);
  } catch (error) {
    console.error('Erro ao buscar Kanban:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar dados do Kanban' 
    });
  }
});

/**
 * GET /api/orders/:id
 * Obter pedido por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        watchers: {
          select: { id: true, name: true, email: true }
        },
        history: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        checklists: {
          include: { items: { orderBy: { createdAt: 'asc' } } }
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        labels: true,
        products: {
          include: { product: true }
        },
        artworkImages: {
          include: {
            uploadedBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        artworkApprovalTokens: {
          orderBy: { createdAt: 'desc' }
        },
        artworkActionLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Pedido não encontrado' 
      });
    }
    
    // PRESTADOR só pode ver seus próprios pedidos
    if (req.user?.role === 'PRESTADOR' && order.assignedToId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Você não tem permissão para ver este pedido' 
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar pedido' 
    });
  }
});

/**
 * POST /api/orders
 * Criar novo pedido
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      title, description, customerId, status, priority, orderType,
      dueDate, startDate, assignedToId, artworkUrl, approvalLink,
      personalizationDetails, customerDetails, labels, products
    } = req.body;
    
    if (!title || !customerId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Título e cliente são obrigatórios' 
      });
    }
    
    // Verificar se cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Cliente não encontrado' 
      });
    }
    
    const order = await prisma.order.create({
      data: {
        title,
        description,
        customerId,
        status: status || 'FAZER',
        priority: priority || 'normal',
        orderType,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        assignedToId,
        artworkUrl,
        approvalLink,
        personalizationDetails,
        customerDetails,
        labels: labels ? {
          create: labels.map((label: string) => ({ label }))
        } : undefined,
        products: products ? {
          create: products.map((p: { productId: string; quantity: number }) => ({
            productId: p.productId,
            quantity: p.quantity || 1
          }))
        } : undefined,
        history: {
          create: {
            status: status || 'FAZER',
            comment: 'Pedido criado',
            userId: req.user!.id
          }
        }
      },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        labels: true,
        products: { include: { product: true } }
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_ORDER',
        entityType: 'ORDER',
        entityId: order.id,
        details: `Pedido "${order.title}" criado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar pedido' 
    });
  }
});

/**
 * PUT /api/orders/:id
 * Atualizar pedido
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, description, customerId, status, priority, orderType,
      dueDate, startDate, assignedToId, artworkUrl, approvalLink,
      personalizationDetails, customerDetails
    } = req.body;
    
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Pedido não encontrado' 
      });
    }
    
    // PRESTADOR só pode editar seus próprios pedidos
    if (req.user?.role === 'PRESTADOR' && existingOrder.assignedToId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Você não tem permissão para editar este pedido' 
      });
    }
    
    // Se o status mudou, criar entrada no histórico
    const statusChanged = status && status !== existingOrder.status;
    
    const order = await prisma.order.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        customerId: customerId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        orderType: orderType !== undefined ? orderType : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        assignedToId: assignedToId !== undefined ? assignedToId : undefined,
        artworkUrl: artworkUrl !== undefined ? artworkUrl : undefined,
        approvalLink: approvalLink !== undefined ? approvalLink : undefined,
        personalizationDetails: personalizationDetails !== undefined ? personalizationDetails : undefined,
        customerDetails: customerDetails !== undefined ? customerDetails : undefined,
        history: statusChanged ? {
          create: {
            status,
            comment: `Status alterado de ${existingOrder.status} para ${status}`,
            userId: req.user!.id
          }
        } : undefined
      },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        labels: true,
        products: { include: { product: true } }
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_ORDER',
        entityType: 'ORDER',
        entityId: order.id,
        details: `Pedido "${order.title}" atualizado${statusChanged ? ` (status: ${status})` : ''}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar pedido' 
    });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Atualizar apenas o status do pedido (para drag-and-drop)
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Status é obrigatório' 
      });
    }
    
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Pedido não encontrado' 
      });
    }
    
    // PRESTADOR só pode alterar status de seus próprios pedidos
    if (req.user?.role === 'PRESTADOR' && existingOrder.assignedToId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Você não tem permissão para alterar este pedido' 
      });
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        history: {
          create: {
            status,
            comment: comment || `Status alterado de ${existingOrder.status} para ${status}`,
            userId: req.user!.id
          }
        }
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CHANGE_ORDER_STATUS',
        entityType: 'ORDER',
        entityId: order.id,
        details: `Status do pedido "${order.title}" alterado para ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar status do pedido' 
    });
  }
});

/**
 * DELETE /api/orders/:id
 * Excluir pedido
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Pedido não encontrado' 
      });
    }
    
    await prisma.order.delete({
      where: { id }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_ORDER',
        entityType: 'ORDER',
        entityId: id,
        details: `Pedido "${order.title}" excluído`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao excluir pedido' 
    });
  }
});

/**
 * POST /api/orders/:id/comments
 * Adicionar comentário ao pedido
 */
router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Texto do comentário é obrigatório' 
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Pedido não encontrado' 
      });
    }
    
    const comment = await prisma.comment.create({
      data: {
        text,
        orderId: id,
        userId: req.user!.id
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao adicionar comentário' 
    });
  }
});

export default router;
