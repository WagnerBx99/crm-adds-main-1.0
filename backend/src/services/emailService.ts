/**
 * Serviço de Email - CRM ADDS
 * 
 * Gerencia o envio de emails para notificações do sistema,
 * incluindo aprovação de arte, alertas e comunicações.
 */

import nodemailer from 'nodemailer';

// Configuração do transporter (usando variáveis de ambiente)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Templates de email
const emailTemplates = {
  artworkReady: (data: {
    customerName: string;
    orderTitle: string;
    artworkName: string;
    approvalLink: string;
    expiresAt: string;
  }) => ({
    subject: `🎨 Arte pronta para aprovação - ${data.orderTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #5a6fd6; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Arte Pronta!</h1>
            <p>Sua arte está aguardando aprovação</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            
            <p>A arte do seu pedido está pronta para sua análise e aprovação!</p>
            
            <div class="info-box">
              <p><strong>📋 Pedido:</strong> ${data.orderTitle}</p>
              <p><strong>🎨 Arte:</strong> ${data.artworkName}</p>
              <p><strong>⏰ Link válido até:</strong> ${data.expiresAt}</p>
            </div>
            
            <p>Clique no botão abaixo para visualizar a arte e aprovar ou solicitar ajustes:</p>
            
            <center>
              <a href="${data.approvalLink}" class="button">Ver Arte e Aprovar</a>
            </center>
            
            <p><small>Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <a href="${data.approvalLink}">${data.approvalLink}</a></small></p>
          </div>
          <div class="footer">
            <p>ADDS Brasil - Sistema de Gerenciamento de Pedidos</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá ${data.customerName},
      
      A arte do seu pedido está pronta para sua análise e aprovação!
      
      Pedido: ${data.orderTitle}
      Arte: ${data.artworkName}
      Link válido até: ${data.expiresAt}
      
      Acesse o link para visualizar e aprovar: ${data.approvalLink}
      
      ADDS Brasil - Sistema de Gerenciamento de Pedidos
    `,
  }),

  artworkApproved: (data: {
    teamMemberName: string;
    customerName: string;
    orderTitle: string;
    artworkName: string;
    orderId: string;
  }) => ({
    subject: `✅ Arte aprovada - ${data.orderTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Arte Aprovada!</h1>
            <p>O cliente aprovou a arte</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.teamMemberName}</strong>,</p>
            
            <p>Ótima notícia! O cliente <strong>${data.customerName}</strong> aprovou a arte.</p>
            
            <div class="info-box">
              <p><strong>📋 Pedido:</strong> ${data.orderTitle}</p>
              <p><strong>🎨 Arte:</strong> ${data.artworkName}</p>
              <p><strong>👤 Aprovado por:</strong> ${data.customerName}</p>
            </div>
            
            <p>O pedido foi movido para a próxima etapa do fluxo.</p>
          </div>
          <div class="footer">
            <p>ADDS Brasil - Sistema de Gerenciamento de Pedidos</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá ${data.teamMemberName},
      
      Ótima notícia! O cliente ${data.customerName} aprovou a arte.
      
      Pedido: ${data.orderTitle}
      Arte: ${data.artworkName}
      
      O pedido foi movido para a próxima etapa do fluxo.
      
      ADDS Brasil
    `,
  }),

  artworkAdjustmentRequested: (data: {
    teamMemberName: string;
    customerName: string;
    orderTitle: string;
    artworkName: string;
    feedback: string;
    orderId: string;
  }) => ({
    subject: `🔄 Ajuste solicitado - ${data.orderTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .feedback-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffc107; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Ajuste Solicitado</h1>
            <p>O cliente solicitou alterações na arte</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.teamMemberName}</strong>,</p>
            
            <p>O cliente <strong>${data.customerName}</strong> solicitou ajustes na arte.</p>
            
            <div class="info-box">
              <p><strong>📋 Pedido:</strong> ${data.orderTitle}</p>
              <p><strong>🎨 Arte:</strong> ${data.artworkName}</p>
            </div>
            
            <div class="feedback-box">
              <p><strong>💬 Feedback do cliente:</strong></p>
              <p>"${data.feedback}"</p>
            </div>
            
            <p>O pedido foi movido para a coluna de Ajustes.</p>
          </div>
          <div class="footer">
            <p>ADDS Brasil - Sistema de Gerenciamento de Pedidos</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá ${data.teamMemberName},
      
      O cliente ${data.customerName} solicitou ajustes na arte.
      
      Pedido: ${data.orderTitle}
      Arte: ${data.artworkName}
      
      Feedback do cliente:
      "${data.feedback}"
      
      O pedido foi movido para a coluna de Ajustes.
      
      ADDS Brasil
    `,
  }),
};

// Classe do serviço de email
class EmailService {
  private enabled: boolean;

  constructor() {
    this.enabled = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!this.enabled) {
      console.log('⚠️ [EmailService] SMTP não configurado. Emails serão apenas logados.');
    }
  }

  /**
   * Envia um email
   */
  async send(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      if (!this.enabled) {
        console.log(`📧 [EmailService] Email simulado para ${to}:`);
        console.log(`   Assunto: ${subject}`);
        return true;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ [EmailService] Email enviado para ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailService] Erro ao enviar email:`, error);
      return false;
    }
  }

  /**
   * Notifica cliente que a arte está pronta para aprovação
   */
  async notifyArtworkReady(data: {
    customerEmail: string;
    customerName: string;
    orderTitle: string;
    artworkName: string;
    approvalLink: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const template = emailTemplates.artworkReady({
      customerName: data.customerName,
      orderTitle: data.orderTitle,
      artworkName: data.artworkName,
      approvalLink: data.approvalLink,
      expiresAt: new Date(data.expiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    return this.send(data.customerEmail, template.subject, template.html, template.text);
  }

  /**
   * Notifica equipe que a arte foi aprovada
   */
  async notifyArtworkApproved(data: {
    teamEmails: string[];
    teamMemberName: string;
    customerName: string;
    orderTitle: string;
    artworkName: string;
    orderId: string;
  }): Promise<boolean> {
    const template = emailTemplates.artworkApproved(data);

    const results = await Promise.all(
      data.teamEmails.map((email) => this.send(email, template.subject, template.html, template.text))
    );

    return results.every((r) => r);
  }

  /**
   * Notifica equipe que foi solicitado ajuste na arte
   */
  async notifyArtworkAdjustmentRequested(data: {
    teamEmails: string[];
    teamMemberName: string;
    customerName: string;
    orderTitle: string;
    artworkName: string;
    feedback: string;
    orderId: string;
  }): Promise<boolean> {
    const template = emailTemplates.artworkAdjustmentRequested(data);

    const results = await Promise.all(
      data.teamEmails.map((email) => this.send(email, template.subject, template.html, template.text))
    );

    return results.every((r) => r);
  }

  /**
   * Verifica se o serviço de email está configurado
   */
  isConfigured(): boolean {
    return this.enabled;
  }
}

export const emailService = new EmailService();
export default emailService;
