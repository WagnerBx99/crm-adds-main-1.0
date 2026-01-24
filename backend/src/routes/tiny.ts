import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

const TINY_API_BASE_URL = process.env.TINY_API_BASE_URL || 'https://api.tiny.com.br/api2';

/**
 * Helper para fazer requisições à API Tiny
 */
async function tinyRequest(endpoint: string, token: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${TINY_API_BASE_URL}/${endpoint}`);
  
  const formData = new URLSearchParams();
  formData.append('token', token);
  formData.append('formato', 'json');
  
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });
  
  return response.json();
}

/**
 * GET /api/tiny/config
 * Obter configuração da integração Tiny
 */
router.get('/config', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration) {
      return res.json({
        configured: false,
        apiToken: null,
        lastSyncAt: null
      });
    }
    
    res.json({
      configured: !!integration.apiToken,
      apiToken: integration.apiToken ? '***' + integration.apiToken.slice(-4) : null,
      lastSyncAt: integration.lastSyncAt,
      syncStatus: integration.syncStatus
    });
  } catch (error) {
    console.error('Erro ao buscar configuração Tiny:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar configuração' 
    });
  }
});

/**
 * PUT /api/tiny/config
 * Atualizar configuração da integração Tiny
 */
router.put('/config', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { apiToken, config } = req.body;
    
    let integration = await prisma.tinyIntegration.findFirst();
    
    if (integration) {
      integration = await prisma.tinyIntegration.update({
        where: { id: integration.id },
        data: {
          apiToken: apiToken || undefined,
          config: config || undefined
        }
      });
    } else {
      integration = await prisma.tinyIntegration.create({
        data: {
          apiToken,
          config
        }
      });
    }
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_TINY_CONFIG',
        entityType: 'TINY_INTEGRATION',
        entityId: integration.id,
        details: 'Configuração da integração Tiny atualizada',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({
      configured: !!integration.apiToken,
      message: 'Configuração atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração Tiny:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar configuração' 
    });
  }
});

/**
 * GET /api/tiny/contas-pagar
 * Buscar contas a pagar da API Tiny
 */
router.get('/contas-pagar', authenticate, async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const { situacao, dataInicial, dataFinal } = req.query;
    
    const params: Record<string, string> = {};
    if (situacao) params.situacao = String(situacao);
    if (dataInicial) params.dataInicial = String(dataInicial);
    if (dataFinal) params.dataFinal = String(dataFinal);
    
    const result = await tinyRequest('contas.pagar.pesquisa.php', integration.apiToken, params);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar contas a pagar' 
    });
  }
});

/**
 * GET /api/tiny/contas-receber
 * Buscar contas a receber da API Tiny
 */
router.get('/contas-receber', authenticate, async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const { situacao, dataInicial, dataFinal } = req.query;
    
    const params: Record<string, string> = {};
    if (situacao) params.situacao = String(situacao);
    if (dataInicial) params.dataInicial = String(dataInicial);
    if (dataFinal) params.dataFinal = String(dataFinal);
    
    const result = await tinyRequest('contas.receber.pesquisa.php', integration.apiToken, params);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar contas a receber' 
    });
  }
});

/**
 * GET /api/tiny/resumo-financeiro
 * Buscar resumo financeiro
 */
router.get('/resumo-financeiro', authenticate, async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    // Buscar contas a pagar e receber em paralelo
    const [contasPagar, contasReceber] = await Promise.all([
      tinyRequest('contas.pagar.pesquisa.php', integration.apiToken, { situacao: 'aberto' }),
      tinyRequest('contas.receber.pesquisa.php', integration.apiToken, { situacao: 'aberto' })
    ]);
    
    // Calcular totais
    let totalPagar = 0;
    let totalReceber = 0;
    
    if (contasPagar?.retorno?.contas) {
      totalPagar = contasPagar.retorno.contas.reduce((sum: number, c: any) => {
        return sum + parseFloat(c.conta?.valor || 0);
      }, 0);
    }
    
    if (contasReceber?.retorno?.contas) {
      totalReceber = contasReceber.retorno.contas.reduce((sum: number, c: any) => {
        return sum + parseFloat(c.conta?.valor || 0);
      }, 0);
    }
    
    res.json({
      totalPagar,
      totalReceber,
      saldo: totalReceber - totalPagar,
      contasPagar: contasPagar?.retorno?.contas?.length || 0,
      contasReceber: contasReceber?.retorno?.contas?.length || 0
    });
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar resumo financeiro' 
    });
  }
});

/**
 * GET /api/tiny/produtos
 * Buscar produtos da API Tiny
 */
router.get('/produtos', authenticate, async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const { pesquisa } = req.query;
    
    const params: Record<string, string> = {};
    if (pesquisa) params.pesquisa = String(pesquisa);
    
    const result = await tinyRequest('produtos.pesquisa.php', integration.apiToken, params);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar produtos' 
    });
  }
});

/**
 * GET /api/tiny/contatos
 * Buscar contatos da API Tiny
 */
router.get('/contatos', authenticate, async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const { pesquisa } = req.query;
    
    const params: Record<string, string> = {};
    if (pesquisa) params.pesquisa = String(pesquisa);
    
    const result = await tinyRequest('contatos.pesquisa.php', integration.apiToken, params);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar contatos' 
    });
  }
});

/**
 * POST /api/tiny/sync/produtos
 * Sincronizar produtos da API Tiny para o banco local
 */
router.post('/sync/produtos', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const result = await tinyRequest('produtos.pesquisa.php', integration.apiToken);
    
    if (result?.retorno?.status !== 'OK') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: result?.retorno?.erros?.[0]?.erro || 'Erro ao buscar produtos da Tiny' 
      });
    }
    
    const produtos = result.retorno.produtos || [];
    let created = 0;
    let updated = 0;
    
    for (const p of produtos) {
      const produto = p.produto;
      
      // Verificar se já existe pelo tinyId
      const existing = await prisma.product.findFirst({
        where: { tinyId: String(produto.id) }
      });
      
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: produto.nome,
            sku: produto.codigo || undefined,
            price: produto.preco ? parseFloat(produto.preco) : undefined
          }
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: produto.nome,
            sku: produto.codigo || undefined,
            price: produto.preco ? parseFloat(produto.preco) : undefined,
            tinyId: String(produto.id)
          }
        });
        created++;
      }
    }
    
    // Atualizar status de sincronização
    await prisma.tinyIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: {
          ...(integration.syncStatus as any || {}),
          produtos: { lastSync: new Date(), created, updated }
        }
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SYNC_TINY_PRODUCTS',
        entityType: 'PRODUCT',
        details: `Sincronização Tiny: ${created} produtos criados, ${updated} atualizados`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({
      success: true,
      total: produtos.length,
      created,
      updated
    });
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao sincronizar produtos' 
    });
  }
});

/**
 * POST /api/tiny/sync/contatos
 * Sincronizar contatos da API Tiny para o banco local
 */
router.post('/sync/contatos', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const integration = await prisma.tinyIntegration.findFirst();
    
    if (!integration?.apiToken) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token da API Tiny não configurado' 
      });
    }
    
    const result = await tinyRequest('contatos.pesquisa.php', integration.apiToken);
    
    if (result?.retorno?.status !== 'OK') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: result?.retorno?.erros?.[0]?.erro || 'Erro ao buscar contatos da Tiny' 
      });
    }
    
    const contatos = result.retorno.contatos || [];
    let created = 0;
    let updated = 0;
    
    for (const c of contatos) {
      const contato = c.contato;
      
      // Verificar se já existe pelo tinyId
      const existing = await prisma.customer.findFirst({
        where: { tinyId: String(contato.id) }
      });
      
      if (existing) {
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: contato.nome,
            email: contato.email || undefined,
            phone: contato.fone || undefined,
            document: contato.cpf_cnpj || undefined
          }
        });
        updated++;
      } else {
        await prisma.customer.create({
          data: {
            name: contato.nome,
            email: contato.email || undefined,
            phone: contato.fone || undefined,
            document: contato.cpf_cnpj || undefined,
            tinyId: String(contato.id)
          }
        });
        created++;
      }
    }
    
    // Atualizar status de sincronização
    await prisma.tinyIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: {
          ...(integration.syncStatus as any || {}),
          contatos: { lastSync: new Date(), created, updated }
        }
      }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SYNC_TINY_CONTACTS',
        entityType: 'CUSTOMER',
        details: `Sincronização Tiny: ${created} contatos criados, ${updated} atualizados`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({
      success: true,
      total: contatos.length,
      created,
      updated
    });
  } catch (error) {
    console.error('Erro ao sincronizar contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao sincronizar contatos' 
    });
  }
});

export default router;
