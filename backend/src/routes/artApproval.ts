/**
 * Rotas de Aprovação de Arte - CRM ADDS
 * 
 * Gerencia o fluxo completo de aprovação de artes:
 * - Upload de artes
 * - Geração de links públicos
 * - Processamento de aprovações
 * - Histórico de versões
 * - Notificações por email
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.js';
import { emailService } from '../services/emailService.js';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Tipo para request autenticado
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

/**
 * POST /api/art-approval/upload
 * Upload de arte finalizada para um pedido
 */
router.post('/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, artworkData, artworkName, artworkType } = req.body;
    const userId = req.user!.id;

    // Verificar se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, assignedTo: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Criar registro da arte usando o modelo ArtworkImage
    const artwork = await prisma.artworkImage.create({
      data: {
        orderId,
        name: artworkName,
        url: artworkData, // Base64 ou URL
        type: artworkType || 'image/png',
        uploadedById: userId,
        status: 'pending',
        version: 1,
      },
    });

    // Registrar no histórico usando HistoryEntry
    await prisma.historyEntry.create({
      data: {
        orderId,
        status: 'AGUARDANDO_APROVACAO',
        comment: `Arte "${artworkName}" enviada para aprovação`,
        userId,
      },
    });

    // Atualizar status do pedido
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'AGUARDANDO_APROVACAO' },
    });

    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'artwork',
        entityId: artwork.id,
        details: JSON.stringify({ artworkName, orderId }),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Arte enviada com sucesso',
      artwork,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao enviar arte', details: error.message });
  }
});

/**
 * POST /api/art-approval/generate-link
 * Gera link público para aprovação de arte
 */
router.post('/generate-link', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, artworkId, sendEmail = true } = req.body;
    const userId = req.user!.id;

    // Buscar pedido com cliente
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Buscar arte
    const artwork = await prisma.artworkImage.findFirst({
      where: { id: artworkId, orderId },
    });

    if (!artwork) {
      return res.status(404).json({ error: 'Arte não encontrada' });
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Criar token de aprovação
    const approvalToken = await prisma.artworkApprovalToken.create({
      data: {
        orderId,
        artworkId,
        token,
        expiresAt,
        createdById: userId,
      },
    });

    // Construir link de aprovação
    const baseUrl = process.env.FRONTEND_URL || 'https://crm-adds-main-1-0.vercel.app';
    const approvalLink = `${baseUrl}/arte/aprovar/${token}`;

    // Enviar email se solicitado e se o cliente tiver email
    let emailSent = false;
    if (sendEmail && order.customer?.email) {
      emailSent = await emailService.notifyArtworkReady({
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        orderTitle: order.title,
        artworkName: artwork.name,
        approvalLink,
        expiresAt,
      });
    }

    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'approval_link',
        entityId: approvalToken.id,
        details: JSON.stringify({ orderId, artworkId, expiresAt }),
      },
    });

    res.json({
      success: true,
      message: 'Link de aprovação gerado com sucesso',
      approvalLink,
      token: approvalToken,
      emailSent,
      expiresAt,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro ao gerar link:', error);
    res.status(500).json({ error: 'Erro ao gerar link', details: error.message });
  }
});

/**
 * POST /api/art-approval/new-version
 * Upload de nova versão da arte (após ajuste)
 */
router.post('/new-version', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, previousArtworkId, artworkData, artworkName, artworkType } = req.body;
    const userId = req.user!.id;

    // Buscar arte anterior
    const previousArtwork = await prisma.artworkImage.findFirst({
      where: { id: previousArtworkId, orderId },
    });

    if (!previousArtwork) {
      return res.status(404).json({ error: 'Arte anterior não encontrada' });
    }

    // Calcular nova versão
    const newVersion = (previousArtwork.version || 1) + 1;

    // Marcar arte anterior como substituída
    await prisma.artworkImage.update({
      where: { id: previousArtworkId },
      data: { 
        status: 'adjustment_requested',
        replacedAt: new Date(),
        replacedById: userId,
      },
    });

    // Criar nova versão da arte
    const newArtwork = await prisma.artworkImage.create({
      data: {
        orderId,
        name: artworkName || `${previousArtwork.name} (v${newVersion})`,
        url: artworkData,
        type: artworkType || previousArtwork.type,
        uploadedById: userId,
        status: 'pending',
        version: newVersion,
        previousVersionId: previousArtworkId,
      },
    });

    // Registrar no histórico
    await prisma.historyEntry.create({
      data: {
        orderId,
        status: 'AGUARDANDO_APROVACAO',
        comment: `Nova versão da arte (v${newVersion}) enviada para aprovação`,
        userId,
      },
    });

    // Atualizar status do pedido
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'AGUARDANDO_APROVACAO' },
    });

    res.status(201).json({
      success: true,
      message: `Nova versão (v${newVersion}) enviada com sucesso`,
      artwork: newArtwork,
      previousVersion: previousArtwork,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro ao criar nova versão:', error);
    res.status(500).json({ error: 'Erro ao criar nova versão', details: error.message });
  }
});

/**
 * GET /api/art-approval/history/:orderId
 * Obtém histórico de versões de arte de um pedido
 */
router.get('/history/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const artworks = await prisma.artworkImage.findMany({
      where: { orderId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { version: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Buscar tokens de aprovação
    const tokens = await prisma.artworkApprovalToken.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      artworks,
      tokens,
      totalVersions: artworks.length,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico', details: error.message });
  }
});

// ============================================
// ROTAS PÚBLICAS (não requerem autenticação)
// ============================================

/**
 * GET /api/art-approval/public/:token
 * Obtém dados para a página pública de aprovação
 */
router.get('/public/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Buscar token
    const approvalToken = await prisma.artworkApprovalToken.findUnique({
      where: { token },
    });

    if (!approvalToken) {
      return res.status(404).json({ error: 'Link de aprovação inválido' });
    }

    // Verificar expiração
    if (new Date(approvalToken.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Este link de aprovação expirou' });
    }

    // Verificar se já foi usado
    if (approvalToken.used) {
      return res.status(410).json({ error: 'Este link de aprovação já foi utilizado' });
    }

    // Buscar pedido e arte
    const order = await prisma.order.findUnique({
      where: { id: approvalToken.orderId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const artwork = await prisma.artworkImage.findFirst({
      where: { id: approvalToken.artworkId },
    });

    if (!artwork) {
      return res.status(404).json({ error: 'Arte não encontrada' });
    }

    // Buscar comentários anteriores (se houver)
    const comments = await prisma.comment.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      order: {
        id: order.id,
        title: order.title,
        description: order.description,
        customer: order.customer,
      },
      artwork: {
        id: artwork.id,
        name: artwork.name,
        url: artwork.url,
        type: artwork.type,
        version: artwork.version,
        status: artwork.status,
      },
      token: {
        expiresAt: approvalToken.expiresAt,
      },
      comments,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro ao buscar dados públicos:', error);
    res.status(500).json({ error: 'Erro ao carregar dados', details: error.message });
  }
});

/**
 * POST /api/art-approval/public/:token/decide
 * Processa decisão de aprovação (público)
 */
router.post('/public/:token/decide', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { decision, clientName, feedback } = req.body;

    if (!decision || !clientName) {
      return res.status(400).json({ error: 'Decisão e nome do cliente são obrigatórios' });
    }

    if (decision !== 'approved' && decision !== 'adjustment_requested') {
      return res.status(400).json({ error: 'Decisão inválida' });
    }

    if (decision === 'adjustment_requested' && !feedback) {
      return res.status(400).json({ error: 'Feedback é obrigatório para solicitação de ajuste' });
    }

    // Buscar token
    const approvalToken = await prisma.artworkApprovalToken.findUnique({
      where: { token },
    });

    if (!approvalToken) {
      return res.status(404).json({ error: 'Link de aprovação inválido' });
    }

    if (new Date(approvalToken.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Este link de aprovação expirou' });
    }

    if (approvalToken.used) {
      return res.status(410).json({ error: 'Este link de aprovação já foi utilizado' });
    }

    // Buscar pedido e arte
    const order = await prisma.order.findUnique({
      where: { id: approvalToken.orderId },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const artwork = await prisma.artworkImage.findFirst({
      where: { id: approvalToken.artworkId },
    });

    if (!artwork) {
      return res.status(404).json({ error: 'Arte não encontrada' });
    }

    // Atualizar token como usado
    await prisma.artworkApprovalToken.update({
      where: { id: approvalToken.id },
      data: {
        used: true,
        usedAt: new Date(),
        clientName,
        clientDecision: decision,
        clientFeedback: feedback,
      },
    });

    // Atualizar status da arte
    await prisma.artworkImage.update({
      where: { id: artwork.id },
      data: {
        status: decision,
        approvedAt: decision === 'approved' ? new Date() : null,
        approvedBy: decision === 'approved' ? clientName : null,
      },
    });

    // Determinar novo status do pedido
    const newOrderStatus = decision === 'approved' ? 'ARTE_APROVADA' : 'AJUSTE';

    // Atualizar pedido
    await prisma.order.update({
      where: { id: order.id },
      data: { status: newOrderStatus },
    });

    // Criar comentário se for ajuste (buscar um usuário do sistema para associar)
    if (decision === 'adjustment_requested' && feedback) {
      const systemUser = await prisma.user.findFirst({
        where: { role: 'MASTER' },
      });
      
      if (systemUser) {
        await prisma.comment.create({
          data: {
            orderId: order.id,
            text: `[Cliente: ${clientName}] ${feedback}`,
            userId: systemUser.id,
          },
        });
      }
    }

    // Registrar no histórico (buscar um usuário do sistema)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'MASTER' },
    });
    
    if (systemUser) {
      await prisma.historyEntry.create({
        data: {
          orderId: order.id,
          status: newOrderStatus,
          comment: decision === 'approved'
            ? `Arte aprovada por ${clientName} via link público`
            : `Ajuste solicitado por ${clientName}: "${feedback}"`,
          userId: systemUser.id,
        },
      });
    }

    // Buscar emails da equipe para notificação
    const teamMembers = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: ['MASTER', 'GESTOR'] },
      },
      select: { email: true, name: true },
    });

    const teamEmails = teamMembers.map((m) => m.email);

    // Enviar notificação para a equipe
    if (decision === 'approved') {
      await emailService.notifyArtworkApproved({
        teamEmails,
        teamMemberName: 'Equipe',
        customerName: clientName,
        orderTitle: order.title,
        artworkName: artwork.name,
        orderId: order.id,
      });
    } else {
      await emailService.notifyArtworkAdjustmentRequested({
        teamEmails,
        teamMemberName: 'Equipe',
        customerName: clientName,
        orderTitle: order.title,
        artworkName: artwork.name,
        feedback: feedback || '',
        orderId: order.id,
      });
    }

    res.json({
      success: true,
      message: decision === 'approved'
        ? 'Arte aprovada com sucesso!'
        : 'Solicitação de ajuste enviada com sucesso!',
      decision,
      newOrderStatus,
    });
  } catch (error: any) {
    console.error('[ArtApproval] Erro ao processar decisão:', error);
    res.status(500).json({ error: 'Erro ao processar decisão', details: error.message });
  }
});

export default router;
