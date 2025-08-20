import { Customer } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createContact } from './contactService';

// Tipos para o mapeamento de campos
export interface FieldMapping {
  sourceField: string;
  targetField: string;
}

// Tipos para os resultados da importação
export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    message: string;
    data: Record<string, any>;
  }>;
}

// Validadores para os campos
const validators = {
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  phone: (value: string): boolean => {
    // Aceita formatos como (XX) XXXXX-XXXX ou XX XXXXX-XXXX ou apenas números
    const phoneRegex = /^(\(\d{2}\)|\d{2})\s?9?\d{4}-?\d{4}$/;
    return phoneRegex.test(value);
  },
  document: (value: string): boolean => {
    // Validação simplificada para CPF/CNPJ (apenas verifica o formato)
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
    return cpfRegex.test(value) || cnpjRegex.test(value);
  },
  zipCode: (value: string): boolean => {
    // Aceita formato XXXXX-XXX ou apenas números
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    return zipCodeRegex.test(value);
  }
};

// Função para validar um contato
function validateContact(contact: Partial<Customer>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar campos obrigatórios
  if (!contact.name || contact.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }

  if (!contact.email || contact.email.trim() === '') {
    errors.push('E-mail é obrigatório');
  } else if (!validators.email(contact.email)) {
    errors.push('E-mail inválido');
  }

  // Validar campos opcionais se estiverem preenchidos
  if (contact.phone && !validators.phone(contact.phone)) {
    errors.push('Telefone inválido');
  }

  if (contact.document && !validators.document(contact.document)) {
    errors.push('CPF/CNPJ inválido');
  }

  if (contact.zipCode && !validators.zipCode(contact.zipCode)) {
    errors.push('CEP inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para verificar se um contato já existe (por email)
async function checkDuplicate(contact: Partial<Customer>, existingContacts: Customer[]): Promise<boolean> {
  return existingContacts.some(existing => 
    existing.email.toLowerCase() === contact.email?.toLowerCase()
  );
}

// Função para processar um arquivo CSV
export async function processCSV(
  fileContent: string,
  fieldMappings: FieldMapping[],
  existingContacts: Customer[]
): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Processar o conteúdo do CSV
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());

    // Processar cada linha (exceto o cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      result.total++;
      
      try {
        const values = line.split(',').map(value => value.trim());
        const contactData: Partial<Customer> = {};
        
        // Mapear os valores para os campos do contato
        fieldMappings.forEach(mapping => {
          if (mapping.targetField) {
            const headerIndex = headers.indexOf(mapping.sourceField);
            if (headerIndex !== -1) {
              (contactData as any)[mapping.targetField] = values[headerIndex] || '';
            }
          }
        });

        // Validar o contato
        const validation = validateContact(contactData);
        if (!validation.isValid) {
          result.errors.push({
            row: i,
            message: validation.errors.join(', '),
            data: headers.reduce((obj, header, index) => {
              obj[header] = values[index] || '';
              return obj;
            }, {} as Record<string, any>)
          });
          result.skipped++;
          continue;
        }

        // Verificar duplicatas
        const isDuplicate = await checkDuplicate(contactData, existingContacts);
        if (isDuplicate) {
          result.errors.push({
            row: i,
            message: 'Contato duplicado (e-mail já existe)',
            data: headers.reduce((obj, header, index) => {
              obj[header] = values[index] || '';
              return obj;
            }, {} as Record<string, any>)
          });
          result.skipped++;
          continue;
        }

        // Criar o contato
        await createContact(contactData as Omit<Customer, 'id' | 'createdAt'>);
        result.imported++;
      } catch (error) {
        console.error(`Erro ao processar linha ${i}:`, error);
        result.errors.push({
          row: i,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          data: {}
        });
        result.skipped++;
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao processar arquivo CSV:', error);
    throw error;
  }
}

// Função principal para importar contatos
export async function importContacts(
  file: File,
  fieldMappings: FieldMapping[],
  existingContacts: Customer[]
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const result = await processCSV(content, fieldMappings, existingContacts);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsText(file);
  });
}

// Função para validar o mapeamento de campos
export function validateFieldMappings(fieldMappings: FieldMapping[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verificar se os campos obrigatórios estão mapeados
  const hasName = fieldMappings.some(mapping => mapping.targetField === 'name');
  const hasEmail = fieldMappings.some(mapping => mapping.targetField === 'email');
  
  if (!hasName) {
    errors.push('O campo Nome é obrigatório e deve ser mapeado');
  }
  
  if (!hasEmail) {
    errors.push('O campo E-mail é obrigatório e deve ser mapeado');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 