import React, { useState, useEffect } from 'react';
import { logApi } from '@/lib/api/logApi';
import { LogEntry, LogEventType, LogSeverity } from '@/lib/security/logService';

/**
 * Dashboard de Segurança
 * 
 * Exibe métricas, alertas e eventos críticos de segurança no sistema
 */
export function SecurityDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCriticalEvents, setRecentCriticalEvents] = useState<LogEntry[]>([]);
  const [recentSuspiciousActivities, setRecentSuspiciousActivities] = useState<LogEntry[]>([]);
  const [eventTypeStats, setEventTypeStats] = useState<Record<LogEventType, number>>({} as Record<LogEventType, number>);
  const [severityStats, setSeverityStats] = useState<Record<LogSeverity, number>>({} as Record<LogSeverity, number>);
  const [totalEvents24h, setTotalEvents24h] = useState<number>(0);
  const [criticalEvents24h, setCriticalEvents24h] = useState<number>(0);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(
    localStorage.getItem('security_alerts_enabled') === 'true'
  );
  
  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
    
    // Atualizar dados a cada 5 minutos
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const summary = await logApi.getSecuritySummary();
      
      setRecentCriticalEvents(summary.recentCriticalEvents);
      setRecentSuspiciousActivities(summary.recentSuspiciousActivities);
      setEventTypeStats(summary.eventTypeStats);
      setSeverityStats(summary.severityStats);
      setTotalEvents24h(summary.totalEvents24h);
      setCriticalEvents24h(summary.criticalEvents24h);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Falha ao carregar informações de segurança');
    } finally {
      setLoading(false);
    }
  };
  
  // Alternar alertas
  const toggleAlerts = () => {
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    localStorage.setItem('security_alerts_enabled', String(newState));
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
      [LogEventType.SECURITY_SETTING_CHANGED]: 'Configuração de Segurança',
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
  
  // Obter cor para severidade
  const getSeverityColor = (severity: LogSeverity): string => {
    switch (severity) {
      case LogSeverity.INFO:
        return '#3B82F6'; // blue-500
      case LogSeverity.WARNING:
        return '#F59E0B'; // amber-500
      case LogSeverity.ERROR:
        return '#F97316'; // orange-500
      case LogSeverity.CRITICAL:
        return '#EF4444'; // red-500
      default:
        return '#9CA3AF'; // gray-400
    }
  };
  
  // Renderizar cartão de evento
  const renderEventCard = (log: LogEntry) => {
    const date = new Date(log.timestamp).toLocaleString('pt-BR');
    
    return (
      <div key={log.id} className="p-4 border rounded-lg hover:shadow-md">
        <div className="flex justify-between items-start">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityClass(log.severity)}`}>
            {translateSeverity(log.severity)}
          </span>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
        <h4 className="mt-2 font-medium">{translateEventType(log.eventType)}</h4>
        <p className="text-sm text-gray-600 mt-1">{log.action}</p>
        {log.username && (
          <p className="text-xs text-gray-500 mt-2">
            Usuário: {log.username}
            {log.ipAddress && ` (${log.ipAddress})`}
          </p>
        )}
      </div>
    );
  };
  
  // Renderizar gráfico de barras simples
  const renderBarChart = (data: { label: string; value: number; color: string }[]) => {
    const maxValue = Math.max(...data.map(item => item.value), 1);
    
    return (
      <div className="space-y-3 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm truncate">{item.label}</div>
            <div className="flex-1 ml-2">
              <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${Math.max((item.value / maxValue) * 100, 2)}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
            <div className="ml-2 w-10 text-sm text-right">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };
  
  // Preparar dados para gráfico de eventos
  const getEventTypeChartData = () => {
    return Object.entries(eventTypeStats)
      .filter(([_, count]) => count > 0) // Filtrar apenas eventos que ocorreram
      .map(([type, count]) => ({
        label: translateEventType(type as LogEventType),
        value: count,
        color: type === LogEventType.CRITICAL_ERROR || type === LogEventType.SUSPICIOUS_ACTIVITY 
          ? '#EF4444' // red for critical
          : type === LogEventType.LOGIN_FAILED 
            ? '#F59E0B' // amber for warnings
            : '#3B82F6' // blue for normal
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  // Preparar dados para gráfico de severidade
  const getSeverityChartData = () => {
    return Object.entries(severityStats)
      .map(([severity, count]) => ({
        label: translateSeverity(severity as LogSeverity),
        value: count,
        color: getSeverityColor(severity as LogSeverity)
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard de Segurança</h2>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <label htmlFor="alerts-toggle" className="mr-2 text-sm font-medium text-gray-700">
              Alertas
            </label>
            <div className="relative inline-block w-10 align-middle select-none">
              <input
                type="checkbox"
                id="alerts-toggle"
                checked={alertsEnabled}
                onChange={toggleAlerts}
                className="sr-only"
              />
              <div className={`block h-6 rounded-full w-10 ${alertsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${alertsEnabled ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </div>
          
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Atualizar
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total de Eventos (24h)</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalEvents24h}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Eventos Críticos (24h)</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{criticalEvents24h}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Atividades Suspeitas</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {recentSuspiciousActivities.length}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Status do Sistema</h3>
              <p className="text-xl font-bold text-purple-600 mt-2">
                {criticalEvents24h > 5 ? 'Atenção Necessária' : 'Normal'}
              </p>
            </div>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Eventos por Tipo</h3>
              {renderBarChart(getEventTypeChartData())}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Eventos por Severidade</h3>
              {renderBarChart(getSeverityChartData())}
              
              {/* Legenda de cores */}
              <div className="flex flex-wrap mt-4 justify-center gap-4">
                {Object.values(LogSeverity).map(severity => (
                  <div key={severity} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: getSeverityColor(severity) }}
                    ></div>
                    <span className="text-xs text-gray-700">{translateSeverity(severity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Eventos recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Eventos Críticos Recentes</h3>
              {recentCriticalEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentCriticalEvents.map(log => renderEventCard(log))}
                </div>
              ) : (
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg text-center">
                  Nenhum evento crítico recente
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Atividades Suspeitas</h3>
              {recentSuspiciousActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentSuspiciousActivities.map(log => renderEventCard(log))}
                </div>
              ) : (
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg text-center">
                  Nenhuma atividade suspeita detectada
                </p>
              )}
            </div>
          </div>
          
          {/* Configuração de alertas */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Configuração de Alertas</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações de Alertas</p>
                  <p className="text-sm text-gray-600">
                    Receba alertas em tempo real para eventos críticos de segurança
                  </p>
                </div>
                <div className="flex items-center">
                  <label htmlFor="notifications-toggle" className="mr-2 text-sm font-medium text-gray-700">
                    {alertsEnabled ? 'Ativado' : 'Desativado'}
                  </label>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input
                      type="checkbox"
                      id="notifications-toggle"
                      checked={alertsEnabled}
                      onChange={toggleAlerts}
                      className="sr-only"
                    />
                    <div className={`block h-6 rounded-full w-10 ${alertsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${alertsEnabled ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </div>
              </div>
              
              {alertsEnabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="critical-events" 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked 
                    />
                    <label htmlFor="critical-events" className="ml-2 block text-sm text-gray-700">
                      Eventos Críticos
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="error-events" 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked 
                    />
                    <label htmlFor="error-events" className="ml-2 block text-sm text-gray-700">
                      Erros
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="suspicious-activity" 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked 
                    />
                    <label htmlFor="suspicious-activity" className="ml-2 block text-sm text-gray-700">
                      Atividades Suspeitas
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="failed-logins" 
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked 
                    />
                    <label htmlFor="failed-logins" className="ml-2 block text-sm text-gray-700">
                      Falhas de Login
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SecurityDashboard; 