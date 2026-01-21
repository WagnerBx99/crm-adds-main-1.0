import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  Filter, 
  PlusCircle, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Tag,
  Zap,
  ChevronRight,
  MoreVertical,
  SortAsc,
  Archive,
  Settings2 as Settings,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ModernKanbanCard from './ModernKanbanCard';
import { Order, Status, Priority, Label } from '@/types';
import { cn } from '@/lib/utils';
import { labelColors, statusColors, statusNames } from '@/lib/data';
import { Draggable } from '@hello-pangea/dnd';

interface ModernKanbanColumnProps {
  title: string;
  orders: Order[];
  status: Status;
  onUpdateStatus: (orderId: string, newStatus: Status) => void;
  onUpdateOrder?: (orderId: string, updatedData: Partial<Order>) => void;
  columnId: Status;
  onAddOrder: () => void;
  activeFilterLabel?: Label;
  isLoading?: boolean;
  isDragOver?: boolean;
  activeId?: string | null;
  placeholder?: React.ReactNode;
  droppableRef?: React.Ref<HTMLDivElement>;
  droppableProps?: any;
}

const priorityColors = {
  'high': 'text-red-600 bg-red-50',
  'medium': 'text-amber-600 bg-amber-50',
  'low': 'text-green-600 bg-green-50'
} as const;

// Componente para indicador de drop zone preciso
const DropZoneIndicator = ({ isVisible, isTop = false }: { isVisible: boolean; isTop?: boolean }) => (
  <div className={cn(
    "h-1 mx-2 rounded-full transition-all duration-200 ease-out",
    "bg-blue-500",
    isVisible ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
    isTop && "mb-1",
    !isTop && "mt-1"
  )} />
);

// Componente wrapper para card com drop zones
interface DraggableCardWrapperProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: Status) => void;
  onUpdateOrder?: (orderId: string, updatedData: Partial<Order>) => void;
  activeFilterLabel?: Label;
  index: number;
  isActive?: boolean;
  isDragOver?: boolean;
  showDropZoneAbove?: boolean;
  showDropZoneBelow?: boolean;
}

function DraggableCardWrapper({ 
  order, 
  onUpdateStatus, 
  onUpdateOrder, 
  activeFilterLabel, 
  index, 
  isActive,
  isDragOver,
  showDropZoneAbove,
  showDropZoneBelow
}: DraggableCardWrapperProps) {
  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "relative kanban-card mb-2",
            snapshot.isDragging && "opacity-50 shadow-lg",
            "select-none touch-none",
            "cursor-grab active:cursor-grabbing"
          )}
          data-card-index={index}
        >
          <ModernKanbanCard
            order={order}
            onUpdateStatus={onUpdateStatus}
            onUpdateOrder={onUpdateOrder}
            activeFilterLabel={activeFilterLabel}
          />
        </div>
      )}
    </Draggable>
  );
}

export default function ModernKanbanColumn({ 
  title, 
  orders, 
  status, 
  onUpdateStatus,
  onUpdateOrder,
  columnId,
  onAddOrder,
  activeFilterLabel,
  isLoading = false,
  isDragOver,
  activeId,
  placeholder,
  droppableRef,
  droppableProps
}: ModernKanbanColumnProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'customer'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [manualOrderActive, setManualOrderActive] = useState(false);
  
  // Estados para controle preciso das drop zones
  const [hoveredDropZone, setHoveredDropZone] = useState<{
    cardIndex: number;
    position: 'above' | 'below';
  } | null>(null);
  
  // Ref para container dos cards
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Reset da ordenação manual quando não há drag ativo
  useEffect(() => {
    if (!activeId && manualOrderActive) {
      console.log('🔄 Agendando reset da ordenação manual em 3s');
      const resetTimer = setTimeout(() => {
        console.log('🔄 Resetando ordenação manual automaticamente');
        setManualOrderActive(false);
      }, 3000); // 3 segundos para estabilizar
      
      return () => clearTimeout(resetTimer);
    }
  }, [activeId, manualOrderActive]);

  // Limpar hover quando não há drag ativo
  useEffect(() => {
    if (!activeId) {
      setHoveredDropZone(null);
    }
  }, [activeId]);

  // Detectar posição do mouse para mostrar drop zones precisas
  useEffect(() => {
    if (!activeId || !isDragOver || !cardsContainerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = cardsContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      
      // Calcular posição baseada nos cards
      const cardElements = container.querySelectorAll('[data-card-index]');
      let closestDropZone: { cardIndex: number; position: 'above' | 'below' } | null = null;
      let minDistance = Infinity;

      cardElements.forEach((element, index) => {
        const cardRect = element.getBoundingClientRect();
        const cardY = cardRect.top - rect.top;
        const cardHeight = cardRect.height;
        const cardCenter = cardY + cardHeight / 2;

        // Distância para posição acima
        const distanceAbove = Math.abs(mouseY - cardY);
        if (distanceAbove < minDistance && mouseY < cardCenter) {
          minDistance = distanceAbove;
          closestDropZone = { cardIndex: index, position: 'above' };
        }

        // Distância para posição abaixo
        const distanceBelow = Math.abs(mouseY - (cardY + cardHeight));
        if (distanceBelow < minDistance && mouseY > cardCenter) {
          minDistance = distanceBelow;
          closestDropZone = { cardIndex: index, position: 'below' };
        }
      });

      setHoveredDropZone(closestDropZone);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [activeId, isDragOver]);

  // Filtrar pedidos por etiqueta ativa se houver
  const filteredOrders = useMemo(() => {
    if (!activeFilterLabel) return orders;
    return orders.filter(order => 
      order.labels?.includes(activeFilterLabel)
    );
  }, [orders, activeFilterLabel]);

  // Ordenar pedidos - CORREÇÃO: Lógica simplificada para evitar conflitos
  const sortedOrders = useMemo(() => {
    // CORREÇÃO: Sempre preservar a ordem durante qualquer operação de drag
    // Isso evita que a lista "pule" durante o arrasto
    if (activeId || manualOrderActive) {
      return [...filteredOrders];
    }
    
    const ordersToSort = [...filteredOrders];
    return ordersToSort.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'customer':
          comparison = (a.customer?.name || '').localeCompare(b.customer?.name || '');
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredOrders, sortBy, sortDirection, activeId, columnId, manualOrderActive]);

  // Calcular estatísticas da coluna
  const columnStats = useMemo(() => {
    const total = orders.length;
    const filtered = filteredOrders.length;
    const highPriority = orders.filter(order => order.priority === 'high').length;
    const overdue = orders.filter(order => 
      order.dueDate && new Date(order.dueDate) < new Date()
    ).length;
    
    return { total, filtered, highPriority, overdue };
  }, [orders, filteredOrders]);

  const hasFilteredLabel = activeFilterLabel && filteredOrders.length > 0;

  const handleSort = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy, sortDirection]);

  if (isLoading) {
    return (
      <div className="h-full">
        <Card className="h-full bg-surface-0/60 backdrop-blur-sm border-accent-primary/20 w-full">
          <div className="p-4 border-b border-accent-primary/20">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-3 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className={cn(
      "h-full bg-surface-0/60 backdrop-blur-sm border-accent-primary/20 w-full",
      "shadow-sm transition-all duration-200",
      // Removido: efeitos de destaque quando isDragOver
    )}>
      {/* Header da coluna ultra-compacto */}
      <div className={cn(
        "px-4 py-3 border-b border-accent-primary/20 bg-surface-1/40 backdrop-blur-sm",
        "flex items-center gap-3 min-h-[56px]",
        // Removido: efeitos quando isDragOver
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-200", 
              statusColors[status] || "bg-text-low",
              // Removido: efeitos quando isDragOver
            )} />
            <h3 className={cn(
              "font-semibold text-text-high text-sm transition-colors duration-200",
              // Removido: efeitos quando isDragOver
            )}>
              {title}
            </h3>
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-1 text-xs px-1.5 py-0 h-4 bg-surface-1 text-text-low transition-all duration-200",
                // Removido: efeitos quando isDragOver
              )}
            >
              {orders.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={onAddOrder}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 text-text-low hover:text-accent-primary hover:bg-accent-primary/10 transition-all duration-200",
                // Removido: efeitos quando isDragOver
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-text-low hover:text-text-high"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="text-xs">
                  <Settings className="h-3 w-3 mr-2" />
                  Configurar coluna
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <SortAsc className="h-3 w-3 mr-2" />
                  Ordenar pedidos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-text-low">
                  <Archive className="h-3 w-3 mr-2" />
                  Arquivar concluídos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Lista de cards com drop zones precisas - SEM SCROLL */}
      <div 
        ref={droppableRef}
        {...droppableProps}
        className="flex-1 p-3 relative min-h-[150px] flex flex-col"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-surface-1" />
            ))}
          </div>
        ) : sortedOrders.length === 0 ? (
          <>
            <div className="h-full flex flex-col items-center justify-center text-text-low py-8">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum pedido</p>
              <p className="text-xs">Clique em + para adicionar</p>
            </div>
            {placeholder}
          </>
        ) : (
          <>
            {sortedOrders.map((order, index) => (
              <DraggableCardWrapper
                key={order.id}
                order={order}
                onUpdateStatus={onUpdateStatus}
                onUpdateOrder={onUpdateOrder}
                activeFilterLabel={activeFilterLabel}
                index={index}
                isActive={activeId === order.id}
                isDragOver={isDragOver}
                showDropZoneAbove={
                  isDragOver && 
                  hoveredDropZone?.cardIndex === index && 
                  hoveredDropZone?.position === 'above' &&
                  activeId !== order.id
                }
                showDropZoneBelow={
                  isDragOver && 
                  hoveredDropZone?.cardIndex === index && 
                  hoveredDropZone?.position === 'below' &&
                  activeId !== order.id
                }
              />
            ))}
            {placeholder}
          </>
        )}
      </div>

      {/* Footer com informações resumidas */}
      {orders.length > 0 && (
        <div className={cn(
          "p-2 border-t border-accent-primary/10 bg-surface-1/30 transition-colors duration-200",
          // Removido: efeitos quando isDragOver
        )}>
          <div className="flex items-center justify-between text-xs text-text-low">
            <span>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
            {filteredOrders.length !== orders.length && (
              <span className="text-accent-primary">
                {filteredOrders.length} visíveis
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
} 