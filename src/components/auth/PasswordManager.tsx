import React, { useState } from 'react';
import { passwordService } from '@/lib/security/passwordService';

interface PasswordManagerProps {
  userId: string;
  onPasswordChanged?: () => void;
  currentPasswordHash?: string;
  passwordHistory?: Array<{ hash: string, createdAt: number }>;
}

/**
 * Componente para gerenciamento de senhas dos usuários
 * 
 * Permite alteração de senha com verificação de política de segurança
 * e histórico para evitar reutilização de senhas antigas.
 */
export function PasswordManager({
  userId,
  onPasswordChanged,
  currentPasswordHash,
  passwordHistory = []
}: PasswordManagerProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [strengthScore, setStrengthScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Política de senha atual
  const passwordPolicy = passwordService.getPasswordPolicy();
  
  // Calcular força da senha em tempo real
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setStrengthScore(0);
      setPasswordFeedback('');
      return;
    }
    
    // Validar de acordo com a política
    const validation = passwordService.validatePasswordStrength(password);
    
    // Calcular pontuação simples (0-100)
    let score = 0;
    
    // Tamanho (até 25 pontos)
    score += Math.min(25, (password.length / passwordPolicy.minLength) * 15);
    
    // Variedade de caracteres (até 25 pontos)
    if (/[A-Z]/.test(password)) score += 5;
    if (/[a-z]/.test(password)) score += 5;
    if (/[0-9]/.test(password)) score += 5;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    
    // Complexidade (até 25 pontos)
    const uniqueChars = new Set(password.split('')).size;
    score += Math.min(25, (uniqueChars / password.length) * 25);
    
    // Política (até 25 pontos)
    score += validation.errors.length === 0 ? 25 : 0;
    
    // Feedback baseado na pontuação
    let feedback = '';
    if (score < 25) {
      feedback = 'Senha muito fraca';
    } else if (score < 50) {
      feedback = 'Senha fraca';
    } else if (score < 75) {
      feedback = 'Senha razoável';
    } else {
      feedback = 'Senha forte';
    }
    
    setStrengthScore(score);
    setPasswordFeedback(feedback);
  };
  
  // Validar formulário
  const validateForm = async (): Promise<boolean> => {
    const errors: string[] = [];
    
    // Verificar se a senha atual foi fornecida
    if (!currentPassword) {
      errors.push('A senha atual é obrigatória');
    }
    
    // Verificar se a nova senha foi fornecida
    if (!newPassword) {
      errors.push('A nova senha é obrigatória');
    }
    
    // Verificar se a confirmação da senha foi fornecida
    if (!confirmPassword) {
      errors.push('A confirmação da senha é obrigatória');
    }
    
    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      errors.push('A nova senha e a confirmação não coincidem');
    }
    
    // Verificar se a senha atual está correta
    if (currentPasswordHash && currentPassword) {
      const isCorrect = await passwordService.verifyPassword(currentPassword, currentPasswordHash);
      if (!isCorrect) {
        errors.push('A senha atual está incorreta');
      }
    }
    
    // Verificar política de senha
    const validation = passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
    
    // Verificar histórico de senhas
    if (passwordHistory && passwordHistory.length > 0) {
      const isInHistory = await passwordService.isPasswordInHistory(newPassword, passwordHistory);
      if (isInHistory) {
        errors.push('Esta senha já foi usada recentemente. Por favor, escolha uma senha diferente.');
      }
    }
    
    // Atualizar erros
    setErrors(errors);
    
    return errors.length === 0;
  };
  
  // Lidar com alteração de senha
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess(false);
    
    try {
      // Validar formulário
      const isValid = await validateForm();
      
      if (!isValid) {
        setLoading(false);
        return;
      }
      
      // Simular chamada para API para alterar senha
      // Em uma implementação real, isto seria uma chamada para um endpoint seguro
      console.log(`Alterando senha para o usuário ${userId}`);
      
      // Gerar hash da nova senha
      const newPasswordHash = await passwordService.hashPassword(newPassword);
      
      // Adicionar ao histórico
      const updatedHistory = passwordService.addToPasswordHistory(
        newPasswordHash,
        passwordHistory
      );
      
      // Criptografar histórico para armazenamento
      const encryptedHistory = passwordService.encryptPasswordHistory(updatedHistory);
      
      // Simular salvamento no banco de dados
      console.log('Novo hash:', newPasswordHash);
      console.log('Histórico atualizado:', encryptedHistory);
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStrengthScore(0);
      setPasswordFeedback('');
      setSuccess(true);
      
      // Chamar callback, se fornecido
      if (onPasswordChanged) {
        onPasswordChanged();
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      setErrors(['Ocorreu um erro ao alterar a senha. Por favor, tente novamente.']);
    } finally {
      setLoading(false);
    }
  };
  
  // Gerar senha forte
  const generateStrongPassword = () => {
    const password = passwordService.generateStrongPassword();
    setNewPassword(password);
    setConfirmPassword(password);
    calculatePasswordStrength(password);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Alterar Senha</h2>
      
      {/* Mensagem de sucesso */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>Senha alterada com sucesso!</p>
        </div>
      )}
      
      {/* Lista de erros */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Formulário de alteração de senha */}
      <form onSubmit={handlePasswordChange}>
        {/* Senha atual */}
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Senha Atual
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* Nova senha */}
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Nova Senha
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              calculatePasswordStrength(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          
          {/* Indicador de força da senha */}
          {newPassword && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    strengthScore < 25 ? 'bg-red-500' :
                    strengthScore < 50 ? 'bg-orange-500' :
                    strengthScore < 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${strengthScore}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-gray-600">{passwordFeedback}</p>
            </div>
          )}
        </div>
        
        {/* Confirmar nova senha */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* Requisitos de senha */}
        <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Requisitos de Senha:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Mínimo de {passwordPolicy.minLength} caracteres</li>
            {passwordPolicy.requireUppercase && <li>• Pelo menos uma letra maiúscula</li>}
            {passwordPolicy.requireLowercase && <li>• Pelo menos uma letra minúscula</li>}
            {passwordPolicy.requireNumbers && <li>• Pelo menos um número</li>}
            {passwordPolicy.requireSpecialChars && <li>• Pelo menos um caractere especial</li>}
            <li>• Não pode ser igual às {passwordPolicy.historySize} senhas anteriores</li>
          </ul>
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={generateStrongPassword}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Gerar Senha Forte
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processando...' : 'Alterar Senha'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PasswordManager; 