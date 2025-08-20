import React, { useState, useEffect } from 'react';
import { LogEventType, LogSeverity } from '@/lib/security/logService';

// Definição de tipos para compatibilidade com os serviços que serão integrados depois
interface NotificationConfig {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  webhooksEnabled: boolean;
  emailAddresses?: string[];
  phoneNumbers?: string[];
  webhookUrls?: string[];
  notifyOnEvents: LogEventType[];
  notifyOnSeverity: LogSeverity[];
}

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  adminEmails: string[];
  securityEmails: string[];
  notificationsEnabled: boolean;
  criticalAlertsEnabled: boolean;
  dailyDigestEnabled: boolean;
}

// Mock do serviço de notificações
const getDefaultNotificationConfig = (): NotificationConfig => {
  return {
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    webhooksEnabled: false,
    emailAddresses: ['admin@empresa.com.br'],
    phoneNumbers: [],
    webhookUrls: [],
    notifyOnEvents: [
      LogEventType.LOGIN_FAILED,
      LogEventType.SUSPICIOUS_ACTIVITY,
      LogEventType.CRITICAL_ERROR,
      LogEventType.SENSITIVE_DATA_ACCESS
    ],
    notifyOnSeverity: [
      LogSeverity.ERROR,
      LogSeverity.CRITICAL
    ]
  };
};

// Mock do serviço de email
const getDefaultEmailConfig = (): EmailConfig => {
  return {
    fromEmail: 'seguranca@empresa.com.br',
    fromName: 'Segurança CRM',
    replyToEmail: 'naoresponda@empresa.com.br',
    adminEmails: ['admin@empresa.com.br'],
    securityEmails: ['seguranca@empresa.com.br'],
    notificationsEnabled: true,
    criticalAlertsEnabled: true,
    dailyDigestEnabled: true
  };
};

/**
 * Componente para configuração de notificações de segurança
 */
export function SecurityNotificationSettings() {
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(getDefaultNotificationConfig());
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(getDefaultEmailConfig());
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Salvar as configurações de notificação
  const saveNotificationSettings = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Em um sistema real, aqui iria salvar as configurações via API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação de atraso da rede
      
      // Salvar em localStorage para simulação
      localStorage.setItem('notification_config', JSON.stringify(notificationConfig));
      localStorage.setItem('email_config', JSON.stringify(emailConfig));
      
      setSaveSuccess(true);
      
      // Esconder mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar configurações
  useEffect(() => {
    try {
      // Carregar configurações de notificação do localStorage
      const savedNotificationConfig = localStorage.getItem('notification_config');
      if (savedNotificationConfig) {
        setNotificationConfig(JSON.parse(savedNotificationConfig));
      }
      
      // Carregar configurações de email do localStorage
      const savedEmailConfig = localStorage.getItem('email_config');
      if (savedEmailConfig) {
        setEmailConfig(JSON.parse(savedEmailConfig));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);
  
  // Alterar evento de notificação
  const toggleEventNotification = (eventType: LogEventType) => {
    const currentEvents = [...notificationConfig.notifyOnEvents];
    
    if (currentEvents.includes(eventType)) {
      setNotificationConfig({
        ...notificationConfig,
        notifyOnEvents: currentEvents.filter(e => e !== eventType)
      });
    } else {
      setNotificationConfig({
        ...notificationConfig,
        notifyOnEvents: [...currentEvents, eventType]
      });
    }
  };
  
  // Alterar severidade de notificação
  const toggleSeverityNotification = (severity: LogSeverity) => {
    const currentSeverities = [...notificationConfig.notifyOnSeverity];
    
    if (currentSeverities.includes(severity)) {
      setNotificationConfig({
        ...notificationConfig,
        notifyOnSeverity: currentSeverities.filter(s => s !== severity)
      });
    } else {
      setNotificationConfig({
        ...notificationConfig,
        notifyOnSeverity: [...currentSeverities, severity]
      });
    }
  };
  
  // Adicionar endereço de email
  const addEmailAddress = () => {
    const emailInput = document.getElementById('new-email') as HTMLInputElement;
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um endereço de email válido');
      return;
    }
    
    if (notificationConfig.emailAddresses?.includes(email)) {
      setError('Este email já está na lista');
      return;
    }
    
    setNotificationConfig({
      ...notificationConfig,
      emailAddresses: [...(notificationConfig.emailAddresses || []), email]
    });
    
    emailInput.value = '';
    setError(null);
  };
  
  // Remover endereço de email
  const removeEmailAddress = (email: string) => {
    setNotificationConfig({
      ...notificationConfig,
      emailAddresses: notificationConfig.emailAddresses?.filter(e => e !== email) || []
    });
  };
  
  // Adicionar número de telefone
  const addPhoneNumber = () => {
    const phoneInput = document.getElementById('new-phone') as HTMLInputElement;
    const phone = phoneInput.value.trim();
    
    if (!phone || phone.length < 10) {
      setError('Por favor, insira um número de telefone válido');
      return;
    }
    
    if (notificationConfig.phoneNumbers?.includes(phone)) {
      setError('Este número já está na lista');
      return;
    }
    
    setNotificationConfig({
      ...notificationConfig,
      phoneNumbers: [...(notificationConfig.phoneNumbers || []), phone]
    });
    
    phoneInput.value = '';
    setError(null);
  };
  
  // Remover número de telefone
  const removePhoneNumber = (phone: string) => {
    setNotificationConfig({
      ...notificationConfig,
      phoneNumbers: notificationConfig.phoneNumbers?.filter(p => p !== phone) || []
    });
  };
  
  // Adicionar URL de webhook
  const addWebhookUrl = () => {
    const webhookInput = document.getElementById('new-webhook') as HTMLInputElement;
    const webhook = webhookInput.value.trim();
    
    if (!webhook || !webhook.startsWith('http')) {
      setError('Por favor, insira uma URL válida (deve começar com http:// ou https://)');
      return;
    }
    
    if (notificationConfig.webhookUrls?.includes(webhook)) {
      setError('Esta URL já está na lista');
      return;
    }
    
    setNotificationConfig({
      ...notificationConfig,
      webhookUrls: [...(notificationConfig.webhookUrls || []), webhook]
    });
    
    webhookInput.value = '';
    setError(null);
  };
  
  // Remover URL de webhook
  const removeWebhookUrl = (webhook: string) => {
    setNotificationConfig({
      ...notificationConfig,
      webhookUrls: notificationConfig.webhookUrls?.filter(w => w !== webhook) || []
    });
  };
  
  // Traduzir tipo de evento para português
  const translateEventType = (eventType: LogEventType): string => {
    const translations: Record<LogEventType, string> = {
      [LogEventType.LOGIN]: 'Login',
      [LogEventType.LOGOUT]: 'Logout',
      [LogEventType.LOGIN_FAILED]: 'Falha de Login',
      [LogEventType.PASSWORD_CHANGED]: 'Senha Alterada',
      [LogEventType.PASSWORD_RESET]: 'Redefinição de Senha',
      [LogEventType.USER_CREATED]: 'Usuário Criado',
      [LogEventType.USER_UPDATED]: 'Usuário Atualizado',
      [LogEventType.USER_DELETED]: 'Usuário Excluído',
      [LogEventType.PERMISSION_CHANGED]: 'Permissão Alterada',
      [LogEventType.ADMIN_ACTION]: 'Ação Administrativa',
      [LogEventType.SENSITIVE_DATA_ACCESS]: 'Acesso a Dados Sensíveis',
      [LogEventType.SECURITY_SETTING_CHANGED]: 'Configuração de Segurança Alterada',
      [LogEventType.API_ACCESS]: 'Acesso à API',
      [LogEventType.EXPORT_DATA]: 'Exportação de Dados',
      [LogEventType.KEY_ROTATION]: 'Rotação de Chave',
      [LogEventType.CRITICAL_ERROR]: 'Erro Crítico',
      [LogEventType.SUSPICIOUS_ACTIVITY]: 'Atividade Suspeita'
    };
    
    return translations[eventType] || eventType;
  };
  
  // Traduzir severidade para português
  const translateSeverity = (severity: LogSeverity): string => {
    const translations: Record<LogSeverity, string> = {
      [LogSeverity.INFO]: 'Informação',
      [LogSeverity.WARNING]: 'Alerta',
      [LogSeverity.ERROR]: 'Erro',
      [LogSeverity.CRITICAL]: 'Crítico'
    };
    
    return translations[severity] || severity;
  };
  
  // Obter classe CSS para severidade
  const getSeverityClass = (severity: LogSeverity): string => {
    switch (severity) {
      case LogSeverity.INFO:
        return 'bg-blue-100 text-blue-800';
      case LogSeverity.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      case LogSeverity.ERROR:
        return 'bg-orange-100 text-orange-800';
      case LogSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Configurações de Notificações de Segurança</h2>
      
      {/* Mensagem de sucesso */}
      {saveSuccess && (
        <div className="mb-6 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>Configurações salvas com sucesso!</p>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Canais de Notificação */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Canais de Notificação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email-enabled"
                  checked={notificationConfig.emailEnabled}
                  onChange={() => setNotificationConfig({
                    ...notificationConfig,
                    emailEnabled: !notificationConfig.emailEnabled
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="email-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Notificações por Email
                </label>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${notificationConfig.emailEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {notificationConfig.emailEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            
            {notificationConfig.emailEnabled && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereços de Email
                  </label>
                  <div className="flex">
                    <input
                      type="email"
                      id="new-email"
                      placeholder="Adicionar email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={addEmailAddress}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  {notificationConfig.emailAddresses && notificationConfig.emailAddresses.length > 0 ? (
                    <ul className="bg-white rounded-md divide-y divide-gray-200">
                      {notificationConfig.emailAddresses.map(email => (
                        <li key={email} className="flex justify-between px-3 py-2 text-sm">
                          <span>{email}</span>
                          <button
                            onClick={() => removeEmailAddress(email)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum endereço de email configurado</p>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Notificações In-App */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inapp-enabled"
                  checked={notificationConfig.inAppEnabled}
                  onChange={() => setNotificationConfig({
                    ...notificationConfig,
                    inAppEnabled: !notificationConfig.inAppEnabled
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="inapp-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Notificações no Aplicativo
                </label>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${notificationConfig.inAppEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {notificationConfig.inAppEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              As notificações in-app são exibidas no próprio sistema e não requerem configuração adicional. Os usuários verão os alertas relevantes com base em suas permissões.
            </p>
          </div>
          
          {/* SMS */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms-enabled"
                  checked={notificationConfig.smsEnabled}
                  onChange={() => setNotificationConfig({
                    ...notificationConfig,
                    smsEnabled: !notificationConfig.smsEnabled
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sms-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Notificações por SMS
                </label>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${notificationConfig.smsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {notificationConfig.smsEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            
            {notificationConfig.smsEnabled && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Números de Telefone
                  </label>
                  <div className="flex">
                    <input
                      type="tel"
                      id="new-phone"
                      placeholder="(99) 99999-9999"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={addPhoneNumber}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  {notificationConfig.phoneNumbers && notificationConfig.phoneNumbers.length > 0 ? (
                    <ul className="bg-white rounded-md divide-y divide-gray-200">
                      {notificationConfig.phoneNumbers.map(phone => (
                        <li key={phone} className="flex justify-between px-3 py-2 text-sm">
                          <span>{phone}</span>
                          <button
                            onClick={() => removePhoneNumber(phone)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum número de telefone configurado</p>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  <strong>Nota:</strong> SMS serão enviados apenas para alertas críticos.
                </p>
              </>
            )}
          </div>
          
          {/* Webhooks */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="webhook-enabled"
                  checked={notificationConfig.webhooksEnabled}
                  onChange={() => setNotificationConfig({
                    ...notificationConfig,
                    webhooksEnabled: !notificationConfig.webhooksEnabled
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="webhook-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Notificações via Webhook
                </label>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${notificationConfig.webhooksEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {notificationConfig.webhooksEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            
            {notificationConfig.webhooksEnabled && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URLs de Webhook
                  </label>
                  <div className="flex">
                    <input
                      type="url"
                      id="new-webhook"
                      placeholder="https://exemplo.com/webhook"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={addWebhookUrl}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  {notificationConfig.webhookUrls && notificationConfig.webhookUrls.length > 0 ? (
                    <ul className="bg-white rounded-md divide-y divide-gray-200">
                      {notificationConfig.webhookUrls.map(webhook => (
                        <li key={webhook} className="flex justify-between px-3 py-2 text-sm">
                          <span className="truncate">{webhook}</span>
                          <button
                            onClick={() => removeWebhookUrl(webhook)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma URL de webhook configurada</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Configurações de Email */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Configurações de Email</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Origem
              </label>
              <input
                type="email"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  fromEmail: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Origem
              </label>
              <input
                type="text"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  fromName: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Resposta
              </label>
              <input
                type="email"
                value={emailConfig.replyToEmail || ''}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  replyToEmail: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications-enabled"
                checked={emailConfig.notificationsEnabled}
                onChange={() => setEmailConfig({
                  ...emailConfig,
                  notificationsEnabled: !emailConfig.notificationsEnabled
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="email-notifications-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                Habilitar Notificações por Email
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="critical-alerts-enabled"
                checked={emailConfig.criticalAlertsEnabled}
                onChange={() => setEmailConfig({
                  ...emailConfig,
                  criticalAlertsEnabled: !emailConfig.criticalAlertsEnabled
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="critical-alerts-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                Alertas Críticos Imediatos
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="daily-digest-enabled"
                checked={emailConfig.dailyDigestEnabled}
                onChange={() => setEmailConfig({
                  ...emailConfig,
                  dailyDigestEnabled: !emailConfig.dailyDigestEnabled
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="daily-digest-enabled" className="ml-2 block text-sm font-medium text-gray-700">
                Resumo Diário de Eventos
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tipos de Eventos para Notificar */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Eventos para Notificação</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.values(LogEventType).map(eventType => (
            <div key={eventType} className="flex items-center">
              <input
                type="checkbox"
                id={`event-${eventType}`}
                checked={notificationConfig.notifyOnEvents.includes(eventType)}
                onChange={() => toggleEventNotification(eventType)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`event-${eventType}`} className="ml-2 block text-sm font-medium text-gray-700">
                {translateEventType(eventType)}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Severidade para Notificar */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Severidade para Notificação</h3>
        
        <div className="flex flex-wrap gap-4">
          {Object.values(LogSeverity).map(severity => (
            <div key={severity} className="flex items-center">
              <input
                type="checkbox"
                id={`severity-${severity}`}
                checked={notificationConfig.notifyOnSeverity.includes(severity)}
                onChange={() => toggleSeverityNotification(severity)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`severity-${severity}`} className="ml-2 flex items-center">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityClass(severity)}`}>
                  {translateSeverity(severity)}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3 mt-8">
        <button
          onClick={() => {
            setNotificationConfig(getDefaultNotificationConfig());
            setEmailConfig(getDefaultEmailConfig());
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          disabled={loading}
        >
          Restaurar Padrões
        </button>
        
        <button
          onClick={saveNotificationSettings}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

export default SecurityNotificationSettings; 