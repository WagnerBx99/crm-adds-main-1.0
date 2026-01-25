import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import publicQuoteRoutes from './routes/publicQuotes.js';
import publicContactRoutes from './routes/publicContacts.js';
import labelRoutes from './routes/labels.js';
import auditLogRoutes from './routes/auditLogs.js';
import configRoutes from './routes/config.js';
import tinyRoutes from './routes/tiny.js';
import artApprovalRoutes from './routes/artApproval.js';

// Importar middlewares
import { rateLimiters, globalRateLimiter, getRateLimiterStats } from './middlewares/rateLimiter.js';

// Importar Swagger
import { setupSwagger } from './swagger.js';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Prisma Client
export const prisma = new PrismaClient();

// Criar aplicação Express
const app = express();

// Middlewares globais
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy para obter IP real atrás de Nginx/Load Balancer
app.set('trust proxy', 1);

// Configurar Swagger (documentação da API)
setupSwagger(app);

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Rotas de health check (sem rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString() 
    });
  }
});

// Endpoint de estatísticas do rate limiter (apenas para admins)
app.get('/api/rate-limit-stats', (req, res) => {
  // Verificar se é uma requisição interna ou de admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(getRateLimiterStats());
});

// ============================================
// ROTAS COM RATE LIMITING ESPECÍFICO
// ============================================

// Autenticação - rate limiting restritivo para prevenir força bruta
app.use('/api/auth/login', rateLimiters.authLogin);
app.use('/api/auth', authRoutes);

// Aprovação de arte pública - rate limiting para links públicos
app.use('/api/art-approval/public', rateLimiters.artApprovalPublic);
app.use('/api/art-approval', artApprovalRoutes);

// Orçamentos públicos - rate limiting moderado
app.use('/api/public-quotes', rateLimiters.publicQuotes, publicQuoteRoutes);

// Contatos públicos - rate limiting moderado
app.use('/api/public-contacts', rateLimiters.publicContacts, publicContactRoutes);

// ============================================
// ROTAS COM RATE LIMITING GERAL
// ============================================

// Aplicar rate limiting geral para todas as outras rotas da API
app.use('/api', globalRateLimiter);

// Rotas protegidas (requerem autenticação)
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/config', configRoutes);
app.use('/api/tiny', tinyRoutes);

// Middleware de erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Token inválido ou expirado' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Rota não encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

async function main() {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 API disponível em http://localhost:${PORT}/api`);
      console.log(`📚 Documentação disponível em http://localhost:${PORT}/api/docs`);
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🛡️ Rate limiting ativado`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
