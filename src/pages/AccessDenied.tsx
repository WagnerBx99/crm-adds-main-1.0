import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldOff, Home, LogOut } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export default function AccessDenied() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const { theme } = useTheme();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-semantic-error/10 rounded-full flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-semantic-error" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-text-high">
          Acesso Negado
        </h2>
        <p className="mt-2 text-center text-sm text-text-low">
          Você não tem permissão para acessar esta área do sistema.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-1 py-8 px-4 shadow-lg border border-accent-primary/20 sm:rounded-lg sm:px-10 text-center">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-text-high">
              Perfil de acesso insuficiente
            </h3>
            <p className="text-sm text-text-low mb-4">
              {currentUser ? (
                <>
                  Seu perfil atual <strong>({currentUser.role})</strong> não tem as permissões 
                  necessárias para esta funcionalidade.
                </>
              ) : (
                'É necessário ter permissões específicas para acessar esta funcionalidade.'
              )}
            </p>
            <p className="text-sm text-text-low">
              Entre em contato com um administrador se acredita que deveria ter acesso.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4" />
              Voltar ao início
            </Button>
            
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </Button>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-text-low">
          <p>© {new Date().getFullYear()} ADDS Brasil. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
} 