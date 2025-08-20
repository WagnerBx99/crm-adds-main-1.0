import React, { useState, useEffect } from 'react';
import { logApi } from '@/lib/api/logApi';
import { LogEntry, LogEventType, LogSeverity, LogFilterOptions } from '@/lib/security/logService';

/**
 * Componente para visualização e exportação de logs de segurança
 * 
 * Permite filtrar, paginar e exportar logs de eventos do sistema
 */
export function SecurityLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<LogFilterOptions>({
    page: 1,
    pageSize: 20,
    sortBy: 'timestamp',
    sortDirection: 'desc'
  });
  
  // Opções de filtro
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<LogEventType[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<LogSeverity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [username, setUsername] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState<'success' | 'failure' | ''>('');
  
  // Carregar logs na inicialização e quando os filtros mudarem
  useEffect(() => {
    loadLogs();
  }, [filters]);
  
  // Função para carregar logs
  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await logApi.queryLogs(filters);
      
      setLogs(result.logs);
      setTotalCount(result.totalCount);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setPageSize(result.pageSize);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      setError('Falha ao carregar logs de segurança');
    } finally {
      setLoading(false);
    }
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    const newFilters: LogFilterOptions = {
      page: 1, // Voltar para a primeira página ao aplicar filtros
      pageSize,
      sortBy: 'timestamp',
      sortDirection: 'desc'
    };
    
    if (startDate) {
      newFilters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // Fim do dia
      newFilters.endDate = endDateObj;
    }
    
    if (selectedEventTypes.length > 0) {
      newFilters.eventTypes = selectedEventTypes;
    }
    
    if (selectedSeverities.length > 0) {
      newFilters.severity = selectedSeverities;
    }
    
    if (searchTerm) {
      newFilters.searchTerm = searchTerm;
    }
    
    if (username) {
      newFilters.username = username;
    }
    
    if (ipAddress) {
      newFilters.ipAddress = ipAddress;
    }
    
    if (status) {
      newFilters.status = status as 'success' | 'failure';
    }
    
    setFilters(newFilters);
  };
  
  // Limpar filtros
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEventTypes([]);
    setSelectedSeverities([]);
    setSearchTerm('');
    setUsername('');
    setIpAddress('');
    setStatus('');
    
    setFilters({
      page: 1,
      pageSize,
      sortBy: 'timestamp',
      sortDirection: 'desc'
    });
  };
  
  // Mudar página
  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setFilters({
      ...filters,
      page
    });
  };
  
  // Função utilitária para download de arquivo sem o file-saver
  const downloadFile = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Exportar logs em CSV
  const exportLogsCSV = async () => {
    setExportLoading(true);
    
    try {
      const csvData = await logApi.exportLogsAsCSV({
        ...filters,
        page: undefined,
        pageSize: undefined
      });
      
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(csvData, `logs_seguranca_${dateStr}.csv`, 'text/csv;charset=utf-8');
    } catch (err) {
      console.error('Erro ao exportar logs:', err);
      setError('Falha ao exportar logs para CSV');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Exportar logs em JSON
  const exportLogsJSON = async () => {
    setExportLoading(true);
    
    try {
      const jsonData = await logApi.exportLogsAsJSON({
        ...filters,
        page: undefined,
        pageSize: undefined
      });
      
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(jsonData, `logs_seguranca_${dateStr}.json`, 'application/json;charset=utf-8');
    } catch (err) {
      console.error('Erro ao exportar logs:', err);
      setError('Falha ao exportar logs para JSON');
    } finally {
      setExportLoading(false);
    }
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
  
  // Classe CSS de acordo com a severidade
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
  
  // Cor do status
  const getStatusClass = (status: 'success' | 'failure'): string => {
    return status === 'success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };
  
  // Renderizar controles de paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const maxDisplayedPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
    
    if (endPage - startPage + 1 < maxDisplayedPages) {
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }
    
    const pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
    
    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => changePage(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            &laquo;
          </button>
          
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            &lsaquo;
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => changePage(page)}
              className={`px-3 py-1 rounded ${
                page === currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            &rsaquo;
          </button>
          
          <button
            onClick={() => changePage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            &raquo;
          </button>
        </nav>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Logs de Segurança</h2>
      
      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Evento
            </label>
            <select
              multiple
              value={selectedEventTypes}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as LogEventType);
                setSelectedEventTypes(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              size={3}
            >
              {Object.values(LogEventType).map(eventType => (
                <option key={eventType} value={eventType}>
                  {translateEventType(eventType)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Severidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severidade
            </label>
            <select
              multiple
              value={selectedSeverities}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as LogSeverity);
                setSelectedSeverities(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              size={3}
            >
              {Object.values(LogSeverity).map(severity => (
                <option key={severity} value={severity}>
                  {translateSeverity(severity)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Usuário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* IP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço IP
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Endereço IP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'success' | 'failure' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="failure">Falha</option>
            </select>
          </div>
          
          {/* Termo de Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Busca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em ações e detalhes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Limpar Filtros
          </button>
          
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
      
      {/* Exportação */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-gray-700">
            {totalCount === 0 ? 'Nenhum resultado encontrado' : 
             `Mostrando ${Math.min((currentPage - 1) * pageSize + 1, totalCount)} - ${Math.min(currentPage * pageSize, totalCount)} de ${totalCount} registros`}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportLogsCSV}
            disabled={exportLoading || logs.length === 0}
            className={`px-4 py-2 rounded ${
              exportLoading || logs.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {exportLoading ? 'Exportando...' : 'Exportar CSV'}
          </button>
          
          <button
            onClick={exportLogsJSON}
            disabled={exportLoading || logs.length === 0}
            className={`px-4 py-2 rounded ${
              exportLoading || logs.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {exportLoading ? 'Exportando...' : 'Exportar JSON'}
          </button>
        </div>
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Tabela de logs */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Carregando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nenhum log encontrado com os filtros atuais</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {translateEventType(log.eventType)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(log.severity)}`}>
                      {translateSeverity(log.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {log.username || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(log.status)}`}>
                      {log.status === 'success' ? 'Sucesso' : 'Falha'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <button
                      onClick={() => alert(JSON.stringify(log.details, null, 2))}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Paginação */}
      {renderPagination()}
    </div>
  );
}

export default SecurityLogViewer; 