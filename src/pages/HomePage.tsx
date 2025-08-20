import React from 'react';
import ModernKanbanBoard from '../components/kanban/ModernKanbanBoard';

export default function HomePage() {
  return (
    <div className="w-full h-full">
      {/* Exemplo de conteúdo responsivo */}
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Sistema ADDS CRM - Layout Responsivo
          </h1>
          <p className="text-slate-600">
            Este conteúdo se adapta automaticamente ao estado do sidebar (expandido/colapsado).
          </p>
          
          {/* Demonstração visual do espaço disponível */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
            <h3 className="font-semibold text-blue-900 mb-2">
              🎯 Características do Layout Responsivo:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Desktop:</strong> Sidebar de 60px (colapsado) ou 240px (expandido)</li>
              <li>• <strong>Hover/Focus:</strong> Expansão automática sem perder espaço</li>
              <li>• <strong>Mobile:</strong> Sidebar em overlay (0px de margem)</li>
              <li>• <strong>Transições:</strong> Animações suaves de 300ms</li>
              <li>• <strong>Persistência:</strong> Lembra a preferência do usuário</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Kanban Board que se adapta ao espaço */}
      <ModernKanbanBoard />
    </div>
  );
} 