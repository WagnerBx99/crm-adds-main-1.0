import { API_BASE_URL, AUTH_CONFIG } from './config';
import type { 
  User, 
  Order, 
  Customer, 
  ApiResponse, 
  PaginatedResponse,
  TinyContact,
  TinyProduct,
  OrderStatus 
} from './types';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
};

// Base fetch wrapper with auth
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string, rememberMe = false) => {
    const response = await fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    
    if (response.token) {
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.user));
      if (rememberMe) {
        localStorage.setItem(AUTH_CONFIG.REMEMBER_KEY, 'true');
      }
    }
    
    return response;
  },

  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      localStorage.removeItem(AUTH_CONFIG.REMEMBER_KEY);
    }
  },

  getCurrentUser: async () => {
    return fetchApi<User>('/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return fetchApi<ApiResponse<void>>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    
    return fetchApi<PaginatedResponse<Order>>(`/orders?${searchParams}`);
  },

  getKanban: async () => {
    return fetchApi<{ columns: Record<OrderStatus, Order[]> }>('/orders/kanban');
  },

  getById: async (id: string) => {
    return fetchApi<Order>(`/orders/${id}`);
  },

  create: async (data: Partial<Order>) => {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Order>) => {
    return fetchApi<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: OrderStatus, comment?: string) => {
    return fetchApi<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  addComment: async (id: string, content: string) => {
    return fetchApi<Order>(`/orders/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// Customers API
export const customersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    
    return fetchApi<PaginatedResponse<Customer>>(`/customers?${searchParams}`);
  },

  getById: async (id: string) => {
    return fetchApi<Customer>(`/customers/${id}`);
  },

  create: async (data: Partial<Customer>) => {
    return fetchApi<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Customer>) => {
    return fetchApi<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Tiny API
export const tinyApi = {
  getConfig: async () => {
    return fetchApi<{ apiToken: string; enabled: boolean; lastSync?: string }>('/tiny/config');
  },

  updateConfig: async (apiToken: string) => {
    return fetchApi<ApiResponse<void>>('/tiny/config', {
      method: 'PUT',
      body: JSON.stringify({ apiToken }),
    });
  },

  getContacts: async (search?: string) => {
    const params = search ? `?pesquisa=${encodeURIComponent(search)}` : '';
    return fetchApi<{ contatos: TinyContact[] }>(`/tiny/contatos${params}`);
  },

  getProducts: async (search?: string) => {
    const params = search ? `?pesquisa=${encodeURIComponent(search)}` : '';
    return fetchApi<{ produtos: TinyProduct[] }>(`/tiny/produtos${params}`);
  },

  syncContacts: async () => {
    return fetchApi<ApiResponse<{ synced: number }>>('/tiny/sync/contatos', {
      method: 'POST',
    });
  },

  syncProducts: async () => {
    return fetchApi<ApiResponse<{ synced: number }>>('/tiny/sync/produtos', {
      method: 'POST',
    });
  },

  testConnection: async () => {
    return fetchApi<ApiResponse<{ connected: boolean }>>('/tiny/test');
  },
};

// Users API (Admin)
export const usersApi = {
  getAll: async () => {
    return fetchApi<User[]>('/users');
  },

  getById: async (id: string) => {
    return fetchApi<User>(`/users/${id}`);
  },

  create: async (data: { name: string; email: string; password: string; role: string }) => {
    return fetchApi<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<User>) => {
    return fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    return fetchApi<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  },

  markAsRead: async (id: string) => {
    return fetchApi<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return fetchApi<void>('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};

// File Upload
export const uploadApi = {
  uploadFile: async (file: File, type: 'artwork' | 'attachment' | 'logo') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload');
    }

    return response.json() as Promise<{ url: string; filename: string }>;
  },
};
