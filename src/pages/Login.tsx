import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Shield } from 'lucide-react';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export default function Login() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-accent-primary rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-10 w-10 text-surface-0" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-text-high">
          ADDS Brasil
        </h2>
        <p className="mt-2 text-center text-sm text-text-low">
          Sistema de Gerenciamento de Pedidos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-1 py-8 px-4 shadow-lg border border-accent-primary/20 sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-center mb-2 text-text-high">
              Entre em sua conta
            </h3>
            <p className="text-sm text-center text-text-low">
              Insira suas credenciais abaixo para acessar o sistema
            </p>
          </div>
          
          <LoginForm />
        </div>
        
        <div className="mt-6 text-center text-xs text-text-low">
          <p>© {new Date().getFullYear()} ADDS Brasil. Todos os direitos reservados.</p>
          <p className="mt-1">Protegido por medidas avançadas de segurança.</p>
        </div>
      </div>
    </div>
  );
} 