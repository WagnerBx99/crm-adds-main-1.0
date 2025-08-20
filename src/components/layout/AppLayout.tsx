import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Começa collapsed
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Estado de expansão (hover/focus)
  const [isMobile, setIsMobile] = useState(false);

  // Detecção móvel e estados iniciais
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        // Em mobile, sidebar sempre começa fechado
        setSidebarCollapsed(true);
        setSidebarExpanded(false);
      } else {
        // Em desktop, recuperar preferência ou manter collapsed por padrão
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
          setSidebarCollapsed(JSON.parse(savedState));
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salvar estado do sidebar
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isMobile]);

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const handleSidebarExpansion = (expanded: boolean) => {
    setSidebarExpanded(expanded);
  };

  const handleMobileMenuToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleOverlayClick = () => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  // Calcular margem dinâmica baseada no estado real do sidebar
  const getMarginClass = () => {
    if (isMobile) {
      return 'ml-0'; // Mobile sempre sem margem (overlay mode)
    }
    
    // Desktop: margem baseada no estado atual (collapsed + expanded por hover/focus)
    const isCurrentlyExpanded = !sidebarCollapsed || sidebarExpanded;
    return isCurrentlyExpanded ? 'ml-60' : 'ml-15'; // 240px expandido, 60px collapsed
  };

  return (
    <div className="h-screen w-full bg-surface-0 relative overflow-hidden">
      {/* Sidebar Premium com callback de expansão */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
        onExpansionChange={handleSidebarExpansion}
      />
      
      {/* Overlay móvel com animação suave */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-all duration-300 ease-out animate-in fade-in-0"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      
      {/* Conteúdo principal com margem dinâmica e responsiva */}
      <div 
        className={`flex flex-col h-screen transition-all duration-300 ease-in-out ${getMarginClass()}`}
      >
        {/* Header responsivo */}
        <Header 
          onToggleSidebar={handleMobileMenuToggle}
          isMobile={isMobile}
          sidebarExpanded={!sidebarCollapsed || sidebarExpanded}
        />
        
        {/* Área de conteúdo principal */}
        <main className="flex-1 overflow-y-auto bg-surface-0 relative">
          {/* Background pattern sutil */}
          <div className="absolute inset-0 bg-grid-slate-100/25 bg-[size:32px_32px] opacity-40 pointer-events-none" />
          
          {/* Conteúdo com padding responsivo */}
          <div className="relative z-10 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
