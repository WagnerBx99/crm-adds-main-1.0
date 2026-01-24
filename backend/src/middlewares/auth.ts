import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

// Estender o tipo Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token de autenticação não fornecido' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token de autenticação inválido' 
      });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Erro de configuração do servidor' 
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Verificar se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, active: true }
    });
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Usuário não encontrado ou inativo' 
      });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token expirado' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token inválido' 
      });
    }
    
    console.error('Erro de autenticação:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao processar autenticação' 
    });
  }
};

/**
 * Middleware para verificar roles específicas
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Usuário não autenticado' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Você não tem permissão para acessar este recurso' 
      });
    }
    
    next();
  };
};

/**
 * Middleware opcional de autenticação (não bloqueia se não houver token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, active: true }
    });
    
    if (user && user.active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };
    }
    
    next();
  } catch (error) {
    // Ignora erros de token inválido/expirado
    next();
  }
};
