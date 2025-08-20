import { Order, Status } from '@/types';

/**
 * Resultado da reordenação de cards
 */
export interface ReorderResult {
  sourceOrders: Order[];
  destinationOrders?: Order[];
  movedOrder: Order;
}

/**
 * Reordena cards dentro da mesma coluna
 */
export function reorderCardsInSameColumn(
  orders: Order[],
  startIndex: number,
  endIndex: number
): ReorderResult {
  const result = Array.from(orders);
  const [movedOrder] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, movedOrder);

  return {
    sourceOrders: result,
    movedOrder
  };
}

/**
 * Move um card entre colunas diferentes
 */
export function moveCardBetweenColumns(
  sourceOrders: Order[],
  destinationOrders: Order[],
  sourceIndex: number,
  destinationIndex: number,
  newStatus: Status
): ReorderResult {
  const sourceResult = Array.from(sourceOrders);
  const destinationResult = Array.from(destinationOrders);
  
  const [movedOrder] = sourceResult.splice(sourceIndex, 1);
  
  // Atualiza o status do card movido
  const updatedOrder = {
    ...movedOrder,
    status: newStatus,
    updatedAt: new Date()
  };
  
  destinationResult.splice(destinationIndex, 0, updatedOrder);

  return {
    sourceOrders: sourceResult,
    destinationOrders: destinationResult,
    movedOrder: updatedOrder
  };
}

/**
 * Valida se o movimento é possível
 */
export function validateMove(
  sourceColumnId: string,
  destinationColumnId: string,
  sourceIndex: number,
  destinationIndex: number,
  sourceOrders: Order[],
  destinationOrders?: Order[]
): boolean {
  // Movimento na mesma coluna
  if (sourceColumnId === destinationColumnId) {
    return sourceIndex >= 0 && 
           sourceIndex < sourceOrders.length && 
           destinationIndex >= 0 && 
           destinationIndex <= sourceOrders.length &&
           sourceIndex !== destinationIndex;
  }
  
  // Movimento entre colunas
  if (destinationOrders) {
    return sourceIndex >= 0 && 
           sourceIndex < sourceOrders.length && 
           destinationIndex >= 0 && 
           destinationIndex <= destinationOrders.length;
  }
  
  return false;
}

/**
 * Calcula a nova posição otimizada para o card
 */
export function calculateOptimalPosition(
  targetOrders: Order[],
  draggedOrder: Order,
  hoverIndex: number
): number {
  const currentIndex = targetOrders.findIndex(order => order.id === draggedOrder.id);
  
  // Se o card está na mesma lista, ajusta o índice
  if (currentIndex !== -1) {
    return hoverIndex > currentIndex ? hoverIndex - 1 : hoverIndex;
  }
  
  return Math.min(hoverIndex, targetOrders.length);
}

/**
 * Cria um snapshot otimista do estado para rollback
 */
export function createOptimisticSnapshot(orders: Order[]) {
  return {
    timestamp: Date.now(),
    orders: orders.map(order => ({ ...order }))
  };
}

/**
 * Aplica rollback em caso de erro
 */
export function applyRollback(
  snapshot: ReturnType<typeof createOptimisticSnapshot>
): Order[] {
  return snapshot.orders.map(order => ({ ...order }));
} 