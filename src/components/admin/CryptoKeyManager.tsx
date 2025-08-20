import React, { useState, useEffect } from 'react';
import { keyManager } from '@/lib/security/keyManager';
import { cryptoService, CryptoService } from '@/lib/security/cryptoService';

interface KeyInfo {
  id: string;
  purpose: string;
  algorithm: string;
  status: string;
  createdAt: string;
  rotatedAt?: string;
}

/**
 * Componente para gerenciamento de chaves de criptografia
 * 
 * Restrito a administradores do sistema com permissões adequadas
 */
export function CryptoKeyManager() {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState<'rotate' | 'revoke' | null>(null);
  
  // Carregar chaves ao montar o componente
  useEffect(() => {
    try {
      const keysMetadata = keyManager.getKeysMetadata();
      
      const formattedKeys = keysMetadata.map(key => ({
        id: key.id,
        purpose: key.purpose,
        algorithm: key.algorithm,
        status: key.status,
        createdAt: new Date(key.createdAt).toLocaleString('pt-BR'),
        rotatedAt: key.rotatedAt ? new Date(key.rotatedAt).toLocaleString('pt-BR') : undefined
      }));
      
      setKeys(formattedKeys);
    } catch (err) {
      setError('Erro ao carregar chaves de criptografia');
      console.error('Erro ao carregar chaves:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Criar nova chave
  const handleCreateKey = () => {
    try {
      const purpose = prompt('Informe a finalidade da chave:');
      
      if (!purpose) {
        return;
      }
      
      const keyId = keyManager.createKey(purpose);
      
      // Recarregar lista de chaves
      const keysMetadata = keyManager.getKeysMetadata();
      const formattedKeys = keysMetadata.map(key => ({
        id: key.id,
        purpose: key.purpose,
        algorithm: key.algorithm,
        status: key.status,
        createdAt: new Date(key.createdAt).toLocaleString('pt-BR'),
        rotatedAt: key.rotatedAt ? new Date(key.rotatedAt).toLocaleString('pt-BR') : undefined
      }));
      
      setKeys(formattedKeys);
      
      alert(`Chave criada com sucesso: ${keyId}`);
    } catch (err) {
      setError('Erro ao criar nova chave');
      console.error('Erro ao criar chave:', err);
    }
  };
  
  // Preparar para rotacionar chave
  const prepareRotateKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    setActionType('rotate');
    setShowConfirmation(true);
  };
  
  // Preparar para revogar chave
  const prepareRevokeKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    setActionType('revoke');
    setShowConfirmation(true);
  };
  
  // Cancelar ação
  const cancelAction = () => {
    setSelectedKeyId(null);
    setActionType(null);
    setShowConfirmation(false);
  };
  
  // Confirmar ação
  const confirmAction = () => {
    if (!selectedKeyId || !actionType) {
      return;
    }
    
    try {
      if (actionType === 'rotate') {
        // Rotacionar chave
        const newKeyId = keyManager.rotateKey(selectedKeyId);
        
        if (newKeyId) {
          alert(`Chave rotacionada com sucesso. Nova chave: ${newKeyId}`);
        } else {
          throw new Error('Falha ao rotacionar chave');
        }
      } else if (actionType === 'revoke') {
        // Revogar chave
        const success = keyManager.revokeKey(selectedKeyId);
        
        if (success) {
          alert('Chave revogada com sucesso');
        } else {
          throw new Error('Falha ao revogar chave');
        }
      }
      
      // Recarregar lista de chaves
      const keysMetadata = keyManager.getKeysMetadata();
      const formattedKeys = keysMetadata.map(key => ({
        id: key.id,
        purpose: key.purpose,
        algorithm: key.algorithm,
        status: key.status,
        createdAt: new Date(key.createdAt).toLocaleString('pt-BR'),
        rotatedAt: key.rotatedAt ? new Date(key.rotatedAt).toLocaleString('pt-BR') : undefined
      }));
      
      setKeys(formattedKeys);
    } catch (err) {
      setError(`Erro ao ${actionType === 'rotate' ? 'rotacionar' : 'revogar'} chave`);
      console.error(`Erro ao ${actionType} chave:`, err);
    } finally {
      setSelectedKeyId(null);
      setActionType(null);
      setShowConfirmation(false);
    }
  };
  
  // Gerar nova chave mestra
  const generateMasterKey = () => {
    try {
      const masterKey = CryptoService.generateMasterKey();
      
      alert(
        'ATENÇÃO: Esta chave mestra é ALTAMENTE SENSÍVEL. ' +
        'Armazene-a de forma segura e nunca a compartilhe.\n\n' +
        masterKey
      );
    } catch (err) {
      setError('Erro ao gerar chave mestra');
      console.error('Erro ao gerar chave mestra:', err);
    }
  };
  
  // Limpar chaves antigas
  const cleanupOldKeys = () => {
    try {
      const days = prompt('Remover chaves com mais de quantos dias?', '30');
      
      if (!days) {
        return;
      }
      
      const daysInMs = parseInt(days) * 24 * 60 * 60 * 1000;
      const removedCount = keyManager.cleanupOldKeys(daysInMs);
      
      alert(`${removedCount} chaves antigas removidas com sucesso`);
      
      // Recarregar lista de chaves
      const keysMetadata = keyManager.getKeysMetadata();
      const formattedKeys = keysMetadata.map(key => ({
        id: key.id,
        purpose: key.purpose,
        algorithm: key.algorithm,
        status: key.status,
        createdAt: new Date(key.createdAt).toLocaleString('pt-BR'),
        rotatedAt: key.rotatedAt ? new Date(key.rotatedAt).toLocaleString('pt-BR') : undefined
      }));
      
      setKeys(formattedKeys);
    } catch (err) {
      setError('Erro ao limpar chaves antigas');
      console.error('Erro ao limpar chaves:', err);
    }
  };
  
  // Exibir mensagem de carregamento
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">Carregando informações de criptografia...</p>
      </div>
    );
  }
  
  // Exibir mensagem de erro
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-red-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gerenciamento de Chaves de Criptografia</h2>
      
      {/* Alerta de segurança */}
      <div className="p-4 mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
        <h3 className="font-bold">Área Restrita - Segurança</h3>
        <p>Este painel dá acesso a operações sensíveis de segurança. Todas as ações são registradas e auditadas.</p>
      </div>
      
      {/* Ações principais */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={handleCreateKey}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Criar Nova Chave
        </button>
        
        <button 
          onClick={generateMasterKey}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Gerar Chave Mestra
        </button>
        
        <button 
          onClick={cleanupOldKeys}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Limpar Chaves Antigas
        </button>
      </div>
      
      {/* Tabela de chaves */}
      {keys.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Finalidade
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Algoritmo
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rotacionada em
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {key.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {key.purpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {key.algorithm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      key.status === 'active' ? 'bg-green-100 text-green-800' :
                      key.status === 'deprecated' ? 'bg-yellow-100 text-yellow-800' :
                      key.status === 'revoked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {key.status === 'active' ? 'Ativa' :
                       key.status === 'deprecated' ? 'Depreciada' :
                       key.status === 'revoked' ? 'Revogada' :
                       key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {key.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {key.rotatedAt || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {key.status === 'active' && (
                      <>
                        <button
                          onClick={() => prepareRotateKey(key.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Rotacionar
                        </button>
                        <button
                          onClick={() => prepareRevokeKey(key.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revogar
                        </button>
                      </>
                    )}
                    {key.status === 'deprecated' && (
                      <button
                        onClick={() => prepareRevokeKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revogar
                      </button>
                    )}
                    {key.status === 'revoked' && (
                      <span className="text-gray-400">Sem ações</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600">Nenhuma chave encontrada</p>
      )}
      
      {/* Modal de confirmação */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar Ação</h3>
            <p className="mb-6">
              {actionType === 'rotate' ? 
                'Tem certeza que deseja rotacionar esta chave? Uma nova chave será criada e esta será marcada como depreciada.' :
                'Tem certeza que deseja revogar esta chave? Ela não poderá mais ser utilizada para operações de criptografia.'
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelAction}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CryptoKeyManager; 