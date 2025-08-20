import React, { useState, useEffect } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { Cliente, ClienteDTO } from '../../types/tiny';

interface DetalheClienteTinyProps {
  clienteId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const DetalheClienteTiny: React.FC<DetalheClienteTinyProps> = ({ 
  clienteId, 
  onClose,
  onUpdate
}) => {
  const tinyService = useTinyService();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [formData, setFormData] = useState<ClienteDTO | null>(null);
  
  // Carrega os dados do cliente
  useEffect(() => {
    const carregarCliente = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const resultado = await tinyService.getClienteById(clienteId);
        setCliente(resultado);
        
        // Inicializa o formulário com os dados do cliente
        setFormData({
          nome: resultado.nome,
          tipo: resultado.tipo,
          cpf_cnpj: resultado.cpf_cnpj,
          email: resultado.email,
          fone: resultado.fone,
          celular: resultado.celular,
          observacao: resultado.observacao,
          situacao: resultado.situacao,
          endereco: { ...resultado.endereco }
        });
      } catch (err) {
        console.error('Erro ao carregar cliente:', err);
        setError('Não foi possível carregar os dados do cliente. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarCliente();
  }, [clienteId, tinyService]);
  
  // Manipula mudanças nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Campo aninhado (endereco)
      const [parent, child] = name.split('.');
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof ClienteDTO] as Record<string, any>,
            [child]: value
          }
        };
      });
    } else {
      // Campo direto
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: value
        };
      });
    }
  };
  
  // Salva as alterações
  const handleSalvar = async () => {
    if (!formData) return;
    
    setSalvando(true);
    setError(null);
    
    try {
      await tinyService.updateCliente(clienteId, formData);
      
      // Recarrega os dados do cliente para mostrar as alterações
      const clienteAtualizado = await tinyService.getClienteById(clienteId, true);
      setCliente(clienteAtualizado);
      
      // Sai do modo de edição
      setEditando(false);
      
      // Notifica o componente pai da atualização
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Não foi possível salvar as alterações. Por favor, verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };
  
  // Cancela a edição
  const handleCancelar = () => {
    if (cliente) {
      // Restaura os dados originais
      setFormData({
        nome: cliente.nome,
        tipo: cliente.tipo,
        cpf_cnpj: cliente.cpf_cnpj,
        email: cliente.email,
        fone: cliente.fone,
        celular: cliente.celular,
        observacao: cliente.observacao,
        situacao: cliente.situacao,
        endereco: { ...cliente.endereco }
      });
    }
    
    setEditando(false);
  };
  
  // Formatar data
  const formatarData = (dataString: string): string => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  return (
    <div className="tiny-detalhe-container">
      <div className="tiny-detalhe-header">
        <h2 className="tiny-title">
          {loading ? 'Carregando cliente...' : `Cliente: ${cliente?.nome}`}
        </h2>
        
        <div className="tiny-detalhe-actions">
          {!editando && (
            <button 
              className="tiny-button"
              onClick={() => setEditando(true)}
              disabled={loading}
            >
              Editar
            </button>
          )}
          
          <button 
            className="tiny-button tiny-button-secondary"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
      
      {error && (
        <div className="tiny-message tiny-message-error">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="tiny-loading">Carregando dados do cliente...</div>
      ) : cliente && formData ? (
        <div className="tiny-detalhe-content">
          {/* Modo de visualização */}
          {!editando ? (
            <div className="tiny-detalhe-view">
              <div className="tiny-detalhe-section">
                <h3 className="tiny-section-title">Informações Gerais</h3>
                
                <div className="tiny-detalhe-grid">
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Código:</span>
                    <span className="tiny-detalhe-value">{cliente.codigo}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Tipo:</span>
                    <span className="tiny-detalhe-value">
                      {cliente.tipo === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">CPF/CNPJ:</span>
                    <span className="tiny-detalhe-value">{cliente.cpf_cnpj}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">E-mail:</span>
                    <span className="tiny-detalhe-value">{cliente.email}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Telefone:</span>
                    <span className="tiny-detalhe-value">{cliente.fone}</span>
                  </div>
                  
                  {cliente.celular && (
                    <div className="tiny-detalhe-item">
                      <span className="tiny-detalhe-label">Celular:</span>
                      <span className="tiny-detalhe-value">{cliente.celular}</span>
                    </div>
                  )}
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Situação:</span>
                    <span className={`tiny-badge ${cliente.situacao === 'A' ? 'tiny-badge-success' : 'tiny-badge-danger'}`}>
                      {cliente.situacao === 'A' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Data de Cadastro:</span>
                    <span className="tiny-detalhe-value">{formatarData(cliente.data_cadastro)}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Última Atualização:</span>
                    <span className="tiny-detalhe-value">{formatarData(cliente.data_alteracao)}</span>
                  </div>
                </div>
              </div>
              
              <div className="tiny-detalhe-section">
                <h3 className="tiny-section-title">Endereço</h3>
                
                <div className="tiny-detalhe-grid">
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Logradouro:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.logradouro}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Número:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.numero}</span>
                  </div>
                  
                  {cliente.endereco.complemento && (
                    <div className="tiny-detalhe-item">
                      <span className="tiny-detalhe-label">Complemento:</span>
                      <span className="tiny-detalhe-value">{cliente.endereco.complemento}</span>
                    </div>
                  )}
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Bairro:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.bairro}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">CEP:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.cep}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">Cidade:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.cidade}</span>
                  </div>
                  
                  <div className="tiny-detalhe-item">
                    <span className="tiny-detalhe-label">UF:</span>
                    <span className="tiny-detalhe-value">{cliente.endereco.uf}</span>
                  </div>
                </div>
              </div>
              
              {cliente.observacao && (
                <div className="tiny-detalhe-section">
                  <h3 className="tiny-section-title">Observações</h3>
                  <p className="tiny-detalhe-text">{cliente.observacao}</p>
                </div>
              )}
            </div>
          ) : (
            /* Modo de edição */
            <div className="tiny-detalhe-edit">
              <div className="tiny-detalhe-section">
                <h3 className="tiny-section-title">Informações Gerais</h3>
                
                <div className="tiny-form-grid">
                  <div className="tiny-input-group">
                    <label htmlFor="nome">Nome*</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="tipo">Tipo*</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="tiny-select"
                      required
                    >
                      <option value="F">Pessoa Física</option>
                      <option value="J">Pessoa Jurídica</option>
                    </select>
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="cpf_cnpj">CPF/CNPJ*</label>
                    <input
                      type="text"
                      id="cpf_cnpj"
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="email">E-mail*</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="fone">Telefone*</label>
                    <input
                      type="text"
                      id="fone"
                      name="fone"
                      value={formData.fone}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="celular">Celular</label>
                    <input
                      type="text"
                      id="celular"
                      name="celular"
                      value={formData.celular || ''}
                      onChange={handleInputChange}
                      className="tiny-input"
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="situacao">Situação*</label>
                    <select
                      id="situacao"
                      name="situacao"
                      value={formData.situacao}
                      onChange={handleInputChange}
                      className="tiny-select"
                      required
                    >
                      <option value="A">Ativo</option>
                      <option value="I">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="tiny-detalhe-section">
                <h3 className="tiny-section-title">Endereço</h3>
                
                <div className="tiny-form-grid">
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.logradouro">Logradouro*</label>
                    <input
                      type="text"
                      id="endereco.logradouro"
                      name="endereco.logradouro"
                      value={formData.endereco.logradouro}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.numero">Número*</label>
                    <input
                      type="text"
                      id="endereco.numero"
                      name="endereco.numero"
                      value={formData.endereco.numero}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.complemento">Complemento</label>
                    <input
                      type="text"
                      id="endereco.complemento"
                      name="endereco.complemento"
                      value={formData.endereco.complemento || ''}
                      onChange={handleInputChange}
                      className="tiny-input"
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.bairro">Bairro*</label>
                    <input
                      type="text"
                      id="endereco.bairro"
                      name="endereco.bairro"
                      value={formData.endereco.bairro}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.cep">CEP*</label>
                    <input
                      type="text"
                      id="endereco.cep"
                      name="endereco.cep"
                      value={formData.endereco.cep}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.cidade">Cidade*</label>
                    <input
                      type="text"
                      id="endereco.cidade"
                      name="endereco.cidade"
                      value={formData.endereco.cidade}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                    />
                  </div>
                  
                  <div className="tiny-input-group">
                    <label htmlFor="endereco.uf">UF*</label>
                    <input
                      type="text"
                      id="endereco.uf"
                      name="endereco.uf"
                      value={formData.endereco.uf}
                      onChange={handleInputChange}
                      className="tiny-input"
                      required
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
              
              <div className="tiny-detalhe-section">
                <h3 className="tiny-section-title">Observações</h3>
                <textarea
                  id="observacao"
                  name="observacao"
                  value={formData.observacao || ''}
                  onChange={handleInputChange}
                  className="tiny-textarea"
                  rows={4}
                />
              </div>
              
              <div className="tiny-detalhe-actions-bottom">
                <button 
                  className="tiny-button tiny-button-secondary"
                  onClick={handleCancelar}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                
                <button 
                  className="tiny-button"
                  onClick={handleSalvar}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DetalheClienteTiny; 