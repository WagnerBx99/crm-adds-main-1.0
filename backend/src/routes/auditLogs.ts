import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/audit-logs
 * Listar logs de auditoria
 */
router.get('/', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { 
      action, entityType, entityId, userId, 
      startDate, endDate, page = '1', limit = '100' 
    } = req.query;
    
    const where: any = {};
    
    if (action) {
      where.action = action;
    }
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (entityId) {
      where.entityId = entityId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(String(startDate));
      }
      if (endDate) {
        where.timestamp.lte = new Date(String(endDate));
      }
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.auditLog.count({ where })
    ]);
    
    res.json({
      data: logs,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar logs de auditoria' 
    });
  }
});

/**
 * GET /api/audit-logs/actions
 * Listar tipos de ações disponíveis
 */
router.get('/actions', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    });
    
    res.json(actions.map(a => a.action));
  } catch (error) {
    console.error('Erro ao listar ações:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar tipos de ações' 
    });
  }
});

/**
 * GET /api/audit-logs/entity-types
 * Listar tipos de entidades disponíveis
 */
router.get('/entity-types', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const entityTypes = await prisma.auditLog.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
      orderBy: { entityType: 'asc' }
    });
    
    res.json(entityTypes.map(e => e.entityType));
  } catch (error) {
    console.error('Erro ao listar tipos de entidades:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar tipos de entidades' 
    });
  }
});

/**
 * GET /api/audit-logs/stats
 * Estatísticas de logs de auditoria
 */
router.get('/stats', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(String(days)));
    
    const [totalLogs, logsByAction, logsByUser, logsByDay] = await Promise.all([
      prisma.auditLog.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: startDate } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      prisma.$queryRaw`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM audit_logs
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);
    
    // Buscar nomes dos usuários
    const userIds = logsByUser.map(l => l.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });
    
    const userMap = new Map(users.map(u => [u.id, u.name]));
    
    res.json({
      totalLogs,
      logsByAction: logsByAction.map(l => ({
        action: l.action,
        count: l._count.action
      })),
      logsByUser: logsByUser.map(l => ({
        userId: l.userId,
        userName: userMap.get(l.userId) || 'Desconhecido',
        count: l._count.userId
      })),
      logsByDay
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar estatísticas de auditoria' 
    });
  }
});

export default router;
