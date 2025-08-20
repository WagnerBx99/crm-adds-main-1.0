/**
 * Templates de Email para Notificações de Segurança
 * 
 * Este módulo fornece templates HTML e texto para emails de notificações
 * de segurança do sistema.
 */

import { LogEntry } from './logService';

// Definição do enum de templates até integração completa
export enum NotificationTemplate {
  LOGIN_NEW_DEVICE = 'LOGIN_NEW_DEVICE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_SETTING_CHANGED = 'SECURITY_SETTING_CHANGED',
  DATA_EXPORT = 'DATA_EXPORT',
  ADMIN_ACTION_SUMMARY = 'ADMIN_ACTION_SUMMARY'
}

// Interface para template de email
export interface EmailTemplate {
  subject: string;
  textContent: string;
  htmlContent: string;
}

/**
 * Gerar um template de email com base no tipo e dados
 * @param template Tipo de template
 * @param data Dados para o template
 * @returns Template de email
 */
export function generateEmailTemplate(
  template: NotificationTemplate,
  data: {
    username?: string;
    timestamp?: number;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    details?: any;
    applicationName?: string;
  }
): EmailTemplate {
  // Nome da aplicação (pode vir da configuração)
  const appName = data.applicationName || 'CRM Empresarial';
  const username = data.username || 'Usuário';
  const date = data.timestamp 
    ? new Date(data.timestamp).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');
  const time = data.timestamp 
    ? new Date(data.timestamp).toLocaleTimeString('pt-BR') 
    : new Date().toLocaleTimeString('pt-BR');
  
  // Template base para todos os emails
  const baseHtmlTemplate = (content: string): string => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificação de Segurança</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1a56db;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 5px 5px;
          border: 1px solid #ddd;
          border-top: none;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px 15px;
          margin: 20px 0;
        }
        .critical {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 10px 15px;
          margin: 20px 0;
        }
        .info {
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 10px 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #777;
        }
        .button {
          display: inline-block;
          background-color: #1a56db;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Notificação de Segurança</h1>
        </div>
        <div class="content">
          ${content}
          <div class="footer">
            <p>Esta é uma mensagem automática do sistema de segurança do ${appName}.</p>
            <p>Se você não reconhece esta atividade, por favor entre em contato com o suporte imediatamente.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName} - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Selecionar template específico com base no tipo
  switch (template) {
    case NotificationTemplate.LOGIN_NEW_DEVICE:
      return {
        subject: `[${appName}] Alerta de Segurança: Login em Novo Dispositivo`,
        textContent: 
          `Olá ${username},\n\n` +
          `Detectamos um login na sua conta usando um dispositivo que você não utilizou anteriormente.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Endereço IP: ${data.ipAddress || 'Não disponível'}\n` +
          `Navegador/Dispositivo: ${data.userAgent || 'Não disponível'}\n\n` +
          `Se foi você quem realizou este acesso, você pode ignorar este email.\n\n` +
          `Se você não reconhece esta atividade, sua conta pode estar comprometida. Recomendamos que você:\n` +
          `1. Altere sua senha imediatamente\n` +
          `2. Verifique seus dados cadastrais\n` +
          `3. Entre em contato com o suporte\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Alerta de Segurança: Login em Novo Dispositivo</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Detectamos um login na sua conta usando um dispositivo que você não utilizou anteriormente.</p>
          
          <div class="warning">
            <p><strong>Detalhes do Acesso:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Endereço IP</th>
                <td>${data.ipAddress || 'Não disponível'}</td>
              </tr>
              <tr>
                <th>Navegador/Dispositivo</th>
                <td>${data.userAgent || 'Não disponível'}</td>
              </tr>
            </table>
          </div>
          
          <p>Se foi você quem realizou este acesso, você pode ignorar este email.</p>
          
          <p>Se você <strong>não reconhece esta atividade</strong>, sua conta pode estar comprometida. Recomendamos que você:</p>
          <ol>
            <li>Altere sua senha imediatamente</li>
            <li>Verifique seus dados cadastrais</li>
            <li>Entre em contato com o suporte</li>
          </ol>
          
          <a href="#" class="button">Verificar Minha Conta</a>
        `)
      };
      
    case NotificationTemplate.PASSWORD_CHANGED:
      return {
        subject: `[${appName}] Sua senha foi alterada`,
        textContent: 
          `Olá ${username},\n\n` +
          `Sua senha foi alterada recentemente.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Endereço IP: ${data.ipAddress || 'Não disponível'}\n\n` +
          `Se você não fez esta alteração, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Sua senha foi alterada</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Sua senha foi alterada recentemente.</p>
          
          <div class="info">
            <p><strong>Detalhes da Alteração:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Endereço IP</th>
                <td>${data.ipAddress || 'Não disponível'}</td>
              </tr>
            </table>
          </div>
          
          <p><strong>Se você não fez esta alteração</strong>, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.</p>
          
          <a href="#" class="button">Entrar em Contato com Suporte</a>
        `)
      };
      
    case NotificationTemplate.ACCOUNT_LOCKED:
      return {
        subject: `[${appName}] URGENTE: Sua conta foi bloqueada`,
        textContent: 
          `Olá ${username},\n\n` +
          `Sua conta foi bloqueada após múltiplas tentativas de acesso malsucedidas.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Endereço IP das tentativas: ${data.ipAddress || 'Múltiplos IPs'}\n\n` +
          `Para proteger seus dados, sua conta foi bloqueada temporariamente.\n\n` +
          `Se foi você quem tentou acessar, você pode desbloquear sua conta redefinindo sua senha.\n\n` +
          `Se você não reconhece estas tentativas de acesso, sua conta pode estar sob ataque. Recomendamos que você entre em contato com o suporte imediatamente.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>URGENTE: Sua conta foi bloqueada</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Sua conta foi bloqueada após múltiplas tentativas de acesso malsucedidas.</p>
          
          <div class="critical">
            <p><strong>Detalhes do Incidente:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Endereço IP das tentativas</th>
                <td>${data.ipAddress || 'Múltiplos IPs'}</td>
              </tr>
              <tr>
                <th>Tentativas de login</th>
                <td>${data.details?.attemptCount || 'Múltiplas'}</td>
              </tr>
            </table>
          </div>
          
          <p>Para proteger seus dados, sua conta foi bloqueada temporariamente.</p>
          
          <p>Se foi você quem tentou acessar, você pode desbloquear sua conta redefinindo sua senha.</p>
          
          <p>Se você <strong>não reconhece estas tentativas de acesso</strong>, sua conta pode estar sob ataque. Recomendamos que você entre em contato com o suporte imediatamente.</p>
          
          <a href="#" class="button">Redefinir Minha Senha</a>
        `)
      };
      
    case NotificationTemplate.PERMISSION_CHANGED:
      return {
        subject: `[${appName}] Alteração nas suas permissões de acesso`,
        textContent: 
          `Olá ${username},\n\n` +
          `Suas permissões de acesso no sistema foram alteradas.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Ação: ${data.action || 'Alteração de permissões'}\n\n` +
          `Se você solicitou esta alteração, não é necessária nenhuma ação adicional.\n\n` +
          `Se você não solicitou esta alteração, entre em contato com seu administrador ou com o suporte imediatamente.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Alteração nas suas permissões de acesso</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Suas permissões de acesso no sistema foram alteradas.</p>
          
          <div class="info">
            <p><strong>Detalhes da Alteração:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Ação</th>
                <td>${data.action || 'Alteração de permissões'}</td>
              </tr>
            </table>
          </div>
          
          <p>Se você solicitou esta alteração, não é necessária nenhuma ação adicional.</p>
          
          <p>Se você <strong>não solicitou esta alteração</strong>, entre em contato com seu administrador ou com o suporte imediatamente.</p>
          
          <a href="#" class="button">Verificar Minhas Permissões</a>
        `)
      };
      
    case NotificationTemplate.CRITICAL_ERROR:
      return {
        subject: `[${appName}] ALERTA CRÍTICO: Incidente de Segurança`,
        textContent: 
          `ALERTA CRÍTICO DE SEGURANÇA\n\n` +
          `Foi detectado um incidente crítico de segurança no sistema.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Detalhes: ${data.action || 'Erro crítico de segurança'}\n\n` +
          `Nossa equipe técnica foi notificada e está investigando o incidente.\n\n` +
          `Por precaução, recomendamos que você verifique sua conta e altere sua senha.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>ALERTA CRÍTICO: Incidente de Segurança</h2>
          <p>Foi detectado um incidente crítico de segurança no sistema.</p>
          
          <div class="critical">
            <p><strong>Detalhes do Incidente:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Detalhes</th>
                <td>${data.action || 'Erro crítico de segurança'}</td>
              </tr>
            </table>
          </div>
          
          <p>Nossa equipe técnica foi notificada e está investigando o incidente.</p>
          
          <p>Por precaução, recomendamos que você verifique sua conta e altere sua senha.</p>
          
          <a href="#" class="button">Alterar Minha Senha</a>
        `)
      };
      
    case NotificationTemplate.SUSPICIOUS_ACTIVITY:
      return {
        subject: `[${appName}] Alerta: Atividade Suspeita Detectada`,
        textContent: 
          `Olá ${username},\n\n` +
          `Detectamos atividade suspeita em sua conta.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Endereço IP: ${data.ipAddress || 'Não disponível'}\n` +
          `Atividade: ${data.action || 'Comportamento anormal'}\n\n` +
          `Se foi você quem realizou estas ações, você pode ignorar este email.\n\n` +
          `Se você não reconhece esta atividade, recomendamos que você:\n` +
          `1. Altere sua senha imediatamente\n` +
          `2. Revise as últimas atividades em sua conta\n` +
          `3. Entre em contato com o suporte\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Alerta: Atividade Suspeita Detectada</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Detectamos atividade suspeita em sua conta.</p>
          
          <div class="warning">
            <p><strong>Detalhes da Atividade:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Endereço IP</th>
                <td>${data.ipAddress || 'Não disponível'}</td>
              </tr>
              <tr>
                <th>Atividade</th>
                <td>${data.action || 'Comportamento anormal'}</td>
              </tr>
            </table>
          </div>
          
          <p>Se foi você quem realizou estas ações, você pode ignorar este email.</p>
          
          <p>Se você <strong>não reconhece esta atividade</strong>, recomendamos que você:</p>
          <ol>
            <li>Altere sua senha imediatamente</li>
            <li>Revise as últimas atividades em sua conta</li>
            <li>Entre em contato com o suporte</li>
          </ol>
          
          <a href="#" class="button">Verificar Minha Conta</a>
        `)
      };
      
    case NotificationTemplate.SECURITY_SETTING_CHANGED:
      return {
        subject: `[${appName}] Alteração nas Configurações de Segurança`,
        textContent: 
          `Olá ${username},\n\n` +
          `Uma configuração de segurança em sua conta foi alterada.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Alteração: ${data.action || 'Configuração de segurança alterada'}\n\n` +
          `Se você fez esta alteração, não é necessária nenhuma ação adicional.\n\n` +
          `Se você não fez esta alteração, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Alteração nas Configurações de Segurança</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Uma configuração de segurança em sua conta foi alterada.</p>
          
          <div class="info">
            <p><strong>Detalhes da Alteração:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Alteração</th>
                <td>${data.action || 'Configuração de segurança alterada'}</td>
              </tr>
            </table>
          </div>
          
          <p>Se você fez esta alteração, não é necessária nenhuma ação adicional.</p>
          
          <p>Se você <strong>não fez esta alteração</strong>, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.</p>
          
          <a href="#" class="button">Verificar Configurações</a>
        `)
      };
      
    case NotificationTemplate.DATA_EXPORT:
      return {
        subject: `[${appName}] Exportação de Dados Sensíveis`,
        textContent: 
          `Olá ${username},\n\n` +
          `Uma exportação de dados sensíveis foi realizada em sua conta.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Endereço IP: ${data.ipAddress || 'Não disponível'}\n` +
          `Detalhes: ${data.action || 'Exportação de dados'}\n\n` +
          `Se foi você quem realizou esta exportação, você pode ignorar este email.\n\n` +
          `Se você não reconhece esta atividade, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.\n\n` +
          `Atenciosamente,\n` +
          `Equipe de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Exportação de Dados Sensíveis</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Uma exportação de dados sensíveis foi realizada em sua conta.</p>
          
          <div class="warning">
            <p><strong>Detalhes da Exportação:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Endereço IP</th>
                <td>${data.ipAddress || 'Não disponível'}</td>
              </tr>
              <tr>
                <th>Detalhes</th>
                <td>${data.action || 'Exportação de dados'}</td>
              </tr>
            </table>
          </div>
          
          <p>Se foi você quem realizou esta exportação, você pode ignorar este email.</p>
          
          <p>Se você <strong>não reconhece esta atividade</strong>, sua conta pode estar comprometida. Entre em contato com o suporte imediatamente.</p>
          
          <a href="#" class="button">Verificar Minha Conta</a>
        `)
      };
      
    case NotificationTemplate.ADMIN_ACTION_SUMMARY:
    default:
      return {
        subject: `[${appName}] Resumo de Atividades Administrativas`,
        textContent: 
          `Olá Administrador,\n\n` +
          `Uma ação administrativa importante foi realizada no sistema.\n\n` +
          `Data: ${date}\n` +
          `Hora: ${time}\n` +
          `Usuário: ${username}\n` +
          `Ação: ${data.action || 'Ação administrativa'}\n\n` +
          `Este email é apenas para sua informação.\n\n` +
          `Atenciosamente,\n` +
          `Sistema de Segurança - ${appName}`,
        htmlContent: baseHtmlTemplate(`
          <h2>Resumo de Atividades Administrativas</h2>
          <p>Olá <strong>Administrador</strong>,</p>
          <p>Uma ação administrativa importante foi realizada no sistema.</p>
          
          <div class="info">
            <p><strong>Detalhes da Ação:</strong></p>
            <table>
              <tr>
                <th>Data</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>Hora</th>
                <td>${time}</td>
              </tr>
              <tr>
                <th>Usuário</th>
                <td>${username}</td>
              </tr>
              <tr>
                <th>Ação</th>
                <td>${data.action || 'Ação administrativa'}</td>
              </tr>
            </table>
          </div>
          
          <p>Este email é apenas para sua informação.</p>
          
          <a href="#" class="button">Ver Todos os Logs</a>
        `)
      };
  }
}

/**
 * Função para gerar template de email com base em um log
 * @param logEntry Entrada de log
 * @param template Tipo de template (opcional, será inferido do logEntry se não fornecido)
 * @returns Template de email
 */
export function generateEmailFromLog(
  logEntry: LogEntry,
  template?: NotificationTemplate
): EmailTemplate {
  // Determinar o template com base no tipo de evento se não fornecido
  if (!template) {
    switch (logEntry.eventType) {
      case 'LOGIN_FAILED':
        template = NotificationTemplate.SUSPICIOUS_ACTIVITY;
        break;
      case 'PASSWORD_CHANGED':
      case 'PASSWORD_RESET':
        template = NotificationTemplate.PASSWORD_CHANGED;
        break;
      case 'PERMISSION_CHANGED':
        template = NotificationTemplate.PERMISSION_CHANGED;
        break;
      case 'SECURITY_SETTING_CHANGED':
        template = NotificationTemplate.SECURITY_SETTING_CHANGED;
        break;
      case 'CRITICAL_ERROR':
        template = NotificationTemplate.CRITICAL_ERROR;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        template = NotificationTemplate.SUSPICIOUS_ACTIVITY;
        break;
      case 'EXPORT_DATA':
        template = NotificationTemplate.DATA_EXPORT;
        break;
      default:
        template = NotificationTemplate.ADMIN_ACTION_SUMMARY;
    }
  }
  
  // Gerar o template com os dados do log
  return generateEmailTemplate(template, {
    username: logEntry.username,
    timestamp: logEntry.timestamp,
    ipAddress: logEntry.ipAddress,
    userAgent: logEntry.userAgent,
    action: logEntry.action,
    details: logEntry.details
  });
}

export default {
  generateEmailTemplate,
  generateEmailFromLog
}; 