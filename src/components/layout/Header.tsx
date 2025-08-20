import React from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { userService } from '@/lib/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  sidebarExpanded?: boolean;
}

export function Header({ onToggleSidebar, isMobile = false, sidebarExpanded = false }: HeaderProps) {
  const currentUser = userService.getCurrentUser();
  const location = useLocation();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para obter o nome da página com base na rota atual
  const getPageName = () => {
    const path = location.pathname;
    
    // Mapeamento de rotas para nomes de páginas
    const routeMap: Record<string, string> = {
      '/': 'Pipeline de Vendas',
      '/dashboard': 'Dashboard',
      '/contacts': 'Contatos',
      '/customers': 'Clientes',
      '/orders': 'Pedidos',
      '/products': 'Produtos',
      '/reports': 'Relatórios',
      '/calendar': 'Calendário',
      '/messages': 'Mensagens',
      '/documents': 'Documentos',
      '/personalization': 'Personalização',
      '/settings': 'Configurações',
      '/help': 'Ajuda & Suporte'
    };
    
    // Retornar o nome da página ou o nome padrão do sistema
    return routeMap[path] || document.title || 'ADDS CRM';
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return null;
    
    const segments = path.split('/').filter(Boolean);
    return segments.map(segment => 
      segment.charAt(0).toUpperCase() + segment.slice(1)
    ).join(' › ');
  };

  return (
    <header className={cn(
      "bg-surface-0/80 backdrop-blur-xl border-b border-accent-primary/20",
      "shadow-sm shadow-accent-primary/5",
      "py-3 px-4 lg:px-6",
      "flex items-center justify-between flex-shrink-0",
      "transition-all duration-300 ease-in-out",
      "relative z-20"
    )}>
      {/* Seção esquerda - Navegação e título */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Botão do menu mobile - apenas visível em telas pequenas */}
        {isMobile && onToggleSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className={cn(
              "h-9 w-9 p-0 rounded-lg lg:hidden",
              "hover:bg-accent-primary/10 transition-colors duration-200",
              "focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2"
            )}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5 text-text-low" />
          </Button>
        )}
        
        {/* Título da página com breadcrumb */}
        <div className="min-w-0 flex-1">
          <h1 className={cn(
            "text-xl lg:text-2xl font-bold text-text-high truncate"
          )}>
          {getPageName()}
        </h1>
          {getBreadcrumb() && (
            <p className="text-sm text-text-low truncate mt-0.5">
              {getBreadcrumb()}
            </p>
          )}
        </div>
      </div>
      
      {/* Seção direita - Notificações e perfil */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Notificações */}
        <div className="relative">
        <NotificationBell />
        </div>
        
        {/* Divisor sutil */}
        <div className="h-6 w-px bg-accent-primary/20 hidden sm:block" />
        
        {/* Menu do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2",
            "rounded-full transition-all duration-200"
          )}>
            <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-accent-primary/10 transition-colors duration-200">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-accent-primary/20 shadow-sm">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback className="bg-accent-primary text-surface-0 text-sm font-semibold">
                  {currentUser?.name ? getInitials(currentUser.name) : 'U'}
                </AvatarFallback>
            </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-text-high truncate max-w-32">
                  {currentUser?.name || 'Usuário'}
                </p>
                <p className="text-xs text-text-low truncate max-w-32">
                  {currentUser?.role === 'MASTER' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className={cn(
              "w-64 p-2 border-0 shadow-xl bg-surface-0/95 backdrop-blur-xl",
              "rounded-2xl mt-2"
            )}
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-accent-primary/20">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                  <AvatarFallback className="bg-accent-primary text-surface-0">
                    {currentUser?.name ? getInitials(currentUser.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-high truncate">
                    {currentUser?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-text-low truncate">
                    {currentUser?.email || 'usuario@exemplo.com'}
                  </p>
                  <p className="text-xs text-text-low mt-0.5">
                    {currentUser?.role === 'MASTER' ? 'Administrador do Sistema' : 'Usuário Padrão'}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="my-2 bg-accent-primary/20" />
            
            <DropdownMenuItem asChild>
              <Link 
                to="/settings?category=profile" 
                className={cn(
                  "flex items-center cursor-pointer p-3 rounded-xl",
                  "hover:bg-accent-primary/10 transition-colors duration-200"
                )}
              >
                <User className="mr-3 h-4 w-4 text-text-high" />
                <span className="font-medium">Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link 
                to="/settings" 
                className={cn(
                  "flex items-center cursor-pointer p-3 rounded-xl",
                  "hover:bg-accent-primary/10 transition-colors duration-200"
                )}
              >
                <Settings className="mr-3 h-4 w-4 text-text-high" />
                <span className="font-medium">Configurações</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2 bg-accent-primary/20" />
            
            <DropdownMenuItem className={cn(
              "flex items-center cursor-pointer p-3 rounded-xl",
              "text-red-600 hover:text-red-700 hover:bg-red-50/80",
              "transition-colors duration-200"
            )}>
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 