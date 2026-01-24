import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Autenticar usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Email ou senha inválidos' 
      });
    }
    
    if (!user.active) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Usuário inativo. Entre em contato com o administrador.' 
      });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Email ou senha inválidos' 
      });
    }
    
    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Erro de configuração do servidor' 
      });
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      jwtSecret,
      { expiresIn } as jwt.SignOptions
    );
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: `Usuário ${user.email} fez login`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao processar login' 
    });
  }
});

/**
 * POST /api/auth/register
 * Registrar novo usuário (apenas MASTER pode criar)
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    // Verificar se é MASTER ou GESTOR
    if (req.user?.role !== 'MASTER' && req.user?.role !== 'GESTOR') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Apenas MASTER ou GESTOR podem criar usuários' 
      });
    }
    
    const { name, email, password, role, phone, department } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome, email e senha são obrigatórios' 
      });
    }
    
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'Email já cadastrado' 
      });
    }
    
    // GESTOR não pode criar MASTER
    if (req.user?.role === 'GESTOR' && role === 'MASTER') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'GESTOR não pode criar usuários MASTER' 
      });
    }
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'PRESTADOR',
        phone,
        department,
        createdById: req.user?.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        active: true,
        createdAt: true
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: `Usuário ${user.email} criado por ${req.user?.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar usuário' 
    });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
      message: 'Erro ao buscar dados do usuário' 
    });
  }
});

/**
 * PUT /api/auth/password
 * Alterar senha do usuário autenticado
 */
router.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Senha atual e nova senha são obrigatórias' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nova senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Senha atual incorreta' 
      });
    }
    
    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash,
        passwordResetAt: new Date()
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        entityType: 'USER',
        entityId: user.id,
        details: `Usuário ${user.email} alterou sua senha`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao alterar senha' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Registrar logout (apenas para auditoria)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user!.id,
        details: `Usuário ${req.user?.email} fez logout`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao processar logout' 
    });
  }
});

export default router;
