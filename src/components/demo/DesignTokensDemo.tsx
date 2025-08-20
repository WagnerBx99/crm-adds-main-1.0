import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export const DesignTokensDemo: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="p-8 space-y-8 bg-surface-0 text-text-high min-h-screen">
      {/* Header com toggle de tema */}
      <div className="flex items-center justify-between border-b border-accent-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-high">Design Tokens Demo</h1>
          <p className="text-text-low mt-1">
            Sistema de design baseado em tokens semânticos - Tema atual: {theme}
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Seção de Cores de Superfície */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-high">Cores de Superfície</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-surface-0 border border-accent-primary/20 rounded-lg">
            <h3 className="text-lg font-medium text-text-high mb-2">Surface 0 (Principal)</h3>
            <p className="text-text-low">Fundo principal da aplicação</p>
          </div>
          <div className="p-6 bg-surface-1 border border-accent-primary/20 rounded-lg">
            <h3 className="text-lg font-medium text-text-high mb-2">Surface 1 (Secundária)</h3>
            <p className="text-text-low">Fundo para cards e elementos elevados</p>
          </div>
        </div>
      </section>

      {/* Seção de Tipografia */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-high">Tipografia</h2>
        <div className="space-y-3">
          <p className="text-text-high text-lg">
            Texto de alto contraste - usado para títulos e conteúdo principal
          </p>
          <p className="text-text-low">
            Texto de baixo contraste - usado para descrições e metadados
          </p>
        </div>
      </section>

      {/* Seção de Botões */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-high">Componentes de Botão</h2>
        
        {/* Variantes Primárias */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Variantes de Ação</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="tertiary">Terciário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Variantes Semânticas */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Variantes Semânticas</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="success">Sucesso</Button>
            <Button variant="warning">Aviso</Button>
            <Button variant="destructive">Erro</Button>
          </div>
        </div>

        {/* Estados */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Estados</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Normal</Button>
            <Button variant="default" disabled>Desabilitado</Button>
          </div>
        </div>

        {/* Tamanhos */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Tamanhos</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default" size="sm">Pequeno</Button>
            <Button variant="default" size="default">Padrão</Button>
            <Button variant="default" size="lg">Grande</Button>
            <Button variant="default" size="icon">🎨</Button>
          </div>
        </div>
      </section>

      {/* Seção de Paleta de Cores */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-high">Paleta de Cores</h2>
        
        {/* Cores de Accent */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Cores de Destaque</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-accent-primary rounded-lg border border-accent-primary/20"></div>
              <p className="text-sm text-text-low">Accent Primary - #21ADD6</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent-secondary rounded-lg border border-accent-secondary/20"></div>
              <p className="text-sm text-text-low">Accent Secondary - #FF7B1F</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent-tertiary rounded-lg border border-accent-tertiary/20"></div>
              <p className="text-sm text-text-low">Accent Tertiary - #6D28D9</p>
            </div>
          </div>
        </div>

        {/* Cores Semânticas */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-text-high">Cores Semânticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-semantic-success rounded-lg border border-semantic-success/20"></div>
              <p className="text-sm text-text-low">Sucesso - #39FF14</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-semantic-warning rounded-lg border border-semantic-warning/20"></div>
              <p className="text-sm text-text-low">Aviso - #FFAA00</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-semantic-error rounded-lg border border-semantic-error/20"></div>
              <p className="text-sm text-text-low">Erro - #FF4D4F</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Contraste e Acessibilidade */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-high">Acessibilidade</h2>
        <div className="p-6 bg-surface-1 rounded-lg border border-accent-primary/20">
          <h3 className="text-lg font-medium text-text-high mb-3">Conformidade WCAG 2.2 AA</h3>
          <div className="space-y-2">
            <p className="text-text-low">
              ✅ Contraste mínimo de 4.5:1 para texto normal
            </p>
            <p className="text-text-low">
              ✅ Contraste mínimo de 3:1 para ícones e elementos gráficos
            </p>
            <p className="text-text-low">
              ✅ Suporte a preferências do sistema (prefers-color-scheme)
            </p>
            <p className="text-text-low">
              ✅ Suporte a movimento reduzido (prefers-reduced-motion)
            </p>
            <p className="text-text-low">
              ✅ Transições de tema otimizadas (&lt; 50ms)
            </p>
          </div>
        </div>
      </section>

      {/* Footer com informações técnicas */}
      <footer className="border-t border-accent-primary/20 pt-4">
        <p className="text-text-low text-sm">
          Design System v1.0 • Baseado em CSS Custom Properties • Compatível com Tailwind CSS 3.x
        </p>
      </footer>
    </div>
  );
}; 