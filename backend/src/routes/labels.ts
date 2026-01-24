import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/labels
 * Listar todas as etiquetas
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    
    const where: any = {};
    
    if (active !== undefined) {
      where.active = active === 'true';
    }
    
    const labels = await prisma.label.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    res.json(labels);
  } catch (error) {
    console.error('Erro ao listar etiquetas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar etiquetas' 
    });
  }
});

/**
 * GET /api/labels/:id
 * Obter etiqueta por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const label = await prisma.label.findUnique({
      where: { id }
    });
    
    if (!label) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Etiqueta não encontrada' 
      });
    }
    
    res.json(label);
  } catch (error) {
    console.error('Erro ao buscar etiqueta:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar etiqueta' 
    });
  }
});

/**
 * POST /api/labels
 * Criar nova etiqueta
 */
router.post('/', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { name, color, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome é obrigatório' 
      });
    }
    
    // Verificar se nome já existe
    const existingLabel = await prisma.label.findUnique({
      where: { name }
    });
    
    if (existingLabel) {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'Etiqueta com este nome já existe' 
      });
    }
    
    const label = await prisma.label.create({
      data: {
        name,
        color: color || '#3b82f6',
        description
      }
    });
    
    res.status(201).json(label);
  } catch (error) {
    console.error('Erro ao criar etiqueta:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar etiqueta' 
    });
  }
});

/**
 * PUT /api/labels/:id
 * Atualizar etiqueta
 */
router.put('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, description, active } = req.body;
    
    const existingLabel = await prisma.label.findUnique({
      where: { id }
    });
    
    if (!existingLabel) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Etiqueta não encontrada' 
      });
    }
    
    // Verificar se nome já existe (se estiver sendo alterado)
    if (name && name !== existingLabel.name) {
      const nameExists = await prisma.label.findUnique({
        where: { name }
      });
      
      if (nameExists) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'Etiqueta com este nome já existe' 
        });
      }
    }
    
    const label = await prisma.label.update({
      where: { id },
      data: {
        name: name || undefined,
        color: color || undefined,
        description: description !== undefined ? description : undefined,
        active: active !== undefined ? active : undefined
      }
    });
    
    res.json(label);
  } catch (error) {
    console.error('Erro ao atualizar etiqueta:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar etiqueta' 
    });
  }
});

/**
 * DELETE /api/labels/:id
 * Desativar etiqueta
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const label = await prisma.label.findUnique({
      where: { id }
    });
    
    if (!label) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Etiqueta não encontrada' 
      });
    }
    
    await prisma.label.update({
      where: { id },
      data: { active: false }
    });
    
    res.json({ message: 'Etiqueta desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar etiqueta:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao desativar etiqueta' 
    });
  }
});

export default router;
