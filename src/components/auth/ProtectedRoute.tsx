import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/lib/services/authService';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: keyof import('@/types').RolePermissions;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredPermission 
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar autenticação
    const isLoggedIn = authService.isLoggedIn();
    setIsAuthenticated(isLoggedIn);

    // Verificar acesso
    if (isLoggedIn) {
      const currentUser = authService.getCurrentUser();
      
      let accessGranted = true;
      
      // Verificar papéis necessários
      if (requiredRoles && requiredRoles.length > 0 && currentUser) {
        accessGranted = accessGranted && requiredRoles.includes(currentUser.role);
      }
      
      // Verificar permissão necessária
      if (requiredPermission && accessGranted) {
        accessGranted = accessGranted && authService.hasPermission(requiredPermission);
      }
      
      setHasAccess(accessGranted);
    } else {
      setHasAccess(false);
    }
    
    // Renovar sessão em cada navegação para evitar timeout
    if (isLoggedIn) {
      authService.renewSession();
    }
  }, [location, requiredRoles, requiredPermission]);

  // Estado inicial de carregamento
  if (isAuthenticated === null || hasAccess === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Se estiver autenticado mas não tiver acesso, redirecionar para uma página de acesso negado
  if (isAuthenticated && !hasAccess) {
    return <Navigate to="/acesso-negado" replace />;
  }

  // Se estiver autenticado e tiver acesso, renderizar o conteúdo protegido
  return <>{children}</>;
} 