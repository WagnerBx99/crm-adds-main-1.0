import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/products
 * Listar todos os produtos
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, active, page = '1', limit = '100' } = req.query;
    
    const where: any = {};
    
    if (active !== undefined) {
      where.active = active === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.product.count({ where })
    ]);
    
    res.json({
      data: products,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar produtos' 
    });
  }
});

/**
 * GET /api/products/:id
 * Obter produto por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Produto não encontrado' 
      });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar produto' 
    });
  }
});

/**
 * POST /api/products
 * Criar novo produto
 */
router.post('/', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { name, sku, description, price, imageUrl, tinyId, active } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome é obrigatório' 
      });
    }
    
    // Verificar se SKU já existe
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku }
      });
      
      if (existingSku) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'SKU já cadastrado' 
        });
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        price: price ? parseFloat(price) : undefined,
        imageUrl,
        tinyId,
        active: active !== undefined ? active : true
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: `Produto "${product.name}" criado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar produto' 
    });
  }
});

/**
 * PUT /api/products/:id
 * Atualizar produto
 */
router.put('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, description, price, imageUrl, tinyId, active } = req.body;
    
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Produto não encontrado' 
      });
    }
    
    // Verificar se SKU já existe (se estiver sendo alterado)
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku }
      });
      
      if (existingSku) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'SKU já cadastrado' 
        });
      }
    }
    
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || undefined,
        sku: sku !== undefined ? sku : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        tinyId: tinyId !== undefined ? tinyId : undefined,
        active: active !== undefined ? active : undefined
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: `Produto "${product.name}" atualizado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar produto' 
    });
  }
});

/**
 * DELETE /api/products/:id
 * Desativar produto (soft delete)
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Produto não encontrado' 
      });
    }
    
    await prisma.product.update({
      where: { id },
      data: { active: false }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: id,
        details: `Produto "${product.name}" desativado`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar produto:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao desativar produto' 
    });
  }
});

/**
 * POST /api/products/bulk
 * Importar produtos em lote
 */
router.post('/bulk', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Lista de produtos é obrigatória' 
      });
    }
    
    const created = [];
    const errors = [];
    
    for (const p of products) {
      try {
        if (!p.name) {
          errors.push({ product: p, error: 'Nome é obrigatório' });
          continue;
        }
        
        // Verificar SKU duplicado
        if (p.sku) {
          const existing = await prisma.product.findUnique({
            where: { sku: p.sku }
          });
          
          if (existing) {
            // Atualizar existente
            const updated = await prisma.product.update({
              where: { id: existing.id },
              data: {
                name: p.name,
                description: p.description,
                price: p.price ? parseFloat(p.price) : undefined,
                imageUrl: p.imageUrl,
                tinyId: p.tinyId,
                active: true
              }
            });
            created.push({ ...updated, action: 'updated' });
            continue;
          }
        }
        
        const product = await prisma.product.create({
          data: {
            name: p.name,
            sku: p.sku,
            description: p.description,
            price: p.price ? parseFloat(p.price) : undefined,
            imageUrl: p.imageUrl,
            tinyId: p.tinyId,
            active: true
          }
        });
        created.push({ ...product, action: 'created' });
      } catch (err: any) {
        errors.push({ product: p, error: err.message });
      }
    }
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BULK_IMPORT_PRODUCTS',
        entityType: 'PRODUCT',
        details: `Importação em lote: ${created.length} produtos processados, ${errors.length} erros`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({
      success: created.length,
      errors: errors.length,
      created,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Erro na importação em lote:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro na importação em lote' 
    });
  }
});

export default router;
