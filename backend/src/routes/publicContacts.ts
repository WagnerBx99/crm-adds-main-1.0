import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/public-contacts
 * Listar contatos públicos
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, tipoPessoa, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (tipoPessoa) {
      where.tipoPessoa = tipoPessoa;
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { cpfCnpj: { contains: String(search) } },
        { cidade: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    const [contacts, total] = await Promise.all([
      prisma.publicContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(String(limit))
      }),
      prisma.publicContact.count({ where })
    ]);
    
    res.json({
      data: contacts,
      pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        totalPages: Math.ceil(total / parseInt(String(limit)))
      }
    });
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao listar contatos' 
    });
  }
});

/**
 * GET /api/public-contacts/:id
 * Obter contato por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const contact = await prisma.publicContact.findUnique({
      where: { id }
    });
    
    if (!contact) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Contato não encontrado' 
      });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao buscar contato' 
    });
  }
});

/**
 * POST /api/public-contacts
 * Criar novo contato público (não requer autenticação)
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      nome, nomeFantasia, tipoPessoa, cpfCnpj, inscricaoEstadual,
      inscricaoMunicipal, fone, email, cep, endereco, numero,
      complemento, bairro, cidade, uf, tinyId
    } = req.body;
    
    if (!nome || !cpfCnpj || !email || !fone) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Nome, CPF/CNPJ, email e telefone são obrigatórios' 
      });
    }
    
    // Verificar se CPF/CNPJ já existe
    const existingContact = await prisma.publicContact.findFirst({
      where: { cpfCnpj }
    });
    
    if (existingContact) {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'CPF/CNPJ já cadastrado' 
      });
    }
    
    const contact = await prisma.publicContact.create({
      data: {
        nome,
        nomeFantasia,
        tipoPessoa: tipoPessoa || 'FISICA',
        cpfCnpj,
        inscricaoEstadual,
        inscricaoMunicipal,
        fone,
        email,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        tinyId
      }
    });
    
    res.status(201).json(contact);
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao criar contato' 
    });
  }
});

/**
 * PUT /api/public-contacts/:id
 * Atualizar contato
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome, nomeFantasia, tipoPessoa, cpfCnpj, inscricaoEstadual,
      inscricaoMunicipal, fone, email, cep, endereco, numero,
      complemento, bairro, cidade, uf, tinyId
    } = req.body;
    
    const existingContact = await prisma.publicContact.findUnique({
      where: { id }
    });
    
    if (!existingContact) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Contato não encontrado' 
      });
    }
    
    const contact = await prisma.publicContact.update({
      where: { id },
      data: {
        nome: nome || undefined,
        nomeFantasia: nomeFantasia !== undefined ? nomeFantasia : undefined,
        tipoPessoa: tipoPessoa || undefined,
        cpfCnpj: cpfCnpj || undefined,
        inscricaoEstadual: inscricaoEstadual !== undefined ? inscricaoEstadual : undefined,
        inscricaoMunicipal: inscricaoMunicipal !== undefined ? inscricaoMunicipal : undefined,
        fone: fone || undefined,
        email: email || undefined,
        cep: cep !== undefined ? cep : undefined,
        endereco: endereco !== undefined ? endereco : undefined,
        numero: numero !== undefined ? numero : undefined,
        complemento: complemento !== undefined ? complemento : undefined,
        bairro: bairro !== undefined ? bairro : undefined,
        cidade: cidade !== undefined ? cidade : undefined,
        uf: uf !== undefined ? uf : undefined,
        tinyId: tinyId !== undefined ? tinyId : undefined
      }
    });
    
    res.json(contact);
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao atualizar contato' 
    });
  }
});

/**
 * DELETE /api/public-contacts/:id
 * Excluir contato
 */
router.delete('/:id', authenticate, authorize('MASTER', 'GESTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const contact = await prisma.publicContact.findUnique({
      where: { id }
    });
    
    if (!contact) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Contato não encontrado' 
      });
    }
    
    await prisma.publicContact.delete({
      where: { id }
    });
    
    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_CONTACT',
        entityType: 'PUBLIC_CONTACT',
        entityId: id,
        details: `Contato ${contact.nome} excluído`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    res.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Erro ao excluir contato' 
    });
  }
});

export default router;
