/**
 * Configuração do Swagger para documentação da API
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM ADDS - API',
      version: '1.0.0',
      description: `
# API do CRM ADDS

Sistema de Gerenciamento de Pedidos da ADDS Brasil.

## Autenticação

A maioria dos endpoints requer autenticação via JWT. Para obter um token, use o endpoint \`POST /api/auth/login\`.

Inclua o token no header \`Authorization\` com o prefixo \`Bearer\`:

\`\`\`
Authorization: Bearer <seu_token>
\`\`\`

## Rate Limiting

A API possui rate limiting para proteger contra abusos:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Login | 5 req | 1 min |
| Endpoints públicos | 10-20 req | 1 min |
| API geral | 100 req | 1 min |

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 429 | Muitas requisições |
| 500 | Erro interno do servidor |
      `,
      contact: {
        name: 'ADDS Brasil',
        email: 'contato@addsbrasil.com.br',
      },
    },
    servers: [
      {
        url: 'http://31.97.253.85:3001/api',
        description: 'Servidor de Produção',
      },
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de Desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no endpoint de login',
        },
      },
      schemas: {
        // Schemas de Usuário
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@exemplo.com' },
            role: { type: 'string', enum: ['MASTER', 'GESTOR', 'PRESTADOR'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@exemplo.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Token JWT' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // Schemas de Cliente
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Empresa ABC' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '(11) 99999-9999' },
            address: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CustomerCreate: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Empresa ABC' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
          },
        },
        // Schemas de Pedido
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['FAZER', 'AJUSTE', 'APROVACAO', 'PRODUCAO', 'ENTREGA', 'FINALIZADO'] },
            title: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            customer: { $ref: '#/components/schemas/Customer' },
          },
        },
        OrderCreate: {
          type: 'object',
          required: ['customerId', 'title'],
          properties: {
            customerId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['FAZER', 'AJUSTE', 'APROVACAO', 'PRODUCAO', 'ENTREGA', 'FINALIZADO'] },
          },
        },
        // Schemas de Produto
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Schemas de Auditoria
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            action: { type: 'string', example: 'CREATE' },
            entityType: { type: 'string', example: 'order' },
            entityId: { type: 'string', format: 'uuid' },
            details: { type: 'string' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // Schemas de Paginação
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 50 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 2 },
          },
        },
        // Schemas de Erro
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Not Found' },
            message: { type: 'string', example: 'Recurso não encontrado' },
          },
        },
        RateLimitError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Too Many Requests' },
            message: { type: 'string', example: 'Muitas requisições. Por favor, aguarde.' },
            retryAfter: { type: 'integer', example: 300 },
            blockedUntil: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Autenticação e autorização' },
      { name: 'Users', description: 'Gerenciamento de usuários' },
      { name: 'Customers', description: 'Gerenciamento de clientes' },
      { name: 'Orders', description: 'Gerenciamento de pedidos' },
      { name: 'Products', description: 'Gerenciamento de produtos' },
      { name: 'Art Approval', description: 'Aprovação de arte' },
      { name: 'Audit Logs', description: 'Logs de auditoria' },
      { name: 'Config', description: 'Configurações do sistema' },
      { name: 'Tiny', description: 'Integração com Tiny ERP' },
      { name: 'Public', description: 'Endpoints públicos (sem autenticação)' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Servir documentação Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CRM ADDS - API Docs',
  }));

  // Servir especificação OpenAPI em JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default swaggerSpec;
