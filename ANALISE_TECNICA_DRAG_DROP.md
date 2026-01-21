# Análise Técnica - Bug do Drag-and-Drop

## Problemas Identificados

Após análise detalhada do código, identifiquei os seguintes problemas:

### 1. **Condição de Corrida no `handleDragEnd`**

**Arquivo:** `ModernKanbanBoard.tsx` (linha 803)

```typescript
// PROBLEMA: Verificação de isDragging APÓS já ter resetado os estados
if (!isDragging) {
  return;
}
```

O código reseta `setIsDragging(false)` na linha 799, mas depois verifica `if (!isDragging)` na linha 803. Isso causa uma condição de corrida onde o estado pode não ter sido atualizado ainda.

### 2. **setTimeout no Dispatch**

**Arquivo:** `ModernKanbanBoard.tsx` (linhas 857-865, 898-904)

```typescript
// PROBLEMA: setTimeout pode causar dessincronização
setTimeout(() => {
  dispatch({
    type: 'REORDER_ORDERS_IN_COLUMN',
    payload: { ... }
  });
}, 0);
```

O uso de `setTimeout(..., 0)` foi adicionado para "esperar o Pangea DnD finalizar", mas isso pode causar problemas de sincronização visual onde o card parece "voltar" antes de ir para a posição correta.

### 3. **Estrutura do Droppable**

**Arquivo:** `ModernKanbanColumn.tsx` (linhas 395-461)

O `droppableRef` e `droppableProps` são passados para um div wrapper, mas a estrutura pode estar causando conflitos com o scroll parent.

### 4. **Estado `manualOrderActive` Interferindo**

**Arquivo:** `ModernKanbanColumn.tsx` (linhas 241-252)

```typescript
// Durante drag, preserva ordem mas pode causar conflitos
if (activeId) {
  return ordersToSort;
}
if (manualOrderActive) {
  return ordersToSort;
}
```

## Correções Propostas

### Correção 1: Remover condição de corrida

Mover a verificação de `isDragging` para antes do cleanup:

```typescript
const handleDragEnd = useCallback((result: DropResult) => {
  // Verificar ANTES de fazer cleanup
  if (!isDragging) {
    return;
  }
  
  // Agora fazer cleanup
  setActiveId(null);
  // ... resto do cleanup
}, [...]);
```

### Correção 2: Remover setTimeout do dispatch

O dispatch deve ser síncrono para evitar "flicker" visual:

```typescript
// ANTES (com setTimeout)
setTimeout(() => {
  dispatch({ type: 'REORDER_ORDERS_IN_COLUMN', ... });
}, 0);

// DEPOIS (síncrono)
dispatch({ type: 'REORDER_ORDERS_IN_COLUMN', ... });
```

### Correção 3: Simplificar estrutura do Droppable

Garantir que o Droppable tenha uma estrutura mais simples sem divs intermediários desnecessários.

### Correção 4: Melhorar gestão do estado de ordenação

Usar uma flag mais robusta para controlar quando a ordenação manual está ativa.
