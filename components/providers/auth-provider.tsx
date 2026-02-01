"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { authApi } from '@/lib/api';
import { AUTH_CONFIG } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/cadastro', '/orcamento', '/personalizar', '/arte/aprovar'];

// Permission mappings
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  MASTER: ['*'], // All permissions
  GESTOR: [
    'view_dashboard',
    'view_orders',
    'create_orders',
    'edit_orders',
    'delete_orders',
    'view_customers',
    'create_customers',
    'edit_customers',
    'view_settings',
    'view_reports',
    'manage_users',
    'view_tiny',
  ],
  PRESTADOR: [
    'view_orders',
    'edit_own_orders',
    'view_customers',
  ],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(currentUser));
          } catch {
            // Token invalid, clear storage
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const response = await authApi.login(email, password, rememberMe);
    setUser(response.user);
    router.push('/');
  }, [router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const canAccess = useCallback((permission: string) => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes('*') || permissions.includes(permission);
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
