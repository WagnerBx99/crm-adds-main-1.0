import axios from "axios";
import { Contact } from "@/lib/types";
import { TINY_CONFIG, USE_MOCK_API } from "@/config";

// Usar o token da API do arquivo de configuração centralizado
const TINY_API_TOKEN = TINY_CONFIG.API_TOKEN;
const TINY_API_BASE_URL = TINY_CONFIG.API_BASE_URL;

// Dados simulados para desenvolvimento
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Cliente Simulado 1",
    email: "cliente1@exemplo.com",
    phone: "(11) 98765-4321",
    company: "Empresa Exemplo Ltda",
    personType: "legal",
    document: "12.345.678/0001-90",
    zipCode: "01234-567",
    city: "São Paulo",
    state: "SP",
    address: "Avenida Paulista",
    neighborhood: "Bela Vista",
    number: "1000",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Cliente Simulado 2",
    email: "cliente2@exemplo.com",
    phone: "(21) 98765-4321",
    company: "",
    personType: "natural",
    document: "123.456.789-00",
    zipCode: "20000-000",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Avenida Atlântica",
    neighborhood: "Copacabana",
    number: "500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Função para buscar contatos da API Tiny
export const fetchTinyContacts = async (): Promise<Contact[]> => {
  if (USE_MOCK_API) {
    console.log("Usando dados simulados para fetchTinyContacts");
    return mockContacts;
  }

  try {
    const response = await axios.get(
      `${TINY_API_BASE_URL}/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json`
    );

    if (response.data.retorno.status === "OK") {
      const contacts = response.data.retorno.contatos.map((contact: any) => ({
        id: contact.id,
        name: contact.nome,
        email: contact.email || "",
        phone: contact.fone || "",
        company: contact.empresa || "",
        personType: contact.tipo_pessoa || "natural",
        document: contact.cpf_cnpj || "",
        zipCode: contact.cep || "",
        city: contact.cidade || "",
        state: contact.uf || "",
        address: contact.endereco || "",
        neighborhood: contact.bairro || "",
        number: contact.numero || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return contacts;
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar contatos da API Tiny:", error);
    return [];
  }
};

// Função para buscar um contato específico da API Tiny
export const fetchTinyContactById = async (id: string): Promise<Contact | null> => {
  if (USE_MOCK_API) {
    console.log(`Usando dados simulados para fetchTinyContactById: ${id}`);
    const contact = mockContacts.find(c => c.id === id);
    return contact || null;
  }

  try {
    const response = await axios.get(
      `${TINY_API_BASE_URL}/contato.obter.php?token=${TINY_API_TOKEN}&id=${id}&formato=json`
    );

    if (response.data.retorno.status === "OK") {
      const contactData = response.data.retorno.contato;
      return {
        id: contactData.id,
        name: contactData.nome,
        email: contactData.email || "",
        phone: contactData.fone || "",
        company: contactData.empresa || "",
        personType: contactData.tipo_pessoa || "natural",
        document: contactData.cpf_cnpj || "",
        zipCode: contactData.cep || "",
        city: contactData.cidade || "",
        state: contactData.uf || "",
        address: contactData.endereco || "",
        neighborhood: contactData.bairro || "",
        number: contactData.numero || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar contato ${id} da API Tiny:`, error);
    return null;
  }
};

// Função para criar um novo contato na API Tiny
export const createTinyContact = async (contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">): Promise<Contact | null> => {
  if (USE_MOCK_API) {
    console.log("Usando dados simulados para createTinyContact");
    const newId = (parseInt(mockContacts[mockContacts.length - 1]?.id || "0") + 1).toString();
    const newContact: Contact = {
      id: newId,
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockContacts.push(newContact);
    return newContact;
  }

  try {
    const tinyContactData = {
      contato: {
        nome: contactData.name,
        email: contactData.email,
        fone: contactData.phone,
        empresa: contactData.company,
        tipo_pessoa: contactData.personType,
        cpf_cnpj: contactData.document,
        cep: contactData.zipCode,
        cidade: contactData.city,
        uf: contactData.state,
        endereco: contactData.address,
        bairro: contactData.neighborhood,
        numero: contactData.number,
      },
    };

    const response = await axios.post(
      `${TINY_API_BASE_URL}/contato.incluir.php`,
      {
        token: TINY_API_TOKEN,
        formato: "json",
        contato: JSON.stringify(tinyContactData),
      }
    );

    if (response.data.retorno.status === "OK") {
      const newContactId = response.data.retorno.registros[0].id;
      return {
        id: newContactId,
        ...contactData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao criar contato na API Tiny:", error);
    return null;
  }
};

// Função para atualizar um contato existente na API Tiny
export const updateTinyContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
  if (USE_MOCK_API) {
    console.log(`Usando dados simulados para updateTinyContact: ${id}`);
    const contactIndex = mockContacts.findIndex(c => c.id === id);
    if (contactIndex === -1) return null;
    
    const updatedContact = {
      ...mockContacts[contactIndex],
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
    mockContacts[contactIndex] = updatedContact;
    return updatedContact;
  }

  try {
    const tinyContactData = {
      id,
      nome: contactData.name,
      email: contactData.email,
      fone: contactData.phone,
      empresa: contactData.company,
      tipo_pessoa: contactData.personType,
      cpf_cnpj: contactData.document,
      cep: contactData.zipCode,
      cidade: contactData.city,
      uf: contactData.state,
      endereco: contactData.address,
      bairro: contactData.neighborhood,
      numero: contactData.number,
    };

    const response = await axios.post(
      `${TINY_API_BASE_URL}/contato.alterar.php`,
      {
        token: TINY_API_TOKEN,
        formato: "json",
        contato: JSON.stringify({ contato: tinyContactData }),
      }
    );

    if (response.data.retorno.status === "OK") {
      // Buscar o contato atualizado para garantir que temos os dados mais recentes
      return await fetchTinyContactById(id);
    }
    return null;
  } catch (error) {
    console.error(`Erro ao atualizar contato ${id} na API Tiny:`, error);
    return null;
  }
};

// Função para excluir um contato da API Tiny
export const deleteTinyContact = async (id: string): Promise<boolean> => {
  if (USE_MOCK_API) {
    console.log(`Usando dados simulados para deleteTinyContact: ${id}`);
    const contactIndex = mockContacts.findIndex(c => c.id === id);
    if (contactIndex === -1) return false;
    
    mockContacts.splice(contactIndex, 1);
    return true;
  }

  try {
    const response = await axios.post(
      `${TINY_API_BASE_URL}/contato.excluir.php`,
      {
        token: TINY_API_TOKEN,
        formato: "json",
        id,
      }
    );

    return response.data.retorno.status === "OK";
  } catch (error) {
    console.error(`Erro ao excluir contato ${id} da API Tiny:`, error);
    return false;
  }
};

// Função para sincronizar contatos locais com a API Tiny
export const syncContacts = async (): Promise<Contact[]> => {
  if (USE_MOCK_API) {
    console.log("Usando dados simulados para syncContacts");
    return mockContacts;
  }

  try {
    return await fetchTinyContacts();
  } catch (error) {
    console.error("Erro ao sincronizar contatos com a API Tiny:", error);
    return [];
  }
};

// Função para buscar contatos específicos na API Tiny com critérios de pesquisa
export const searchTinyContactByCriteria = async (searchCriteria: {
  email?: string;
  cpf_cnpj?: string;
  telefone?: string;
  nome?: string;
}): Promise<Contact | null> => {
  if (USE_MOCK_API) {
    console.log("Usando dados simulados para searchTinyContactByCriteria");
    
    // Busca nos dados simulados
    const foundContact = mockContacts.find(contact => {
      const normalizeString = (str: string) => str?.toLowerCase().trim().replace(/\D/g, '') || '';
      
      // Normalizar critérios de busca
      const searchEmail = normalizeString(searchCriteria.email || '');
      const searchDoc = normalizeString(searchCriteria.cpf_cnpj || '');
      const searchPhone = normalizeString(searchCriteria.telefone || '');
      const searchName = searchCriteria.nome?.toLowerCase().trim() || '';
      
      // Normalizar dados do contato
      const contactEmail = normalizeString(contact.email);
      const contactDoc = normalizeString(contact.document);
      const contactPhone = normalizeString(contact.phone);
      const contactName = contact.name?.toLowerCase().trim() || '';
      
      return (
        (searchEmail && contactEmail && searchEmail === contactEmail) ||
        (searchDoc && contactDoc && searchDoc === contactDoc) ||
        (searchPhone && contactPhone && searchPhone === contactPhone) ||
        (searchName && contactName && contactName.includes(searchName))
      );
    });
    
    return foundContact || null;
  }

  console.log('🔍 [TinyAPI] Iniciando busca com critérios:', searchCriteria);
  console.log('🔧 [TinyAPI] Configuração:', {
    baseUrl: TINY_API_BASE_URL,
    token: TINY_API_TOKEN ? `${TINY_API_TOKEN.substring(0, 10)}...` : 'NÃO CONFIGURADO'
  });

  try {
    // Buscar por diferentes critérios na API do Tiny
    const searchQueries = [];
    
    if (searchCriteria.email) {
      searchQueries.push(searchCriteria.email);
    }
    if (searchCriteria.cpf_cnpj) {
      searchQueries.push(searchCriteria.cpf_cnpj.replace(/\D/g, ''));
    }
    if (searchCriteria.telefone) {
      searchQueries.push(searchCriteria.telefone.replace(/\D/g, ''));
    }
    if (searchCriteria.nome) {
      searchQueries.push(searchCriteria.nome);
    }

    console.log('📋 [TinyAPI] Queries de busca:', searchQueries);

    // Fazer múltiplas buscas se necessário
    for (const query of searchQueries) {
      try {
        // Corrigir URL removendo barra dupla
        const baseUrl = TINY_API_BASE_URL.endsWith('/') ? TINY_API_BASE_URL.slice(0, -1) : TINY_API_BASE_URL;
        const url = `${baseUrl}/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json&pesquisa=${encodeURIComponent(query)}`;
        console.log('🌐 [TinyAPI] Fazendo requisição para:', url.replace(TINY_API_TOKEN, 'TOKEN_OCULTO'));
        
        const response = await axios.get(url);
        
        console.log('📡 [TinyAPI] Status da resposta:', response.status);
        console.log('📄 [TinyAPI] Dados completos da resposta:', JSON.stringify(response.data, null, 2));

        // Verificar diferentes formatos de resposta da API Tiny
        if (response.data?.retorno) {
          const retorno = response.data.retorno;
          console.log('📋 [TinyAPI] Status do retorno:', retorno.status);
          console.log('📋 [TinyAPI] Código do status:', retorno.codigo_status);
          
          // API Tiny pode retornar diferentes status
          if (retorno.status === "OK" || retorno.codigo_status === 200) {
            if (retorno.contatos && retorno.contatos.length > 0) {
              const contacts = retorno.contatos;
              console.log(`✅ [TinyAPI] Encontrados ${contacts.length} contatos para query "${query}"`);
              
              // Procurar o contato que melhor corresponde aos critérios
              for (const contactWrapper of contacts) {
                // A API Tiny retorna os contatos dentro de um objeto 'contato'
                const contact = contactWrapper.contato || contactWrapper;
                console.log('🔍 [TinyAPI] Analisando contato completo:', JSON.stringify(contact, null, 2));

                const normalizeString = (str: string) => str?.toLowerCase().trim().replace(/\D/g, '') || '';
                
                const contactEmail = normalizeString(contact.email || '');
                const contactDoc = normalizeString(contact.cpf_cnpj || '');
                const contactPhone = normalizeString(contact.fone || contact.celular || '');
                const contactName = (contact.nome || '').toLowerCase().trim();
                
                const searchEmail = normalizeString(searchCriteria.email || '');
                const searchDoc = normalizeString(searchCriteria.cpf_cnpj || '');
                const searchPhone = normalizeString(searchCriteria.telefone || '');
                const searchName = (searchCriteria.nome || '').toLowerCase().trim();
                
                // Verificar se há correspondência exata ou parcial
                const emailMatch = searchEmail && contactEmail && searchEmail === contactEmail;
                const docMatch = searchDoc && contactDoc && searchDoc === contactDoc;
                const phoneMatch = searchPhone && contactPhone && (searchPhone === contactPhone || contactPhone.includes(searchPhone));
                const nameMatch = searchName && contactName && (contactName === searchName || contactName.includes(searchName));
                
                console.log('🎯 [TinyAPI] Verificando correspondências detalhadas:', {
                  searchCriteria: {
                    email: searchEmail,
                    doc: searchDoc,
                    phone: searchPhone,
                    name: searchName
                  },
                  contactData: {
                    email: contactEmail,
                    doc: contactDoc,
                    phone: contactPhone,
                    name: contactName
                  },
                  matches: {
                    emailMatch,
                    docMatch,
                    phoneMatch,
                    nameMatch
                  }
                });
                
                if (emailMatch || docMatch || phoneMatch || nameMatch) {
                  console.log('✅ [TinyAPI] CONTATO ENCONTRADO! Dados do contato:', contact);
                  
                  // Converter para o formato interno
                  const foundContact = {
                    id: contact.id || contact.codigo,
                    name: contact.nome,
                    email: contact.email || "",
                    phone: contact.fone || contact.celular || "",
                    company: contact.fantasia || contact.empresa || "",
                    personType: (contact.tipo_pessoa === 'J' ? "legal" : "natural") as "legal" | "natural",
                    document: contact.cpf_cnpj || "",
                    zipCode: contact.cep || "",
                    city: contact.cidade || "",
                    state: contact.uf || "",
                    address: contact.endereco || "",
                    neighborhood: contact.bairro || "",
                    number: contact.numero || "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  
                  console.log('🎉 [TinyAPI] Contato convertido:', foundContact);
                  return foundContact;
                }
              }
            } else {
              console.log(`ℹ️ [TinyAPI] Nenhum contato encontrado para query "${query}"`);
            }
          } else {
            console.warn('⚠️ [TinyAPI] Status não OK:', {
              status: retorno.status,
              codigo_status: retorno.codigo_status,
              descricao_erro: retorno.descricao_erro,
              retorno_completo: retorno
            });
          }
        } else {
          console.warn('⚠️ [TinyAPI] Resposta sem campo retorno:', response.data);
        }
      } catch (queryError) {
        console.error(`❌ [TinyAPI] Erro na busca por "${query}":`, queryError);
        if (queryError.response) {
          console.error('📄 [TinyAPI] Resposta de erro:', queryError.response.data);
          console.error('📊 [TinyAPI] Status de erro:', queryError.response.status);
        }
        // Continuar com a próxima query
      }
    }
    
    console.log('❌ [TinyAPI] Contato não encontrado na API Tiny para os critérios:', searchCriteria);
    return null;
    
  } catch (error) {
    console.error("❌ [TinyAPI] Erro geral ao buscar contato na API Tiny:", error);
    if (error.response) {
      console.error('📄 [TinyAPI] Resposta de erro geral:', error.response.data);
      console.error('📊 [TinyAPI] Status de erro geral:', error.response.status);
    }
    return null;
  }
};

// Função para testar a conectividade com a API do Tiny
export const testTinyApiConnection = async (): Promise<{success: boolean, message: string, data?: any}> => {
  if (USE_MOCK_API) {
    return {
      success: true,
      message: "Usando dados simulados - API mock ativa",
      data: mockContacts
    };
  }

  try {
    console.log('🧪 [TinyAPI] Testando conectividade...');
    console.log('🔧 [TinyAPI] URL Base:', TINY_API_BASE_URL);
    console.log('🔑 [TinyAPI] Token:', TINY_API_TOKEN ? `${TINY_API_TOKEN.substring(0, 10)}...` : 'NÃO CONFIGURADO');

    // Fazer uma requisição simples para listar contatos (sem filtro)
    const baseUrl = TINY_API_BASE_URL.endsWith('/') ? TINY_API_BASE_URL.slice(0, -1) : TINY_API_BASE_URL;
    const url = `${baseUrl}/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json&registros_por_pagina=1`;
    console.log('🌐 [TinyAPI] URL de teste:', url.replace(TINY_API_TOKEN, 'TOKEN_OCULTO'));

    const response = await axios.get(url);
    
    console.log('📡 [TinyAPI] Status da resposta:', response.status);
    console.log('📄 [TinyAPI] Dados da resposta:', response.data);

    if (response.data?.retorno?.status === "OK") {
      return {
        success: true,
        message: `Conexão OK! ${response.data.retorno.contatos?.length || 0} contatos encontrados`,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: `Erro na API: ${response.data?.retorno?.codigo_erro || 'Desconhecido'} - ${response.data?.retorno?.descricao_erro || 'Sem descrição'}`,
        data: response.data
      };
    }
  } catch (error) {
    console.error('❌ [TinyAPI] Erro no teste de conectividade:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error.response) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      console.error('📄 [TinyAPI] Resposta de erro:', error.response.data);
    } else if (error.request) {
      errorMessage = 'Sem resposta do servidor (possível problema de rede/CORS)';
      console.error('📡 [TinyAPI] Requisição sem resposta:', error.request);
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      data: error.response?.data
    };
  }
};

// Função para testar diferentes URLs da API do Tiny
export const debugTinyApiUrls = async (): Promise<{results: any[]}> => {
  const testUrls = [
    // URL com proxy (desenvolvimento)
    `/api/tiny/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json&registros_por_pagina=1`,
    // URL direta (sem proxy)
    `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json&registros_por_pagina=1`,
    // URL configurada
    `${TINY_API_BASE_URL}/contatos.pesquisa.php?token=${TINY_API_TOKEN}&formato=json&registros_por_pagina=1`
  ];

  const results = [];

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    const urlType = i === 0 ? 'Proxy' : i === 1 ? 'Direta' : 'Configurada';
    
    console.log(`🧪 [Debug] Testando URL ${urlType}:`, url.replace(TINY_API_TOKEN, 'TOKEN_OCULTO'));
    
    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 segundos
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const result = {
        type: urlType,
        url: url.replace(TINY_API_TOKEN, 'TOKEN_OCULTO'),
        success: true,
        status: response.status,
        data: response.data
      };
      
      console.log(`✅ [Debug] ${urlType} funcionou:`, result);
      results.push(result);
      
    } catch (error) {
      const result = {
        type: urlType,
        url: url.replace(TINY_API_TOKEN, 'TOKEN_OCULTO'),
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
      
      console.error(`❌ [Debug] ${urlType} falhou:`, result);
      results.push(result);
    }
  }

  return { results };
};

// Exportar um objeto com todas as funções do serviço
const tinyService = {
  fetchTinyContacts,
  fetchTinyContactById,
  createTinyContact,
  updateTinyContact,
  deleteTinyContact,
  syncContacts,
  searchTinyContactByCriteria,
  testTinyApiConnection,
  debugTinyApiUrls,
};

export default tinyService; 