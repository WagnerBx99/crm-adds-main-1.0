import { Customer } from '@/types';
import { customers as mockCustomers } from '@/lib/data';
import tinyService from './tinyService';
import { v4 as uuidv4 } from 'uuid';

// Armazenamento local de contatos (simulando um banco de dados)
let localCustomers: Customer[] = [...mockCustomers];

// Interface para logs de sincronização
interface SyncLog {
  id: string;
  timestamp: Date;
  action: 'sync' | 'create' | 'update' | 'delete';
  status: 'success' | 'error';
  details?: string;
  entityId?: string;
}

// Armazenamento local de logs de sincronização
const syncLogs: SyncLog[] = [];

// Função para adicionar um log de sincronização
function addSyncLog(
  action: 'sync' | 'create' | 'update' | 'delete',
  status: 'success' | 'error',
  details?: string,
  entityId?: string
): void {
  syncLogs.unshift({
    id: uuidv4(),
    timestamp: new Date(),
    action,
    status,
    details,
    entityId,
  });
  
  // Limitar o número de logs armazenados (opcional)
  if (syncLogs.length > 1000) {
    syncLogs.pop();
  }
}

// Função para buscar todos os contatos
export async function getContacts(): Promise<Customer[]> {
  try {
    // Em um ambiente de produção, você buscaria os contatos do backend
    return localCustomers;
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    throw error;
  }
}

// Função para buscar um contato específico
export async function getContactById(id: string): Promise<Customer | undefined> {
  try {
    return localCustomers.find(customer => customer.id === id);
  } catch (error) {
    console.error(`Erro ao buscar contato ${id}:`, error);
    throw error;
  }
}

// Função para criar um novo contato
export async function createContact(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  try {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date(),
    };
    
    // Adicionar o contato localmente
    localCustomers = [...localCustomers, newCustomer];
    
    // Tentar criar o contato na Tiny ERP
    try {
      const tinyId = await tinyService.createTinyContact(newCustomer);
      addSyncLog('create', 'success', `Contato criado com sucesso na Tiny ERP (ID: ${tinyId})`, newCustomer.id);
    } catch (error) {
      addSyncLog('create', 'error', `Erro ao criar contato na Tiny ERP: ${error instanceof Error ? error.message : String(error)}`, newCustomer.id);
      // Não interrompe o fluxo, apenas registra o erro
    }
    
    return newCustomer;
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    throw error;
  }
}

// Função para atualizar um contato existente
export async function updateContact(id: string, customerData: Partial<Customer>): Promise<Customer> {
  try {
    const customerIndex = localCustomers.findIndex(customer => customer.id === id);
    
    if (customerIndex === -1) {
      throw new Error(`Contato com ID ${id} não encontrado`);
    }
    
    const updatedCustomer: Customer = {
      ...localCustomers[customerIndex],
      ...customerData,
    };
    
    // Atualizar o contato localmente
    localCustomers = [
      ...localCustomers.slice(0, customerIndex),
      updatedCustomer,
      ...localCustomers.slice(customerIndex + 1),
    ];
    
    // Tentar atualizar o contato na Tiny ERP
    try {
      const success = await tinyService.updateTinyContact(id, updatedCustomer);
      addSyncLog('update', success ? 'success' : 'error', success ? 'Contato atualizado com sucesso na Tiny ERP' : 'Falha ao atualizar contato na Tiny ERP', id);
    } catch (error) {
      addSyncLog('update', 'error', `Erro ao atualizar contato na Tiny ERP: ${error instanceof Error ? error.message : String(error)}`, id);
      // Não interrompe o fluxo, apenas registra o erro
    }
    
    return updatedCustomer;
  } catch (error) {
    console.error(`Erro ao atualizar contato ${id}:`, error);
    throw error;
  }
}

// Função para excluir um contato
export async function deleteContact(id: string): Promise<boolean> {
  try {
    const customerIndex = localCustomers.findIndex(customer => customer.id === id);
    
    if (customerIndex === -1) {
      throw new Error(`Contato com ID ${id} não encontrado`);
    }
    
    // Remover o contato localmente
    localCustomers = [
      ...localCustomers.slice(0, customerIndex),
      ...localCustomers.slice(customerIndex + 1),
    ];
    
    // Tentar excluir o contato na Tiny ERP
    try {
      const success = await tinyService.deleteTinyContact(id);
      addSyncLog('delete', success ? 'success' : 'error', success ? 'Contato excluído com sucesso na Tiny ERP' : 'Falha ao excluir contato na Tiny ERP', id);
    } catch (error) {
      addSyncLog('delete', 'error', `Erro ao excluir contato na Tiny ERP: ${error instanceof Error ? error.message : String(error)}`, id);
      // Não interrompe o fluxo, apenas registra o erro
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir contato ${id}:`, error);
    throw error;
  }
}

// Função para sincronizar contatos com a Tiny ERP
export async function syncContactsWithTiny(): Promise<{
  added: number;
  updated: number;
  failed: number;
}> {
  try {
    const result = {
      added: 0,
      updated: 0,
      failed: 0,
    };
    
    // Buscar contatos da Tiny ERP
    const tinyContacts = await tinyService.fetchTinyContacts();
    
    // Processar cada contato da Tiny
    for (const tinyContact of tinyContacts) {
      try {
        // Verificar se o contato já existe localmente
        const existingContact = localCustomers.find(customer => customer.id === tinyContact.id);
        
        if (existingContact) {
          // Atualizar contato existente
          await updateContact(tinyContact.id, tinyContact);
          result.updated++;
        } else {
          // Adicionar novo contato
          localCustomers = [...localCustomers, tinyContact];
          result.added++;
        }
      } catch (error) {
        console.error(`Erro ao processar contato ${tinyContact.id}:`, error);
        result.failed++;
      }
    }
    
    // Registrar o resultado da sincronização
    addSyncLog(
      'sync',
      result.failed > 0 ? 'error' : 'success',
      `Sincronização concluída: ${result.added} adicionados, ${result.updated} atualizados, ${result.failed} falhas`
    );
    
    return result;
  } catch (error) {
    console.error('Erro durante a sincronização de contatos:', error);
    addSyncLog('sync', 'error', `Erro durante a sincronização: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Função para obter logs de sincronização
export function getSyncLogs(): SyncLog[] {
  return syncLogs;
}

// Função para reprocessar uma sincronização que falhou
export async function reprocessFailedSync(entityId: string): Promise<boolean> {
  try {
    const contact = await getContactById(entityId);
    
    if (!contact) {
      throw new Error(`Contato com ID ${entityId} não encontrado`);
    }
    
    // Tentar sincronizar novamente com a Tiny ERP
    await tinyService.updateTinyContact(entityId, contact);
    
    addSyncLog('update', 'success', 'Sincronização reprocessada com sucesso', entityId);
    return true;
  } catch (error) {
    console.error(`Erro ao reprocessar sincronização para ${entityId}:`, error);
    addSyncLog('update', 'error', `Erro ao reprocessar sincronização: ${error instanceof Error ? error.message : String(error)}`, entityId);
    return false;
  }
}

// Exportar um objeto com todas as funções do serviço
const contactService = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  syncContactsWithTiny,
  getSyncLogs,
  reprocessFailedSync,
};

export default contactService; 