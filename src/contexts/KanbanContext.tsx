import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { Order, Status, KanbanColumn, Priority } from '@/types';
import { 
  kanbanColumns as initialColumns,
  orders as initialOrders,
  addOrder,
  updateOrderStatus,
  addOrderComment,
  updateOrder,
  mockOrders
} from '@/lib/data';
import { toast } from 'sonner';
import { apiService } from '@/lib/services/apiService';

// Tipos para o contexto
interface KanbanState {
  columns: KanbanColumn[];
  orders: Order[];
  isLoading: boolean;
  lastSyncTime: Date | null;
  useBackendApi: boolean;
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
  | { type: 'SET_USE_BACKEND_API'; payload: boolean }
  | { type: 'SYNC_FROM_STORAGE' };

interface KanbanContextType {
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
  addPublicOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => Promise<Order>;
  refreshFromStorage: () => void;
  refreshFromApi: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
}

// Função auxiliar para mapear pedidos da API para o formato do frontend
function mapApiOrderToFrontend(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    title: apiOrder.title,
    description: apiOrder.description || '',
    status: apiOrder.status as Status,
    priority: (apiOrder.priority || 'NORMAL') as Priority,
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
        lastSyncTime: new Date()
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
      
      // 💾 Salvar automaticamente no localStorage como backup
      try {
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log('💾 Pedidos salvos no localStorage após ADD_ORDER');
      } catch (error) {
        console.error('❌ Erro ao salvar pedidos no localStorage:', error);
      }
      
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
      
      // 💾 Salvar automaticamente no localStorage
      try {
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log('💾 Pedidos salvos no localStorage após UPDATE_ORDER_STATUS');
      } catch (error) {
        console.error('❌ Erro ao salvar pedidos no localStorage:', error);
      }
      
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
      
      // 💾 Salvar automaticamente no localStorage
      try {
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log('💾 Pedidos salvos no localStorage após ADD_COMMENT');
      } catch (error) {
        console.error('❌ Erro ao salvar pedidos no localStorage:', error);
      }
      
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
      
      // 💾 Salvar automaticamente no localStorage
      try {
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log('💾 Pedidos salvos no localStorage após UPDATE_ORDER');
      } catch (error) {
        console.error('❌ Erro ao salvar pedidos no localStorage:', error);
      }
      
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
        newOrdersCount: newOrders.length,
        newOrderTitles: newOrders.map(o => o.title),
        currentOrdersInColumn: state.orders.filter(order => order.status === columnId).map(o => o.title)
      });
      
      // Atualizar a ordem dos pedidos apenas na coluna específica
      const ordersInOtherColumns = state.orders.filter(order => order.status !== columnId);
      const allUpdatedOrders = [...ordersInOtherColumns, ...newOrders];
      
      console.log('📝 Ordens atualizadas:', {
        ordersInOtherColumns: ordersInOtherColumns.length,
        newOrders: newOrders.length,
        totalAfterUpdate: allUpdatedOrders.length
      });
      
      const updatedColumns = state.columns.map(column => {
        if (column.id === columnId) {
          console.log(`✏️  Atualizando coluna ${columnId} com ${newOrders.length} pedidos`);
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
      
      // 💾 Salvar automaticamente no localStorage
      try {
        localStorage.setItem('orders', JSON.stringify(allUpdatedOrders));
        console.log('💾 Pedidos salvos no localStorage após REORDER_ORDERS_IN_COLUMN');
      } catch (error) {
        console.error('❌ Erro ao salvar pedidos no localStorage:', error);
      }
      
      console.log('✅ REORDER_ORDERS_IN_COLUMN concluído');
      
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
    
    case 'SET_USE_BACKEND_API':
      return {
        ...state,
        useBackendApi: action.payload
      };
      
    case 'SYNC_FROM_STORAGE': {
      try {
        console.log('🔄 [SYNC SIMPLIFICADA] Verificando localStorage...');
        
        // Carregar dados do localStorage
        let ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Se não há dados no localStorage, usar dados mock e salvá-los
        if (ordersData.length === 0) {
          console.log('📦 [SYNC] Nenhum dado encontrado no localStorage, carregando dados mock...');
          ordersData = mockOrders;
          localStorage.setItem('orders', JSON.stringify(mockOrders));
          console.log(`📦 [SYNC] ${mockOrders.length} pedidos mock carregados e salvos no localStorage`);
        } else {
          console.log(`📊 [SYNC] ${ordersData.length} pedidos encontrados no localStorage`);
        }
        
        // Atualizar colunas com pedidos filtrados por status
        const updatedColumns = state.columns.map(column => ({
          ...column,
          orders: ordersData.filter((order: any) => order.status === column.id)
        }));
        
        console.log('✅ [SYNC SIMPLIFICADA] Sincronização concluída');
        
        return {
          ...state,
          orders: ordersData,
          columns: updatedColumns,
          lastSyncTime: new Date()
        };
      } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return state;
      }
    }
    
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
    orders: initialOrders,
    isLoading: false,
    lastSyncTime: null,
    useBackendApi: import.meta.env.VITE_USE_BACKEND_API === 'true'
  });
  
  // Função para buscar pedidos da API
  const refreshFromApi = useCallback(async () => {
    if (!apiService.isAuthenticated()) {
      console.log('🔒 [API] Usuário não autenticado, usando localStorage');
      dispatch({ type: 'SYNC_FROM_STORAGE' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🌐 [API] Buscando pedidos do backend...');
      const apiOrders = await apiService.getOrdersKanban();
      
      if (apiOrders && apiOrders.length > 0) {
        console.log(`✅ [API] ${apiOrders.length} pedidos recebidos do backend`);
        const mappedOrders = apiOrders.map(mapApiOrderToFrontend);
        dispatch({ type: 'SET_ORDERS', payload: mappedOrders });
        dispatch({ type: 'SET_USE_BACKEND_API', payload: true });
        
        // Salvar no localStorage como backup
        localStorage.setItem('orders', JSON.stringify(mappedOrders));
      } else {
        console.log('📦 [API] Nenhum pedido no backend, usando localStorage');
        dispatch({ type: 'SYNC_FROM_STORAGE' });
      }
    } catch (error) {
      console.error('❌ [API] Erro ao buscar pedidos:', error);
      console.log('📦 [API] Fallback para localStorage');
      dispatch({ type: 'SYNC_FROM_STORAGE' });
      dispatch({ type: 'SET_USE_BACKEND_API', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  // Sincronização inicial - tenta API primeiro, depois localStorage
  useEffect(() => {
    const initializeData = async () => {
      if (state.useBackendApi && apiService.isAuthenticated()) {
        await refreshFromApi();
      } else {
        dispatch({ type: 'SYNC_FROM_STORAGE' });
      }
    };
    
    initializeData();
  }, []);
  
  // Função para adicionar pedido de orçamento público
  const addPublicOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Promise<Order> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const newOrder: Order = {
        id: `public-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [{
          id: `history-${Date.now()}`,
          date: new Date(),
          status: orderData.status,
          user: 'Sistema',
          comment: 'Pedido criado via interface pública'
        }],
        ...orderData
      };
      
      // Adicionar ao estado local
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      
      // Salvar no data.ts para persistência
      addOrder(orderData);
      
      // Mostrar notificação
      toast.success('🎉 Novo orçamento público recebido!', {
        description: `${newOrder.title} foi adicionado ao kanban automaticamente.`,
        duration: 5000,
      });
      
      return newOrder;
    } catch (error) {
      console.error('Erro ao adicionar pedido público:', error);
      toast.error('Erro ao processar orçamento público');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // Função para forçar atualização do localStorage
  const refreshFromStorage = () => {
    dispatch({ type: 'SYNC_FROM_STORAGE' });
  };
  
  // Função para buscar pedido por ID
  const getOrderById = (id: string): Order | undefined => {
    return state.orders.find(order => order.id === id);
  };
  
  const contextValue: KanbanContextType = {
    state,
    dispatch,
    addPublicOrder,
    refreshFromStorage,
    refreshFromApi,
    getOrderById
  };
  
  return (
    <KanbanContext.Provider value={contextValue}>
      {children}
    </KanbanContext.Provider>
  );
}
