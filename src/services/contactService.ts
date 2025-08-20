import { PublicContact, TinyApiResponse, CepApiResponse } from '@/types/contact';

/**
 * Busca informações de endereço pelo CEP
 */
export async function fetchAddressByCep(cep: string): Promise<CepApiResponse> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data: CepApiResponse = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Erro na consulta de CEP:', error);
    throw new Error('Não foi possível consultar o CEP. Verifique e tente novamente.');
  }
}

/**
 * Cria um contato (simulado para evitar problema CORS)
 */
export async function createContactInTiny(contact: PublicContact): Promise<TinyApiResponse> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const savedContacts = JSON.parse(localStorage.getItem('publicContacts') || '[]');
    const newContact = {
      ...contact,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      status: 'pending_integration'
    };
    
    savedContacts.push(newContact);
    localStorage.setItem('publicContacts', JSON.stringify(savedContacts));
    
    console.log('✅ Contato salvo localmente:', newContact);
    
    const mockResponse: TinyApiResponse = {
      retorno: {
        status: 'OK',
        codigo_status: 200,
        status_processamento: 3
      }
    };

    return mockResponse;
  } catch (error) {
    console.error('Erro ao processar contato:', error);
    throw new Error('Não foi possível realizar o cadastro. Tente novamente.');
  }
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  if (digit !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  return digit === parseInt(cleanCpf.charAt(10));
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
  }
  
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  if (digit !== parseInt(cleanCnpj.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
  }
  
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  return digit === parseInt(cleanCnpj.charAt(13));
}

/**
 * Valida e-mail
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Aplica máscara de CPF
 */
export function maskCPF(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Aplica máscara de CNPJ
 */
export function maskCNPJ(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Aplica máscara de telefone
 */
export function maskPhone(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
}

/**
 * Aplica máscara de CEP
 */
export function maskCEP(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
} 