/**
 * Hook de autenticação que escolhe entre backend PostgreSQL e localStorage
 * baseado na configuração USE_BACKEND_API
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { USE_BACKEND_API } from '@/config';
import { authService } from '@/lib/services/authService';
import { authServiceBackend } from '@/lib/services/authServiceBackend';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
  devLogin: () => Promise<User | null>;
  hasPermission: (permission: string) => boolean;
  renewSession: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escolhe o serviço baseado na configuração
  const service = USE_BACKEND_API ? authServiceBackend : authService;

  useEffect(() => {
    // Carregar usuário atual ao inicializar
    const currentUser = service.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    setIsLoading(true);
    try {
      let result: User | null;
      
      if (USE_BACKEND_API) {
        result = await authServiceBackend.login(credentials);
      } else {
        result = authService.login(credentials);
      }
      
      setUser(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (USE_BACKEND_API) {
        await authServiceBackend.logout();
      } else {
        authService.logout();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const devLogin = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      let result: User | null;
      
      if (USE_BACKEND_API) {
        result = await authServiceBackend.devLogin();
      } else {
        result = authService.devLogin();
      }
      
      setUser(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    return service.hasPermission(permission as any);
  }, [service]);

  const renewSession = useCallback((): void => {
    service.renewSession();
  }, [service]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && service.isLoggedIn(),
    login,
    logout,
    devLogin,
    hasPermission,
    renewSession,
  };
}

export default useAuth;
