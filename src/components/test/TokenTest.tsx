import React from 'react';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export const TokenTest: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="p-8 space-y-6 bg-surface-0 text-text-high min-h-screen">
      <div className="border-2 border-accent-primary rounded-lg p-4">
        <h1 className="text-2xl font-bold text-text-high mb-4">🧪 Teste de Design Tokens</h1>
        <p className="text-text-low mb-4">Tema atual: <strong>{theme}</strong></p>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Surface Colors */}
        <div className="bg-surface-1 p-4 rounded-lg border border-accent-primary/20">
          <h3 className="text-lg font-semibold text-text-high mb-2">Surface 1</h3>
          <p className="text-text-low">bg-surface-1</p>
        </div>

        {/* Primary Accent */}
        <div className="bg-accent-primary p-4 rounded-lg text-surface-0">
          <h3 className="text-lg font-semibold mb-2">Accent Primary</h3>
          <p>bg-accent-primary</p>
        </div>

        {/* Secondary Accent */}
        <div className="bg-accent-secondary p-4 rounded-lg text-surface-0">
          <h3 className="text-lg font-semibold mb-2">Accent Secondary</h3>
          <p>bg-accent-secondary</p>
        </div>

        {/* Success */}
        <div className="bg-semantic-success p-4 rounded-lg text-surface-0">
          <h3 className="text-lg font-semibold mb-2">Success</h3>
          <p>bg-semantic-success</p>
        </div>

        {/* Warning */}
        <div className="bg-semantic-warning p-4 rounded-lg text-surface-0">
          <h3 className="text-lg font-semibold mb-2">Warning</h3>
          <p>bg-semantic-warning</p>
        </div>

        {/* Error */}
        <div className="bg-semantic-error p-4 rounded-lg text-surface-0">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>bg-semantic-error</p>
        </div>
      </div>

      <div className="bg-surface-1 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-text-high mb-2">Typography</h3>
        <p className="text-text-high">Texto de alto contraste (text-text-high)</p>
        <p className="text-text-low">Texto de baixo contraste (text-text-low)</p>
      </div>

      <div className="bg-surface-1 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-text-high mb-4">Hover Effects</h3>
        <div className="flex gap-3">
          <button className="bg-accent-primary hover:bg-accent-primary-hover px-4 py-2 rounded text-surface-0 transition-colors">
            Primary Hover
          </button>
          <button className="bg-accent-secondary hover:bg-accent-secondary-hover px-4 py-2 rounded text-surface-0 transition-colors">
            Secondary Hover
          </button>
        </div>
      </div>
    </div>
  );
}; 