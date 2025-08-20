import React, { useState } from 'react';
import { logService, LogEventType, LogSeverity } from '@/lib/security/logService';
import { Shield, AlertTriangle, Lock, X } from 'lucide-react';

interface SecurityConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  action: string;
  actionType: LogEventType;
  severity: 'normal' | 'high' | 'critical';
  confirmText?: string;
  requirePassword?: boolean;
  userId?: string;
  username?: string;
}

export function SecurityConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  action,
  actionType,
  severity = 'normal',
  confirmText = 'Confirmar',
  requirePassword = false,
  userId,
  username
}: SecurityConfirmationProps) {
  const [password, setPassword] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;
  
  // Determinar qual confirmação é necessária
  const confirmationWord = severity === 'critical' ? 'CONFIRMAR' : '';
  
  // Obter classe de severidade
  const getSeverityClass = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };
  
  // Obter ícone de severidade
  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-10 w-10 text-red-500" />;
      case 'high':
        return <Shield className="h-10 w-10 text-orange-500" />;
      default:
        return <Lock className="h-10 w-10 text-blue-500" />;
    }
  };
  
  // Verificar se pode confirmar
  const canConfirm = () => {
    if (requirePassword && !password) return false;
    if (severity === 'critical' && confirmValue !== 'CONFIRMAR') return false;
    return true;
  };
  
  // Manipular confirmação
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Em um sistema real, verificaria a senha aqui
      if (requirePassword) {
        // Simulação: verificar se a senha tem pelo menos 6 caracteres
        if (password.length < 6) {
          setError('Senha inválida');
          setIsLoading(false);
          return;
        }
      }
      
      // Registrar ação no log
      const logSeverity = severity === 'critical' 
        ? LogSeverity.CRITICAL 
        : severity === 'high' 
          ? LogSeverity.WARNING 
          : LogSeverity.INFO;
      
      logService.log(
        actionType,
        logSeverity,
        `${action} (confirmado pelo usuário)`,
        { confirmationRequired: true, severity },
        { 
          userId,
          username,
          status: 'success' 
        }
      );
      
      // Chamar callback de confirmação
      onConfirm();
      
      // Resetar estado e fechar
      resetAndClose();
    } catch (err) {
      console.error('Erro ao processar confirmação:', err);
      setError('Ocorreu um erro ao processar sua confirmação');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resetar estado e fechar
  const resetAndClose = () => {
    setPassword('');
    setConfirmValue('');
    setError(null);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md border-l-4 ${getSeverityClass()}`}>
        <div className="flex justify-between items-start p-4 border-b">
          <div className="flex items-center">
            {getSeverityIcon()}
            <h3 className="ml-3 text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={resetAndClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {requirePassword && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digite sua senha para confirmar
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sua senha"
              />
            </div>
          )}
          
          {severity === 'critical' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digite CONFIRMAR para prosseguir
              </label>
              <input
                type="text"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="CONFIRMAR"
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={resetAndClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={!canConfirm() || isLoading}
              className={`px-4 py-2 rounded ${
                !canConfirm() || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : severity === 'critical'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : severity === 'high'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Processando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityConfirmation; 