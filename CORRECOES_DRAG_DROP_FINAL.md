# Correções do Drag-and-Drop - Resumo Final

## Problema Original

O card do Kanban não podia ser solto em outra coluna após ser arrastado. O card "travava" e não era possível nem voltar para a coluna original.

## Causa Raiz Identificada

O problema era causado por **nested scroll containers** (containers de scroll aninhados), que a biblioteca `@hello-pangea/dnd` não suporta.

### Estrutura Problemática (Antes)

```
<main overflow-y="auto">  <!-- Container pai com scroll vertical -->
  <div overflow-x="auto" overflow-y="auto">  <!-- Container do Kanban com scroll horizontal E vertical -->
    <DragDropContext>
      <Droppable>
        <Draggable>...</Draggable>
      </Droppable>
    </DragDropContext>
  </div>
</main>
```

O warning no console era:
> "Droppable: unsupported nested scroll container detected. A Droppable can only have one scroll parent"

## Correções Aplicadas

### 1. Remover overflow-y do container principal (AppLayout.tsx)

```diff
- <main className="flex-1 overflow-y-auto bg-surface-0 relative">
+ <main className="flex-1 overflow-visible bg-surface-0 relative">
```

### 2. Remover overflow-y do container do Kanban (ModernKanbanBoard.tsx)

```diff
- className={cn(
-   "overflow-x-auto overflow-y-visible",
-   "w-full max-w-full min-h-[600px]",
-   isScrolling ? "scroll-smooth" : "scroll-auto"
- )}
- style={{
-   WebkitOverflowScrolling: 'touch',
-   overflowY: 'visible'
- }}
+ className={cn(
+   "overflow-x-auto",
+   "w-full max-w-full min-h-[600px]"
+ )}
+ style={{
+   WebkitOverflowScrolling: 'touch',
+   overflowY: 'visible',
+   scrollBehavior: isScrolling ? 'smooth' : 'auto'
+ }}
```

### 3. Simplificar DraggableCardWrapper (ModernKanbanColumn.tsx)

- Removida div wrapper extra que separava o Draggable do Droppable
- Draggables agora são filhos diretos do Droppable

### 4. Simplificar handleDragEnd (ModernKanbanBoard.tsx)

- Removida dependência de `isDragging` no useCallback
- Lógica simplificada para evitar conflitos de estado

### 5. CSS para z-index durante drag (drag-animations.css)

```css
[data-rfd-draggable-context-id] {
  z-index: 9999 !important;
}

.kanban-board-container,
.kanban-board-container * {
  overflow-y: visible !important;
}
```

## Estrutura Corrigida (Depois)

```
<main overflow="visible">  <!-- Container pai SEM scroll -->
  <div overflow-x="auto" overflow-y="hidden">  <!-- Container do Kanban APENAS com scroll horizontal -->
    <DragDropContext>
      <Droppable>
        <Draggable>...</Draggable>  <!-- Filho direto do Droppable -->
      </Droppable>
    </DragDropContext>
  </div>
</main>
```

## Commits

1. `29a8dc5` - fix: Aplicar correções de drag-and-drop baseadas em análise externa
2. `a82513e` - fix: Remover nested scroll container que bloqueava drag-and-drop
3. `1229981` - fix: Corrigir overflow-y no container do Kanban para resolver drag-and-drop

## Como Testar

```bash
cd crm-adds-main-1.0
git pull origin main
pnpm install
pnpm run dev
```

Acesse http://localhost:5173 e tente arrastar um card de uma coluna para outra.

## Observação

A simulação de eventos de mouse no sandbox pode não funcionar perfeitamente devido a limitações do ambiente. O teste real deve ser feito em um navegador local ou em produção.
