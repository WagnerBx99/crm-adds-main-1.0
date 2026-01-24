import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/users
 * Listar todos os usuários
 */
router.get('/', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { role, active, search, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (active !== undefined) {
      where.active = active === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          department: true,
          avatar: true,
          active: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      data: users,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar usuários' 
    });
  }
});

/**
 * GET /api/users/:id
 * Obter usuário por ID
 */
router.get('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        avatar: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Usuário não encontrado' 
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar usuário' 
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualizar usuário
 */
router.put('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, department, active } = req.body;
    
    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Usuário não encontrado' 
      });
    }
    
    // GESTOR não pode editar MASTER
    if (req.user?.role === 'GESTOR' && existingUser.role === 'MASTER') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'GESTOR não pode editar usuários MASTER' 
      });
    }
    
    // GESTOR não pode promover para MASTER
    if (req.user?.role === 'GESTOR' && role === 'MASTER') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'GESTOR não pode promover usuários para MASTER' 
      });
    }
    
    // Verificar se email já existe (se estiver sendo alterado)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      if (emailExists) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'Email já cadastrado' 
        });
      }
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email ? email.toLowerCase() : undefined,
        role: role || undefined,
        phone: phone !== undefined ? phone : undefined,
        department: department !== undefined ? department : undefined,
        active: active !== undefined ? active : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        avatar: true,
        active: true,
        createdAt: true,
        lastLogin: true
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: `Usuário ${user.email} atualizado por ${req.user?.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar usuário' 
    });
  }
});

/**
 * DELETE /api/users/:id
 * Desativar usuário (soft delete)
 */
router.delete('/:id', authenticate, authorize('MASTER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Não permitir auto-exclusão
    if (id === req.user?.id) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Você não pode desativar sua própria conta' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Usuário não encontrado' 
      });
    }
    
    await prisma.user.update({
      where: { id },
      data: { active: false }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: id,
        details: `Usuário ${user.email} desativado por ${req.user?.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao desativar usuário' 
    });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Resetar senha de um usuário
 */
router.post('/:id/reset-password', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nova senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Usuário não encontrado' 
      });
    }
    
    // GESTOR não pode resetar senha de MASTER
    if (req.user?.role === 'GESTOR' && user.role === 'MASTER') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'GESTOR não pode resetar senha de usuários MASTER' 
      });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id },
      data: { 
        passwordHash,
        passwordResetAt: new Date()
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'RESET_PASSWORD',
        entityType: 'USER',
        entityId: id,
        details: `Senha do usuário ${user.email} resetada por ${req.user?.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao resetar senha' 
    });
  }
});

export default router;
