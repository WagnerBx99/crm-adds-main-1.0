export interface PublicContact {
  id?: string;
  nome: string;
  nome_fantasia?: string;
  tipo?: 'fisica' | 'juridica'; // Tipo simplificado para o formulário
  tipo_pessoa: '1' | '2'; // 1=PF, 2=PJ para API Tiny
  cpf_cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  fone: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface TinyContactPayload {
  token: string;
  formato: 'json';
  nome: string;
  nome_fantasia?: string;
  tipo_pessoa: '1' | '2';
  cpf_cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  fone: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface TinyApiResponse {
  retorno: {
    status: string;
    codigo_status: number;
    status_processamento: number;
    descricao_erro?: string;
    registros?: Array<{
      contato: {
        id: string;
        nome: string;
      }
    }>;
  };
}

export interface CepApiResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface ContactFormErrors {
  general?: string;
  nome?: string;
  documento?: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  fone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
} 