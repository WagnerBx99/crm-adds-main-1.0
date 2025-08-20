import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Palette,
  Wrench,
  Calendar,
  ExternalLink,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  FileText,
  HelpCircle,
  Menu,
  X,
  Home,
  Package,
  UserCheck,
  PaintBucket,
  Cog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/theme/ThemeProvider';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onExpansionChange?: (expanded: boolean) => void;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  active?: boolean;
}

// Navegação principal - páginas reais do sistema
const navigationItems: NavItem[] = [
  { id: 'kanban', label: 'Pipeline Kanban', icon: Kanban, href: '/' },
  { id: 'personalizacao', label: 'Personalização', icon: PaintBucket, href: '/personalization' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contatos', label: 'Contatos', icon: UserCheck, href: '/contacts' },
  { id: 'tiny', label: 'Integração Tiny', icon: ExternalLink, href: '/tiny' }
];

// Itens do rodapé
const bottomItems: NavItem[] = [
  { id: 'configuracoes', label: 'Configurações', icon: Cog, href: '/settings' }
];

const SidebarLink = ({ to, icon, label, collapsed, active }: SidebarLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center py-2.5 px-3 my-1 rounded-md transition-all duration-200 group relative',
        active
          ? 'bg-accent-primary/10 text-accent-primary font-medium'
          : 'text-text-low hover:bg-accent-primary/5 hover:text-text-high'
      )}
    >
      <span className={cn(
        "flex items-center justify-center w-5 h-5",
        active ? "text-accent-primary" : "text-text-low"
      )}>{icon}</span>
      {!collapsed && (
        <span className="ml-3 transition-opacity duration-200">{label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full rounded-md px-2 py-1 ml-2 bg-surface-0 text-xs text-text-high shadow-sm border border-accent-primary/20 invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  );
};

export default function Sidebar({ collapsed, onToggleCollapse, onExpansionChange }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('kanban');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const location = useLocation();
  const { theme } = useTheme();

  // Detectar item ativo baseado na rota atual
  useEffect(() => {
    const currentPath = location.pathname;
    const activeNavItem = navigationItems.find(item => item.href === currentPath) ||
                         bottomItems.find(item => item.href === currentPath);
    
    if (activeNavItem) {
      setActiveItem(activeNavItem.id);
    }
  }, [location.pathname]);

  // Comunicar mudanças de expansão para o AppLayout
  useEffect(() => {
    if (onExpansionChange) {
      onExpansionChange(isExpanded);
    }
  }, [isExpanded, onExpansionChange]);

  // Detecção de telas móveis e persistência
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!mobile) {
        // Em desktop, recuperar preferência salva
        const savedState = localStorage.getItem('sidebar-expanded');
        if (savedState !== null) {
          setIsExpanded(JSON.parse(savedState));
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salvar preferência no localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, isMobile]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isExpanded || !collapsed)) {
        if (isMobile) {
          onToggleCollapse(true);
        } else {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, collapsed, isMobile, onToggleCollapse]);

  // Controle de hover com debounce otimizado
  const handleMouseEnter = () => {
    if (!isMobile && collapsed) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsHovered(true);
      // Pequeno delay para evitar expansões muito rápidas
      setTimeout(() => setIsExpanded(true), 50);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && collapsed) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        setIsExpanded(false);
      }, 150); // Delay um pouco maior para dar tempo de mover o mouse
    }
  };

  // Controle de foco para acessibilidade
  const handleFocus = () => {
    if (!isMobile && collapsed) {
      setIsExpanded(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!isMobile && collapsed) {
      // Verificar se o foco está saindo do sidebar
      const currentTarget = e.currentTarget;
      setTimeout(() => {
        if (!currentTarget.contains(document.activeElement)) {
          setIsExpanded(false);
        }
      }, 0);
    }
  };

  const handleToggle = () => {
    if (isMobile) {
      onToggleCollapse(!collapsed);
    } else {
      const newState = !isExpanded;
      setIsExpanded(newState);
      if (newState) {
        onToggleCollapse(false);
      }
    }
  };

  const shouldExpand = isMobile ? !collapsed : isExpanded;
  const actualWidth = shouldExpand ? 'w-60' : 'w-15';

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          // Posicionamento e dimensões base
          "fixed left-0 top-0 h-full z-40",
          "bg-surface-0/95 backdrop-blur-xl",
          "border-r border-accent-primary/20",
          "shadow-xl shadow-accent-primary/5",
          
          // Largura responsiva e animações
          actualWidth,
          "transition-all duration-300 ease-in-out",
          
          // Estados responsivos
          isMobile && collapsed && "-translate-x-full",
          
          // Efeitos visuais com design tokens
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-surface-1/50 before:to-transparent before:pointer-events-none",
          "after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-accent-primary/20 after:to-transparent"
        )}
        role="navigation"
        aria-label="Menu principal"
      >
        {/* Header com logo e toggle */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-accent-primary/20",
          "bg-gradient-to-r from-surface-1/80 to-surface-0/90"
        )}>
          {shouldExpand && (
            <div className="flex items-center gap-3 min-w-0 animate-in slide-in-from-left-5 duration-300">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg">
                <Home className="w-4 h-4 text-surface-0" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-sm text-text-high truncate">
                  ADDS CRM
                </h2>
                <p className="text-xs text-text-low truncate">
                  Sistema de gestão
                </p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              "hover:bg-accent-primary/10 transition-colors duration-200",
              "focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2",
              shouldExpand ? "ml-auto" : "mx-auto"
            )}
            aria-label={shouldExpand ? "Recolher menu" : "Expandir menu"}
          >
            <Menu className="h-4 w-4 text-text-low" />
          </Button>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-accent-primary/20 scrollbar-track-transparent">
          {navigationItems.map((item) => (
            <Link key={item.id} to={item.href}>
              {shouldExpand ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start relative group h-10",
                    "transition-all duration-200 ease-out",
                    
                    // Estados com design tokens
                    activeItem === item.id ? [
                      "bg-gradient-to-r from-accent-primary/10 to-accent-secondary/5",
                      "text-accent-primary border border-accent-primary/20",
                      "shadow-sm hover:shadow-md"
                    ] : [
                      "text-text-low hover:text-text-high",
                      "hover:bg-accent-primary/5 hover:shadow-sm"
                    ],
                    
                    // Animações de entrada
                    "animate-in slide-in-from-left-3 duration-300",
                    "px-3"
                  )}
                  aria-label={item.label}
                  tabIndex={0}
                >
                  <item.icon className={cn(
                    "h-4 w-4 stroke-2 transition-transform duration-200",
                    activeItem === item.id && "text-accent-primary"
                  )} />
                  
                  <span className="ml-3 font-medium text-sm truncate animate-in slide-in-from-left-2 duration-300 delay-75">
                    {item.label}
                  </span>
                </Button>
              ) : (
                <div className={cn(
                  "w-full h-10 flex items-center justify-center",
                  "transition-all duration-200 ease-out",
                  "text-text-low hover:text-accent-primary",
                  "rounded-md group"
                )}>
                  <item.icon className="h-4 w-4 stroke-2 transition-transform duration-200 group-hover:scale-110" />
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Seção inferior com configurações */}
        <div className="p-3 border-t border-accent-primary/20 bg-gradient-to-r from-surface-1/50 to-surface-0/80 space-y-1">
          {bottomItems.map((item) => (
            <Link key={item.id} to={item.href}>
              {shouldExpand ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start h-10 transition-all duration-200",
                    activeItem === item.id ? [
                      "bg-gradient-to-r from-accent-primary/10 to-accent-secondary/5",
                      "text-accent-primary border border-accent-primary/20"
                    ] : [
                      "text-text-low hover:text-text-high hover:bg-accent-primary/5"
                    ],
                    "px-3"
                  )}
                  aria-label={item.label}
                >
                  <item.icon className={cn(
                    "h-4 w-4 stroke-2",
                    activeItem === item.id && "text-accent-primary"
                  )} />
                  <span className="ml-3 font-medium text-sm truncate animate-in slide-in-from-left-2 duration-300">
                    {item.label}
                  </span>
                </Button>
              ) : (
                <div className={cn(
                  "w-full h-10 flex items-center justify-center",
                  "transition-all duration-200 ease-out",
                  "text-text-low hover:text-accent-primary",
                  "rounded-md group"
                )}>
                  <item.icon className="h-4 w-4 stroke-2 transition-transform duration-200 group-hover:scale-110" />
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Barra de status quando expandido */}
        {shouldExpand && (
          <div className="p-3 border-t border-accent-primary/20 bg-gradient-to-r from-surface-1/30 to-transparent">
            <div className="flex items-center gap-2 animate-in fade-in-50 duration-500 delay-200">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-semantic-success to-accent-secondary animate-pulse" />
              <span className="text-xs text-text-low font-medium">Sistema online</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
