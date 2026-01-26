import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { Order, Status, KanbanColumn, Priority } from '@/types';
import { kanbanColumns as initialColumns } from '@/lib/data';
import { toast } from 'sonner';
import { apiService } from '@/lib/services/apiService';

// Tipos para o contexto
interface KanbanState {
  columns: KanbanColumn[];
  orders: Order[];
  isLoading: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

type KanbanAction = 
  | { type: 'SET_COLUMNS'; payload: KanbanColumn[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; newStatus: Status } }
  | { type: 'ADD_COMMENT'; payload: { orderId: string; comment: string } }
  | { type: 'UPDATE_ORDER'; payload: { orderId: string; updatedData: Partial<Order> } }
  | { type: 'REORDER_ORDERS_IN_COLUMN'; payload: { columnId: Status; newOrders: Order[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface KanbanContextType {
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
  addPublicOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => Promise<Order>;
  refreshFromApi: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatusApi: (orderId: string, newStatus: Status, comment?: string) => Promise<void>;
}

// Função auxiliar para mapear pedidos da API para o formato do frontend
function mapApiOrderToFrontend(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    title: apiOrder.title || 'Sem título',
    description: apiOrder.description || '',
    status: apiOrder.status as Status,
    priority: (apiOrder.priority || 'normal') as Priority,
    customer: apiOrder.customer ? {
      id: apiOrder.customer.id,
      name: apiOrder.customer.name,
      email: apiOrder.customer.email || '',
      phone: apiOrder.customer.phone || '',
      company: apiOrder.customer.company || '',
      address: apiOrder.customer.address || '',
      city: apiOrder.customer.city || '',
      state: apiOrder.customer.state || '',
      zipCode: apiOrder.customer.zipCode || '',
      neighborhood: apiOrder.customer.neighborhood || '',
      number: apiOrder.customer.number || '',
      complement: apiOrder.customer.complement || ''
    } : {
      id: '',
      name: 'Cliente não informado',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      neighborhood: '',
      number: '',
      complement: ''
    },
    products: apiOrder.products || [],
    labels: apiOrder.labels || [],
    createdAt: new Date(apiOrder.createdAt),
    updatedAt: new Date(apiOrder.updatedAt),
    dueDate: apiOrder.dueDate ? new Date(apiOrder.dueDate) : undefined,
    assignedTo: apiOrder.assignedTo || undefined,
    comments: apiOrder.comments || [],
    history: (apiOrder.history || []).map((h: any) => ({
      id: h.id,
      date: new Date(h.createdAt || h.date),
      status: h.status,
      user: h.user?.name || h.user || 'Sistema',
      comment: h.comment || h.description || `Status alterado para ${h.status}`
    })),
    artworks: apiOrder.artworks || [],
    artworkActionLogs: apiOrder.artworkActionLogs || [],
    paymentStatus: apiOrder.paymentStatus || 'PENDENTE',
    paymentMethod: apiOrder.paymentMethod || '',
    source: apiOrder.source || 'MANUAL',
    tinyOrderId: apiOrder.tinyOrderId || null
  };
}

// Redutor
function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case 'SET_COLUMNS':
      return {
        ...state,
        columns: action.payload,
        lastSyncTime: new Date()
      };
    
    case 'SET_ORDERS': {
      const orders = action.payload;
      const updatedColumns = state.columns.map(column => ({
        ...column,
        orders: orders.filter(order => order.status === column.id)
      }));
      
      return {
        ...state,
        orders,
        columns: updatedColumns,
        lastSyncTime: new Date(),
        error: null
      };
    }
      
    case 'ADD_ORDER': {
      const newOrder = action.payload;
      const updatedOrders = [...state.orders, newOrder];
      const updatedColumns = state.columns.map(column => {
        if (column.id === newOrder.status) {
          return {
            ...column,
            orders: [...column.orders, newOrder]
          };
        }
        return column;
      });
      
      return {
        ...state,
        orders: updatedOrders,
        columns: updatedColumns,
        lastSyncTime: new Date()
      };
    }
    
    case 'UPDATE_ORDER_STATUS': {
      const { orderId, newStatus } = action.payload;
      const updatedOrders = state.orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            updatedAt: new Date(),
            history: [
              ...order.history,
              {
                id: `history-${Date.now()}`,
                date: new Date(),
                status: newStatus,
                user: 'Sistema',
                comment: `Status alterado para ${newStatus}`
              }
            ]
          };
        }
        return order;
      });
      
      const updatedColumns = state.columns.map(column => ({
        ...column,
        orders: updatedOrders.filter(order => order.status === column.id)
      }));
      
      return {
        ...state,
        orders: updatedOrders,
        columns: updatedColumns,
        lastSyncTime: new Date()
      };
    }
    
    case 'ADD_COMMENT': {
      const { orderId, comment } = action.payload;
      const updatedOrders = state.orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            updatedAt: new Date(),
            comments: [
              ...(order.comments || []),
              {
                id: `comment-${Date.now()}`,
                text: comment,
                createdAt: new Date(),
                user: 'Sistema'
              }
            ]
          };
        }
        return order;
      });
      
      const updatedColumns = state.columns.map(column => ({
        ...column,
        orders: updatedOrders.filter(order => order.status === column.id)
      }));
      
      return {
        ...state,
        orders: updatedOrders,
        columns: updatedColumns,
        lastSyncTime: new Date()
      };
    }
    
    case 'UPDATE_ORDER': {
      const { orderId, updatedData } = action.payload;
      const updatedOrders = state.orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            ...updatedData,
            updatedAt: new Date()
          };
        }
        return order;
      });
      
      const updatedColumns = state.columns.map(column => ({
        ...column,
        orders: updatedOrders.filter(order => order.status === column.id)
      }));
      
      return {
        ...state,
        orders: updatedOrders,
        columns: updatedColumns,
        lastSyncTime: new Date()
      };
    }
    
    case 'REORDER_ORDERS_IN_COLUMN': {
      const { columnId, newOrders } = action.payload;
      
      console.log('🔧 REORDER_ORDERS_IN_COLUMN iniciado:', {
        columnId,
        newOrdersCount: newOrders.length
      });
      
      // Atualizar a ordem dos pedidos apenas na coluna específica
      const ordersInOtherColumns = state.orders.filter(order => order.status !== columnId);
      const allUpdatedOrders = [...ordersInOtherColumns, ...newOrders];
      
      const updatedColumns = state.columns.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            orders: newOrders
          };
        }
        const filteredOrders = allUpdatedOrders.filter(order => order.status === column.id);
        return {
          ...column,
          orders: filteredOrders
        };
      });
      
      return {
        ...state,
        orders: allUpdatedOrders,
        columns: updatedColumns,
        lastSyncTime: new Date()
      };
    }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    default:
      return state;
  }
}

// Context
const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

// Hook para usar o contexto
export function useKanban() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
}

// Provider
interface KanbanProviderProps {
  children: ReactNode;
}

export function KanbanProvider({ children }: KanbanProviderProps) {
  const [state, dispatch] = useReducer(kanbanReducer, {
    columns: initialColumns,
    orders: [],
    isLoading: true,
    lastSyncTime: null,
    error: null
  });
  
  // Função para buscar pedidos da API
  const refreshFromApi = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      console.log('🌐 [API] Buscando pedidos do backend...');
      const apiOrders = await apiService.getOrdersKanban();
      
      if (apiOrders && Array.isArray(apiOrders)) {
        console.log(`✅ [API] ${apiOrders.length} pedidos recebidos do backend`);
        const mappedOrders = apiOrders.map(mapApiOrderToFrontend);
        dispatch({ type: 'SET_ORDERS', payload: mappedOrders });
      } else {
        console.log('⚠️ [API] Nenhum pedido encontrado no backend');
        dispatch({ type: 'SET_ORDERS', payload: [] });
      }
    } catch (error: any) {
      console.error('❌ [API] Erro ao buscar pedidos:', error);
      const errorMessage = error.message || 'Erro ao conectar com o servidor';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Mostrar toast de erro apenas se não for erro de autenticação
      if (!errorMessage.includes('Sessão expirada')) {
        toast.error('Erro ao carregar pedidos', {
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  // Função para atualizar status via API
  const updateOrderStatusApi = useCallback(async (orderId: string, newStatus: Status, comment?: string) => {
    try {
      console.log(`🔄 [API] Atualizando status do pedido ${orderId} para ${newStatus}`);
      await apiService.updateOrderStatus(orderId, newStatus, comment);
      
      // Atualizar estado local
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus } });
      
      toast.success('Status atualizado', {
        description: `Pedido movido para ${newStatus}`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('❌ [API] Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Não foi possível atualizar o status',
        duration: 5000,
      });
      
      // Recarregar dados para sincronizar com o backend
      await refreshFromApi();
    }
  }, [refreshFromApi]);
  
  // Sincronização inicial - busca da API
  useEffect(() => {
    // Verificar se o usuário está autenticado antes de buscar
    if (apiService.isAuthenticated()) {
      refreshFromApi();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
    }
  }, [refreshFromApi]);
  
  // Função para adicionar pedido via API
  const addPublicOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Promise<Order> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🌐 [API] Criando novo pedido...');
      
      // Criar pedido via API
      const apiOrder = await apiService.createOrder({
        title: orderData.title,
        description: orderData.description,
        status: orderData.status,
        priority: orderData.priority,
        customerId: orderData.customer?.id,
        products: orderData.products,
        labels: orderData.labels,
        dueDate: orderData.dueDate
      });
      
      const newOrder = mapApiOrderToFrontend(apiOrder);
      
      // Adicionar ao estado local
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      
      toast.success('🎉 Pedido criado com sucesso!', {
        description: `${newOrder.title} foi adicionado ao kanban.`,
        duration: 5000,
      });
      
      return newOrder;
    } catch (error: any) {
      console.error('❌ [API] Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido', {
        description: error.message || 'Não foi possível criar o pedido',
        duration: 5000,
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // Função para buscar pedido por ID
  const getOrderById = (id: string): Order | undefined => {
    return state.orders.find(order => order.id === id);
  };
  
  const contextValue: KanbanContextType = {
    state,
    dispatch,
    addPublicOrder,
    refreshFromApi,
    getOrderById,
    updateOrderStatusApi
  };
  
  return (
    <KanbanContext.Provider value={contextValue}>
      {children}
    </KanbanContext.Provider>
  );
}
