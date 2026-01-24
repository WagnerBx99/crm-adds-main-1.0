import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/config
 * Listar todas as configurações
 */
router.get('/', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    });
    
    // Converter para objeto chave-valor
    const configObj: Record<string, any> = {};
    configs.forEach(c => {
      configObj[c.key] = c.value;
    });
    
    res.json(configObj);
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar configurações' 
    });
  }
});

/**
 * GET /api/config/:key
 * Obter configuração por chave
 */
router.get('/:key', authenticate, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    
    if (!config) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Configuração não encontrada' 
      });
    }
    
    res.json(config.value);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar configuração' 
    });
  }
});

/**
 * PUT /api/config/:key
 * Atualizar ou criar configuração
 */
router.put('/:key', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Valor é obrigatório' 
      });
    }
    
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_CONFIG',
        entityType: 'SYSTEM_CONFIG',
        entityId: config.id,
        details: `Configuração "${key}" atualizada`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar configuração' 
    });
  }
});

/**
 * DELETE /api/config/:key
 * Excluir configuração
 */
router.delete('/:key', authenticate, authorize('MASTER'), async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    
    if (!config) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Configuração não encontrada' 
      });
    }
    
    await prisma.systemConfig.delete({
      where: { key }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_CONFIG',
        entityType: 'SYSTEM_CONFIG',
        entityId: config.id,
        details: `Configuração "${key}" excluída`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Configuração excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao excluir configuração' 
    });
  }
});

/**
 * POST /api/config/bulk
 * Atualizar múltiplas configurações de uma vez
 */
router.post('/bulk', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { configs } = req.body;
    
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Objeto de configurações é obrigatório' 
      });
    }
    
    const results = [];
    
    for (const [key, value] of Object.entries(configs)) {
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any }
      });
      results.push(config);
    }
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BULK_UPDATE_CONFIG',
        entityType: 'SYSTEM_CONFIG',
        details: `${results.length} configurações atualizadas`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(results);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar configurações' 
    });
  }
});

export default router;
