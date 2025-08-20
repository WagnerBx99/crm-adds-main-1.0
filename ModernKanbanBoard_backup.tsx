import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Plus, 
  Sliders, 
  List, 
  Grid, 
  ChevronDown, 
  X, 
  Clock, 
  Tag, 
  Check, 
  Eye, 
  ChevronRight,
  ChevronLeft,
  Zap,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Settings2,
  User,
  Sparkles,
  Activity,
  BarChart3,
  Target,
  Workflow,
  ArrowRight,
  Filter as FilterIcon,
  SortAsc,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import ModernKanbanColumn from './ModernKanbanColumn';
import NewOrderDialog from './NewOrderDialog';
import OrderDetailsDialog from './OrderDetailsDialog';
import { Order, Status, KanbanColumn as KanbanColumnType, Priority, Label } from '@/types';
import { 
  labelColors,
  labelNames,
  statusColors,
  statusNames
} from '@/lib/data';
import { useKanban } from '@/contexts/KanbanContext';
import { useViewport, useColumnWidth } from '@/hooks/useViewport';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  rectIntersection,
  DragOverEvent,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Importar estilos CSS personalizados
import '../../styles/kanban.css';

// 🎨 Configuração de Design System Avançado
const designSystem = {
  typography: {
    hero: "text-4xl md:text-5xl lg:text-6xl font-black tracking-tight",
    title: "text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight",
    heading: "text-xl md:text-2xl font-semibold tracking-tight",
    subheading: "text-lg md:text-xl font-medium",
    body: "text-base font-normal",
    caption: "text-sm font-medium",
    micro: "text-xs font-semibold uppercase tracking-wider"
  },
  spacing: {
    section: "space-y-8 md:space-y-12 lg:space-y-16",
    card: "p-6 md:p-8 lg:p-10",
    compact: "p-4 md:p-6",
    minimal: "p-3 md:p-4"
  },
  gradients: {
    primary: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",
    secondary: "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
    accent: "bg-gradient-to-r from-emerald-500 to-teal-600",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600",
    danger: "bg-gradient-to-r from-red-500 to-rose-600",
    surface: "bg-gradient-to-br from-white via-slate-50 to-gray-100"
  },
  shadows: {
    elegant: "shadow-2xl shadow-blue-500/10",
    floating: "shadow-lg shadow-slate-200/50",
    subtle: "shadow-sm shadow-slate-100",
    glow: "shadow-2xl shadow-blue-400/20"
  },
  animations: {
    smooth: "transition-all duration-300 ease-out",
    bounce: "transition-all duration-200 ease-bounce",
    elastic: "transition-all duration-500 ease-elastic"
  }
};

// 🌈 Configuração de prioridades com design sofisticado
const priorityConfig = {
  'high': { 
    color: 'bg-gradient-to-br from-red-50 to-rose-100 text-red-800 border-red-200/50', 
    label: 'Crítica',
    icon: AlertTriangle,
    gradient: 'from-red-400 to-rose-500',
    dot: 'bg-gradient-to-r from-red-500 to-rose-600',
    glow: 'shadow-red-500/20'
  },
  'normal': { 
    color: 'bg-gradient-to-br from-slate-50 to-gray-100 text-slate-700 border-slate-200/50', 
    label: 'Padrão',
    icon: Check,
    gradient: 'from-slate-400 to-gray-500',
    dot: 'bg-gradient-to-r from-slate-500 to-gray-600',
    glow: 'shadow-slate-500/20'
  },
};

// 📊 Interface para estatísticas avançadas
interface AdvancedStats {
  total: number;
  highPriority: number;
  overdue: number;
  completedToday: number;
  productivity: number;
  avgTimeInPipeline: number;
  completionRate: number;
}

// 🎯 Component CardOverlay redesenhado
const CardOverlay = ({ order }: { order: Order }) => {
  const currentPriority = order.priority || 'normal';
  const priorityStyle = priorityConfig[currentPriority] || priorityConfig['normal'];

  return (
    <Card className={cn(
      "w-80 bg-white/95 backdrop-blur-xl border-0",
      "transform rotate-2 scale-110",
      "ring-4 ring-blue-400/30 ring-offset-4 ring-offset-white/20",
      designSystem.shadows.glow,
      designSystem.animations.elastic,
      "kanban-card-drag-overlay"
    )}>
      <div className={cn(designSystem.spacing.compact, "space-y-3")}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            priorityStyle.dot,
            "shadow-lg"
          )} />
          <span className={cn(
            designSystem.typography.micro,
            "text-slate-600"
          )}>
            {priorityStyle.label}
          </span>
          <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-2 py-1 border-0 shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            Movendo
          </Badge>
        </div>
        
        <h3 className={cn(
          designSystem.typography.heading,
          "text-slate-900 leading-tight line-clamp-2"
        )}>
          {order.title}
        </h3>
        
        <p className={cn(
          designSystem.typography.caption,
          "text-slate-500 line-clamp-1"
        )}>
          {order.customer?.name}
        </p>
      </div>
    </Card>
  );
};

// 📊 Component MetricCard sofisticado
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  color: 'blue' | 'red' | 'amber' | 'green' | 'purple';
  tooltip: string;
}

const MetricCard = ({ icon: Icon, value, label, color, tooltip }: MetricCardProps) => {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      value: 'text-blue-900',
      border: 'border-blue-200/50'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      value: 'text-red-900',
      border: 'border-red-200/50'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      value: 'text-amber-900',
      border: 'border-amber-200/50'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      value: 'text-green-900',
      border: 'border-green-200/50'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      value: 'text-purple-900',
      border: 'border-purple-200/50'
    }
  };

  const config = colorConfig[color];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            "px-4 py-3 border-0 cursor-pointer hover:scale-105",
            config.bg,
            config.border,
            designSystem.shadows.subtle,
            designSystem.animations.smooth,
            "min-w-[100px] flex-shrink-0"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-white/70 backdrop-blur-sm"
              )}>
                <Icon className={cn("h-4 w-4", config.icon)} />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-lg font-bold leading-none",
                  config.value
                )}>
                  {value}
                </span>
                <span className={cn(
                  designSystem.typography.micro,
                  "text-slate-600 leading-none mt-1"
                )}>
                  {label}
                </span>
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function ModernKanbanBoard() {
  const { state, dispatch } = useKanban();
  const { width: viewportWidth } = useViewport();
  const columnWidth = useColumnWidth();
  
  // 🎯 Estados principais com design avançado
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterLabels, setFilterLabels] = useState<Label[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🎪 Dialog states aprimorados
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<Status>('FAZER');
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [newOrderInitialStatus, setNewOrderInitialStatus] = useState<Status | null>(null);

  // 🎨 Estados para drag & drop sofisticados
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeContainer, setActiveContainer] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [placeholderPosition, setPlaceholderPosition] = useState<number | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);
  const [placeholderColumnId, setPlaceholderColumnId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDragEndTime, setLastDragEndTime] = useState<number>(0);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);

  // 🌊 Estados para navegação fluida
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 📏 Constantes de design responsivo
  const CARD_HEIGHT = 160;
  const COLUMN_MIN_WIDTH = 320;
  const COLUMN_GAP = 24;
  const SCROLL_THRESHOLD = 0.7;

  // 🧹 Função para limpar placeholder com animação
  const clearPlaceholder = useCallback(() => {
    setPlaceholderPosition(null);
    setPlaceholderIndex(null);
    setPlaceholderColumnId(null);
  }, []);

  // 🎯 Filtros e ações principais
  const hasActiveFilters = searchQuery !== '' || 
    filterPriority !== 'all' || 
    filterAssignee !== 'all' || 
    filterLabels.length > 0 ||
    filterDateRange !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterAssignee('all');
    setFilterLabels([]);
    setFilterDateRange('all');
    setShowAdvancedFilters(false);
  }, []);

  const openNewOrderDialog = useCallback((initialStatus: Status | null = null) => {
    setNewOrderInitialStatus(initialStatus);
    setIsNewOrderDialogOpen(true);
  }, []);

  // 🎯 Filtros aplicados com performance otimizada
  const filteredColumns = useMemo(() => {
    return state.columns.map(column => ({
      ...column,
      orders: column.orders.filter(order => {
        // Filtro de busca otimizado
        if (debouncedSearch) {
          const searchTerm = debouncedSearch.toLowerCase().trim();
          const searchableFields = [
            order.title,
            order.customer?.name || '',
            order.id,
            order.description || ''
          ].join(' ').toLowerCase();
          
          if (!searchableFields.includes(searchTerm)) return false;
        }

        // Filtros avançados
        if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
        
        if (filterLabels.length > 0) {
          const hasMatchingLabel = filterLabels.some(label => 
            order.labels?.includes(label)
          );
          if (!hasMatchingLabel) return false;
        }

        // Filtro de data com mais opções
        if (filterDateRange !== 'all') {
          const now = new Date();
          const orderDate = new Date(order.createdAt);
          
          switch (filterDateRange) {
            case 'today':
              if (orderDate.toDateString() !== now.toDateString()) return false;
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (orderDate < weekAgo) return false;
              break;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (orderDate < monthAgo) return false;
              break;
            case 'quarter':
              const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              if (orderDate < quarterAgo) return false;
              break;
          }
        }

        return true;
      })
    }));
  }, [state.columns, debouncedSearch, filterPriority, filterLabels, filterDateRange]);

  // 🎯 Estatísticas avançadas calculadas
  const advancedStats = useMemo((): AdvancedStats => {
    const allOrders = state.columns.flatMap(column => column.orders);
    const filteredOrders = filteredColumns.flatMap(column => column.orders);
    const today = new Date().toDateString();
    
    // Cálculos avançados
    const completedOrders = allOrders.filter(order => order.status === 'EXPEDICAO');
    const totalTime = completedOrders.reduce((acc, order) => {
      const created = new Date(order.createdAt);
      const updated = new Date(order.updatedAt || order.createdAt);
      return acc + (updated.getTime() - created.getTime());
    }, 0);
    
    const avgTimeInPipeline = completedOrders.length > 0 
      ? Math.round(totalTime / completedOrders.length / (1000 * 60 * 60 * 1000)) 
      : 0;
    
    const completionRate = allOrders.length > 0 
      ? Math.round((completedOrders.length / allOrders.length) * 100) 
      : 0;
    
    const productivity = completedOrders.filter(order => 
      new Date(order.updatedAt || order.createdAt).toDateString() === today
    ).length;

    return {
      total: filteredOrders.length,
      highPriority: filteredOrders.filter(order => order.priority === 'high').length,
      overdue: filteredOrders.filter(order => 
        order.dueDate && new Date(order.dueDate) < new Date()
      ).length,
      completedToday: productivity,
      productivity: Math.round((productivity / Math.max(allOrders.length * 0.1, 1)) * 100),
      avgTimeInPipeline,
      completionRate
    };
  }, [state.columns, filteredColumns]);

  // 🎯 Número total de colunas para cálculos responsivos
  const totalColumns = filteredColumns.length;

  // 📱 Funções para controle do scroll horizontal responsivo
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const canScrollL = scrollLeft > 0;
    const canScrollR = scrollLeft < scrollWidth - clientWidth - 1;
    const needsScroll = scrollWidth > clientWidth;
    
    setCanScrollLeft(canScrollL);
    setCanScrollRight(canScrollR);
    setShowScrollIndicators(needsScroll);
  }, []);

  // 🔄 Função para scroll suave aprimorado
  const scrollTo = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * SCROLL_THRESHOLD;
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  // 🎯 Função para navegar para uma coluna específica
  const scrollToColumn = useCallback((columnIndex: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const targetScroll = columnIndex * columnWidth;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, [columnWidth]);

  // 🚀 SOLUÇÃO FINAL - Largura inteligente e responsiva
  const containerWidth = useMemo(() => {
    // Cálculo inteligente baseado no número real de colunas
    const baseColumnWidth = columnWidth;
    const gap = isCompactMode ? 16 : 24; // gap-4 ou gap-6
    const padding = isCompactMode ? 32 : 48; // p-4 ou p-6 (ambos os lados)
    
    const totalWidth = (filteredColumns.length * baseColumnWidth) + 
                       ((filteredColumns.length - 1) * gap) + 
                       padding;
    
    // Força scroll apenas se o conteúdo for maior que a viewport
    // Adiciona 200px extra para garantir scroll quando necessário
    const needsScroll = totalWidth > viewportWidth;
    const finalWidth = needsScroll ? totalWidth + 200 : totalWidth;
    
    return {
      minWidth: finalWidth,
      needsScroll,
      totalWidth,
      viewportWidth
    };
  }, [filteredColumns.length, columnWidth, isCompactMode, viewportWidth]);

  console.log('🔍 [SCROLL DEBUG FINAL]', {
    containerWidth,
    filteredColumnsCount: filteredColumns.length,
    viewportWidth,
    columnWidth,
    containerRef: scrollContainerRef.current ? 'PRESENTE' : 'AUSENTE',
    scrollWidth: scrollContainerRef.current?.scrollWidth || 'N/A',
    clientWidth: scrollContainerRef.current?.clientWidth || 'N/A'
  });

  // 🔄 Effect para monitorar mudanças no scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollState();
    
    const timeoutId = setTimeout(() => {
      checkScrollState();
    }, 100);
    
    const handleScroll = () => checkScrollState();
    const handleResize = () => {
      requestAnimationFrame(checkScrollState);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkScrollState);
    });
    
    resizeObserver.observe(container);
    
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [checkScrollState, totalColumns]);

  // 🔄 Effect adicional para forçar scroll após carregamento
  useEffect(() => {
    if (!isInitialLoad) {
      const timer = setTimeout(() => {
        checkScrollState();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, checkScrollState]);

  // 🎹 Navegação por teclado aprimorada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            scrollTo('left');
            break;
          case 'ArrowRight':
            e.preventDefault();
            scrollTo('right');
            break;
          case 'n':
          case 'N':
            e.preventDefault();
            openNewOrderDialog();
            break;
        }
      }
      
      // ESC para limpar filtros
      if (e.key === 'Escape' && hasActiveFilters) {
        clearFilters();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollTo, hasActiveFilters, clearFilters]);

  // Configuração avançada de sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Configuração de medição otimizada para performance
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.WhileDragging,
    },
  };

  // Debounce do search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Effect para refresh
  useEffect(() => {
    if (refreshing) {
      const timer = setTimeout(() => {
        setRefreshing(false);
        toast.success('Dados atualizados!', { duration: 1500 });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [refreshing]);

  // Handlers aprimorados
  const handleUpdateStatus = useCallback((orderId: string, newStatus: Status) => {
    dispatch({
      type: 'UPDATE_ORDER_STATUS',
      payload: { orderId, newStatus }
    });
    
    toast.success(`Status atualizado para ${statusNames[newStatus]}!`, {
      duration: 2000,
    });
  }, [dispatch]);

  const handleUpdateOrder = useCallback((orderId: string, updatedData: Partial<Order>) => {
    dispatch({
      type: 'UPDATE_ORDER',
      payload: { orderId, updatedData }
    });
  }, [dispatch]);

  // Handlers avançados de drag & drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    // Prevenir iniciar se já estiver em drag ou se houve um drag muito recente
    const now = Date.now();
    if (isDragging || (now - lastDragEndTime) < 100) {
      console.log('⚠️ Drag ignorado - muito rápido ou já em andamento');
      return;
    }
    
    setIsDragging(true);
    setActiveId(active.id as string);

    const draggedOrder = filteredColumns
      .flatMap(column => column.orders)
      .find(order => order.id === active.id);
    
    if (draggedOrder) {
      setActiveOrder(draggedOrder);
      const sourceContainer = filteredColumns.find(column => 
        column.orders.some(order => order.id === active.id)
      );
      if (sourceContainer) {
        setActiveContainer(sourceContainer.id);
      }
    }

    // Limpar placeholder no início
    clearPlaceholder();
    
    console.log('🚀 Drag iniciado:', { activeId: active.id, isDragging: true });
  }, [filteredColumns, clearPlaceholder, isDragging, lastDragEndTime]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      clearPlaceholder();
      setOverId(null);
      return;
    }

    setOverId(over.id as string);
    
    const activeId = active.id as string;
    const overId = over.id as string;

    // Usar state.columns para consistência com handleDragEnd
    const activeColumn = state.columns.find(column => 
      column.orders.some(order => order.id === activeId)
    );
    
    const overColumn = state.columns.find(column => column.id === overId) ||
                          state.columns.find(column => 
                            column.orders.some(order => order.id === overId)
                          );

    if (!activeColumn || !overColumn) {
      clearPlaceholder();
      return;
    }

    // Se mudou de coluna, posiciona no final
    if (activeColumn.id !== overColumn.id) {
      setPlaceholderColumnId(overColumn.id);
      setPlaceholderIndex(overColumn.orders.length);
      setPlaceholderPosition(overColumn.orders.length * CARD_HEIGHT);
    } else {
      // Reordenação dentro da mesma coluna
      const overIndex = overColumn.orders.findIndex(order => order.id === overId);
      const activeIndex = overColumn.orders.findIndex(order => order.id === activeId);
      
      if (overIndex !== -1) {
        // Lógica melhorada para posição do placeholder
        let newIndex;
        if (activeIndex < overIndex) {
          // Movendo para baixo - placeholder após o item over
          newIndex = overIndex + 1;
        } else {
          // Movendo para cima - placeholder antes do item over
          newIndex = overIndex;
        }
        
        setPlaceholderColumnId(overColumn.id);
        setPlaceholderIndex(newIndex);
        setPlaceholderPosition(newIndex * CARD_HEIGHT);
      }
    }
  }, [state.columns, clearPlaceholder]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Prevenir múltiplas execuções
    if (!isDragging) {
      console.log('⚠️ Drag end ignorado - não estava em dragging');
      return;
    }
    
    const now = Date.now();
    setLastDragEndTime(now);
    setIsDragging(false);
    
    // Limpar placeholder imediatamente
    clearPlaceholder();
    
    if (!over) {
      console.log('❌ Drag cancelado - sem target válido');
      setActiveId(null);
      setActiveOrder(null);
      setActiveContainer(null);
      setOverId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Não fazer nada se for o mesmo item
    if (activeId === overId) {
      console.log('⚠️ Drag cancelado - mesmo item');
      setActiveId(null);
      setActiveOrder(null);
      setActiveContainer(null);
      setOverId(null);
      return;
    }

    // Buscar colunas usando state.columns em vez de filteredColumns para consistência
    const fromColumn = state.columns.find(column => 
      column.orders.some(order => order.id === activeId)
    );
    
    // Para over, verificar se é uma coluna primeiro, senão procurar o card
    let toColumn = state.columns.find(column => column.id === overId);
    if (!toColumn) {
      toColumn = state.columns.find(column => 
        column.orders.some(order => order.id === overId)
      );
    }
    
    if (!fromColumn || !toColumn) {
      console.log('❌ Erro: Coluna não encontrada', { 
        fromColumn: fromColumn?.id, 
        toColumn: toColumn?.id,
        activeId,
        overId 
      });
      setActiveId(null);
      setActiveOrder(null);
      setActiveContainer(null);
      setOverId(null);
      return;
    }

    console.log('🎯 Drag detectado:', {
      activeId,
      overId,
      fromColumn: fromColumn.id,
      toColumn: toColumn.id,
      isReorder: fromColumn.id === toColumn.id,
      timestamp: now
    });

    if (fromColumn.id === toColumn.id) {
      // Reordenação dentro da mesma coluna
      const oldIndex = fromColumn.orders.findIndex(order => order.id === activeId);
      let newIndex;
      
      if (overId === toColumn.id) {
        // Dropping na coluna (no final)
        newIndex = fromColumn.orders.length - 1;
        console.log('📍 Drop na coluna - movendo para o final');
      } else {
        // Dropping em um card específico
        const overCardIndex = fromColumn.orders.findIndex(order => order.id === overId);
        // Determinar se deve inserir antes ou depois baseado na posição original
        if (oldIndex < overCardIndex) {
          // Movendo para baixo - inserir depois
          newIndex = overCardIndex;
        } else {
          // Movendo para cima - inserir antes
          newIndex = overCardIndex;
        }
        console.log('📍 Drop no card - índice calculado:', { overCardIndex, oldIndex, newIndex });
      }
      
      console.log('🔄 Reordenação detalhada:', { 
        activeId, 
        overId, 
        oldIndex, 
        newIndex, 
        column: fromColumn.id,
        totalCards: fromColumn.orders.length,
        cardTitles: fromColumn.orders.map((o, i) => `${i}: ${o.title}`)
      });
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const originalOrders = [...fromColumn.orders];
        const newOrders = arrayMove(fromColumn.orders, oldIndex, newIndex);
        
        console.log('🔄 ArrayMove detalhado:', {
          movimentacao: `${oldIndex} → ${newIndex}`,
          cardMovido: originalOrders[oldIndex]?.title,
          ordemOriginal: originalOrders.map((o, i) => `${i}: ${o.title}`),
          ordemNova: newOrders.map((o, i) => `${i}: ${o.title}`),
          mudouPosicao: JSON.stringify(originalOrders.map(o => o.id)) !== JSON.stringify(newOrders.map(o => o.id))
        });
        
        // Verificar se realmente houve mudança antes de disparar o dispatch
        const originalOrder = originalOrders.map(o => o.id).join(',');
        const newOrder = newOrders.map(o => o.id).join(',');
        
        if (originalOrder !== newOrder) {
          console.log('✅ Ordem realmente mudou - aplicando dispatch');
          
          dispatch({
            type: 'REORDER_ORDERS_IN_COLUMN',
            payload: { 
              columnId: fromColumn.id, 
              newOrders 
            }
          });
          
          const direction = oldIndex < newIndex ? 'baixo' : 'cima';
          toast.success(`"${originalOrders[oldIndex]?.title}" movido para ${direction}!`, {
            duration: 1500,
          });
          
          console.log('✅ Reordenação aplicada com sucesso');
        } else {
          console.log('⚠️ Ordem não mudou - dispatch cancelado');
        }
      } else {
        console.log('⚠️ Reordenação cancelada - índices inválidos:', { 
          oldIndex, 
          newIndex, 
          sameIndex: oldIndex === newIndex,
          invalidIndex: oldIndex === -1 || newIndex === -1
        });
      }
    } else {
      // Movimento entre colunas diferentes
      console.log('🔄 Movendo entre colunas:', {
        from: fromColumn.id,
        to: toColumn.id,
        cardId: activeId
      });
      
      handleUpdateStatus(activeId, toColumn.id);
      toast.success(`Movido para ${statusNames[toColumn.id]}!`, {
        duration: 2000,
      });
    }

    // Limpar estados
    setActiveId(null);
    setActiveOrder(null);
    setActiveContainer(null);
    setOverId(null);
    
    console.log('🏁 Drag finalizado:', { timestamp: now });
    
    // 🔄 FORÇA RE-RENDER para garantir aplicação da nova ordem
    setTimeout(() => {
      console.log('🔄 Forçando atualização do estado após reordenação');
    }, 100);
  }, [state.columns, clearPlaceholder, handleUpdateStatus, dispatch, isDragging]);

  // Labels ativos
  const activeLabels = useMemo(() => {
    const labels = new Set<Label>();
    filteredColumns.forEach(column => {
      column.orders.forEach(order => {
        if (order.labels && order.labels.length > 0) {
          order.labels.forEach(label => labels.add(label));
        }
      });
    });
    return Array.from(labels);
  }, [filteredColumns]);

  // 🎨 Loading state sofisticado
  if (isInitialLoad) {
    return (
      <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100/50 bg-[size:20px_20px] opacity-40" />
          
          <div className="relative z-10 p-6 lg:p-8">
            {/* Header Skeleton Sofisticado */}
            <div className="mb-8 lg:mb-12">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
              {/* Metrics Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
                  <Card key={i} className={cn(
                    "p-6 border-0",
                    designSystem.shadows.subtle,
                    "bg-gradient-to-br from-white to-slate-50"
                  )}>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </Card>
            ))}
          </div>
              
              {/* Search and Filters Skeleton */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-12 flex-1 max-w-md rounded-xl" />
                <Skeleton className="h-12 w-48 rounded-xl" />
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
        </div>

            {/* Columns Skeleton Aprimorado */}
            <div className="flex gap-6 overflow-x-auto pb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-80 flex-shrink-0">
                  <Card className={cn(
                    "p-6 mb-4 border-0",
                    designSystem.shadows.subtle,
                    "bg-gradient-to-br from-white to-slate-50"
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-5 w-8 ml-auto rounded-full" />
                    </div>
                  </Card>
                  <div className="space-y-4">
                {[1,2,3].map(j => (
                      <Card key={j} className={cn(
                        "p-4 border-0",
                        designSystem.shadows.subtle,
                        "bg-gradient-to-br from-white to-slate-50"
                      )}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-2 w-2 rounded-full" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </Card>
                ))}
              </div>
            </div>
          ))}
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span className={cn(designSystem.typography.caption, "text-slate-600")}>
                  Carregando pipeline de pedidos...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        {/* Background Pattern Sutil */}
        <div className="fixed inset-0 bg-grid-slate-100/30 bg-[size:32px_32px] opacity-60 pointer-events-none" />
        
        {/* Header Revolucionário */}
        <header className="relative z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 shadow-lg shadow-slate-900/5">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8 mb-8">
              {/* Brand & Title */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 min-w-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl",
                    designSystem.gradients.primary,
                    "ring-4 ring-blue-500/20 ring-offset-4 ring-offset-white"
                  )}>
                    <Workflow className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className={cn(
                      designSystem.typography.title,
                      "bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent"
                    )}>
                      Pipeline CRM
                    </h1>
                    <p className={cn(
                      designSystem.typography.caption,
                      "text-slate-500 flex items-center gap-2"
                    )}>
                      <Activity className="w-4 h-4" />
                      Gestão visual de pedidos em tempo real
                    </p>
                  </div>
                </div>

                {/* Advanced Metrics Dashboard */}
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200/50 overflow-x-auto">
                  <MetricCard
                    icon={Target}
                    value={advancedStats.total}
                    label="Total"
                    color="blue"
                    tooltip="Total de pedidos no pipeline"
                  />
                  <MetricCard
                    icon={AlertTriangle}
                    value={advancedStats.highPriority}
                    label="Críticos"
                    color="red"
                    tooltip="Pedidos de alta prioridade"
                  />
                  <MetricCard
                    icon={Clock}
                    value={advancedStats.overdue}
                    label="Atrasados"
                    color="amber"
                    tooltip="Pedidos que passaram do prazo"
                  />
                  <MetricCard
                    icon={TrendingUp}
                    value={advancedStats.completedToday}
                    label="Finalizados"
                    color="green"
                    tooltip="Pedidos concluídos hoje"
                  />
                  <MetricCard
                    icon={BarChart3}
                    value={`${advancedStats.completionRate}%`}
                    label="Taxa"
                    color="purple"
                    tooltip="Taxa de conclusão geral"
                  />
                        </div>
                        </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setRefreshing(true)}
                        disabled={refreshing}
                        className="h-12 px-4 rounded-xl border-slate-200 hover:bg-slate-50 transition-all duration-200"
                      >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Atualizar dados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  onClick={() => openNewOrderDialog()}
                  size="lg"
                  className={cn(
                    "h-12 px-6 text-sm font-semibold rounded-xl shadow-lg",
                    designSystem.gradients.primary,
                    "hover:shadow-xl hover:scale-105",
                    designSystem.animations.smooth,
                    "ring-2 ring-blue-500/20 ring-offset-2 ring-offset-white"
                  )}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Novo Pedido</span>
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Search & Filters Revolution */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
              {/* Advanced Search */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  placeholder="Pesquisar por título, cliente, ID ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "h-12 pl-12 pr-12 text-sm bg-white/80 backdrop-blur-sm",
                    "border-slate-200/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20",
                    "focus:border-blue-300 rounded-xl shadow-sm",
                    "placeholder:text-slate-400 transition-all duration-200"
                  )}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {searchQuery && (
                  <div className="absolute -bottom-6 left-4 text-xs text-slate-500">
                    {advancedStats.total} resultados encontrados
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                      size="lg"
                    className={cn(
                        "h-12 px-6 text-sm gap-3 rounded-xl border-slate-200/50",
                        "bg-white/80 backdrop-blur-sm hover:bg-white",
                        "transition-all duration-200",
                        hasActiveFilters && [
                          "border-blue-300 bg-blue-50/80 text-blue-700",
                          "hover:bg-blue-100/80 shadow-lg shadow-blue-500/10"
                        ]
                      )}
                    >
                      <FilterIcon className="h-4 w-4" />
                      <span className="font-medium">Filtros</span>
                    {hasActiveFilters && (
                        <Badge className={cn(
                          "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
                          "text-[10px] px-2 py-0.5 h-5 border-0 shadow-md"
                        )}>
                        {[
                          filterPriority !== 'all' ? 1 : 0,
                          filterLabels.length,
                          filterDateRange !== 'all' ? 1 : 0,
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-80 p-6 border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl" 
                    align="end"
                  >
                    <DropdownMenuLabel className={cn(
                      designSystem.typography.heading,
                      "text-slate-900 flex items-center gap-3 mb-4"
                    )}>
                      <Sliders className="h-5 w-5 text-blue-600" />
                    Filtros Avançados
                  </DropdownMenuLabel>
                    
                    {/* Priority Filter */}
                    <div className="space-y-3 mb-6">
                      <label className={cn(
                        designSystem.typography.micro,
                        "text-slate-500 block"
                      )}>
                        Nível de Prioridade
                      </label>
                    <DropdownMenuRadioGroup 
                      value={filterPriority} 
                      onValueChange={(value) => setFilterPriority(value as Priority | 'all')}
                    >
                        <DropdownMenuRadioItem 
                          value="all" 
                          className="py-3 px-4 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-300 to-gray-400" />
                            <span className="font-medium">Todas as prioridades</span>
                        </div>
                      </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem 
                          value="high" 
                          className="py-3 px-4 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-red-700 font-semibold">Alta prioridade</span>
                            <Badge className="ml-auto bg-red-100 text-red-700 text-xs">
                              {state.columns.flatMap(c => c.orders).filter(o => o.priority === 'high').length}
                            </Badge>
                        </div>
                      </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem 
                          value="normal" 
                          className="py-3 px-4 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-500" />
                            <span className="text-slate-700 font-medium">Prioridade normal</span>
                            <Badge className="ml-auto bg-slate-100 text-slate-700 text-xs">
                              {state.columns.flatMap(c => c.orders).filter(o => o.priority === 'normal').length}
                            </Badge>
                        </div>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    </div>

                    <DropdownMenuSeparator className="my-4 bg-slate-200" />

                    {/* Date Range Filter */}
                    <div className="space-y-3 mb-6">
                      <label className={cn(
                        designSystem.typography.micro,
                        "text-slate-500 block"
                      )}>
                      Período de Criação
                      </label>
                    <DropdownMenuRadioGroup 
                      value={filterDateRange} 
                      onValueChange={(value) => setFilterDateRange(value as typeof filterDateRange)}
                    >
                        {[
                          { value: 'all', label: 'Todos os períodos', icon: Calendar, color: 'text-slate-500' },
                          { value: 'today', label: 'Criados hoje', icon: Calendar, color: 'text-blue-600' },
                          { value: 'week', label: 'Últimos 7 dias', icon: Calendar, color: 'text-green-600' },
                          { value: 'month', label: 'Últimos 30 dias', icon: Calendar, color: 'text-purple-600' },
                          { value: 'quarter', label: 'Últimos 90 dias', icon: Calendar, color: 'text-orange-600' },
                        ].map(option => (
                          <DropdownMenuRadioItem 
                            key={option.value}
                            value={option.value} 
                            className="py-3 px-4 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <option.icon className={cn("h-4 w-4", option.color)} />
                              <span className="font-medium">{option.label}</span>
                            </div>
                      </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                    </div>

                    {/* Labels Filter if available */}
                  {activeLabels.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-4 bg-slate-200" />
                        <div className="space-y-3 mb-6">
                          <label className={cn(
                            designSystem.typography.micro,
                            "text-slate-500 block"
                          )}>
                          Etiquetas do Sistema
                          </label>
                        {activeLabels.map(label => (
                          <DropdownMenuCheckboxItem
                            key={label}
                            checked={filterLabels.includes(label)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilterLabels([...filterLabels, label]);
                              } else {
                                setFilterLabels(filterLabels.filter(l => l !== label));
                              }
                            }}
                              className="py-3 px-4 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className={cn(
                                    "w-3 h-3 rounded-full border-2",
                                  labelColors[label]
                                )} 
                              />
                              <span className="font-medium">{labelNames[label]}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                        </div>
                    </>
                  )}

                    {/* Clear Filters */}
                  {hasActiveFilters && (
                    <>
                        <DropdownMenuSeparator className="my-4 bg-slate-200" />
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="w-full py-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg"
                        >
                        <X className="h-4 w-4 mr-2" />
                        Limpar todos os filtros
                        </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

                {/* View Mode Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-12 px-4 rounded-xl border-slate-200/50 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200"
                    >
                      {viewMode === 'kanban' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as 'kanban' | 'list')}>
                      <DropdownMenuRadioItem value="kanban" className="py-2">
                        <LayoutGrid className="h-4 w-4 mr-3" />
                        Visualização Kanban
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="list" className="py-2">
                        <List className="h-4 w-4 mr-3" />
                        Visualização Lista
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Compact Mode Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsCompactMode(!isCompactMode)}
                        className={cn(
                          "h-12 px-4 rounded-xl border-slate-200/50 transition-all duration-200",
                          isCompactMode 
                            ? "bg-blue-50 border-blue-200 text-blue-700" 
                            : "bg-white/80 backdrop-blur-sm hover:bg-white"
                        )}
                      >
                        {isCompactMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isCompactMode ? 'Modo expandido' : 'Modo compacto'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Active Filters Indicator */}
              {hasActiveFilters && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className={cn(
                      designSystem.typography.caption,
                      "text-blue-700 font-medium"
                    )}>
                      Exibindo {advancedStats.total} de {state.columns.flatMap(c => c.orders).length} pedidos
                  </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 w-6 p-0 hover:bg-blue-100 rounded-lg"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Kanban Pipeline Revolution */}
        <main className="relative z-10 pb-8">
          {/* Pipeline Navigation */}
          {showScrollIndicators && (
            <div className="mx-4 lg:mx-6 mb-6">
              <Card className={cn(
                "p-4 border-0 bg-white/80 backdrop-blur-xl",
                designSystem.shadows.floating,
                "rounded-2xl"
              )}>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-blue-600" />
                      <span className={cn(
                        designSystem.typography.caption,
                        "text-slate-700 font-semibold whitespace-nowrap"
                      )}>
                        Pipeline:
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                  {filteredColumns.map((column, index) => (
                    <Button
                      key={column.id}
                      variant="ghost"
                      size="sm"
                          className={cn(
                            "px-3 py-2 h-8 text-xs font-medium rounded-lg",
                            "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                            "transition-all duration-200 whitespace-nowrap flex-shrink-0",
                            currentViewIndex === index && "bg-blue-100 text-blue-700"
                          )}
                          onClick={() => {
                            scrollToColumn(index);
                            setCurrentViewIndex(index);
                          }}
                    >
                      {statusNames[column.id]}
                          <Badge className={cn(
                            "ml-2 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0 h-4",
                            column.orders.length > 0 && "bg-blue-200 text-blue-800"
                          )}>
                        {column.orders.length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
              
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      designSystem.typography.micro,
                      "text-slate-400 hidden lg:block"
                    )}>
                  Ctrl + ← / →
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg border-slate-200",
                              !canScrollLeft && "opacity-40 cursor-not-allowed"
                            )}
                        onClick={() => scrollTo('left')}
                        disabled={!canScrollLeft}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                          <p>Navegar para esquerda</p>
                          <p className="text-xs text-slate-400">Ctrl + ←</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg border-slate-200",
                              !canScrollRight && "opacity-40 cursor-not-allowed"
                            )}
                        onClick={() => scrollTo('right')}
                        disabled={!canScrollRight}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                          <p>Navegar para direita</p>
                          <p className="text-xs text-slate-400">Ctrl + →</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
                </div>
              </Card>
            </div>
          )}

          <DndContext 
            sensors={sensors}
            measuring={measuring}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Kanban Container with Revolutionary Design */}
            <div className="relative">
              {/* Scroll Indicator Banner */}
              <div className="mx-6 mb-4">
                <div className={cn(
                  "flex items-center justify-center gap-3 py-3 px-6",
                  "bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50",
                  "border border-blue-200/50 rounded-xl",
                  "text-sm font-medium text-blue-700"
                )}>
                  <ChevronLeft className="h-4 w-4 animate-pulse" />
                  <span>Arraste horizontalmente ou use os controles para navegar entre as colunas</span>
                  <ChevronRight className="h-4 w-4 animate-pulse" />
                </div>
              </div>

              {/* Scroll Shadow Indicators */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-8 z-30 pointer-events-none",
                "bg-gradient-to-r from-slate-50 to-transparent",
                "opacity-0 transition-opacity duration-300",
                canScrollLeft && "opacity-100"
              )} />
              <div className={cn(
                "absolute right-0 top-0 bottom-0 w-8 z-30 pointer-events-none",
                "bg-gradient-to-l from-slate-50 to-transparent",
                "opacity-0 transition-opacity duration-300",
                canScrollRight && "opacity-100"
              )} />
              
              {/* Horizontal Scroll Container - SOLUÇÃO FINAL RESPONSIVA */}
              <div 
                ref={scrollContainerRef}
                className={cn(
                  // Scroll horizontal responsivo
                  "overflow-x-auto overflow-y-hidden",
                  // Container responsivo
                  "w-full min-h-[600px]",
                  // Animação suave
                  isScrolling ? "scroll-smooth" : "scroll-auto"
                )}
                style={{
                  // CSS mínimo para garantir funcionamento
                  WebkitOverflowScrolling: 'touch'
                }}
                onScroll={() => {
                  setIsScrolling(true);
                  if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                  }
                  scrollTimeoutRef.current = setTimeout(() => {
                    setIsScrolling(false);
                  }, 150);
                }}
              >
                {/* Container das colunas com largura FORÇADA */}
                <div 
                  className={cn(
                    "flex gap-6 p-6",
                    isCompactMode && "gap-4 p-4"
                  )}
                  style={{
                    // SOLUÇÃO FINAL - Largura responsiva baseada no conteúdo
                    minWidth: `${containerWidth.minWidth}px`,
                    width: 'max-content'
                  }}
                >
                  {filteredColumns.map((column) => (
                    <SortableContext
                      key={column.id}
                      items={column.orders.map(order => order.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div 
                        className={cn(
                          "flex-shrink-0",
                          // Larguras responsivas das colunas
                          "w-80 lg:w-80 md:w-72 sm:w-64"
                        )}
                      >
                        <ModernKanbanColumn
                          title={statusNames[column.id]}
                          orders={column.orders}
                          status={column.id}
                          onUpdateStatus={handleUpdateStatus}
                          onUpdateOrder={handleUpdateOrder}
                          columnId={column.id}
                          onAddOrder={() => openNewOrderDialog(column.id)}
                          activeFilterLabel={filterLabels.length > 0 ? filterLabels[0] : undefined}
                          isLoading={isLoading}
                          isDragOver={overId === column.id}
                          activeId={activeId}
                          placeholderPosition={placeholderColumnId === column.id ? placeholderPosition : null}
                          placeholderIndex={placeholderColumnId === column.id ? placeholderIndex : null}
                        />
                      </div>
                    </SortableContext>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Enhanced DragOverlay */}
            <DragOverlay 
              dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              className="z-[9999]"
            >
              {activeOrder ? (
                <CardOverlay order={activeOrder} />
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Empty State */}
          {filteredColumns.every(column => column.orders.length === 0) && (
            <div className="flex flex-col items-center justify-center min-h-[400px] mx-6">
              <Card className={cn(
                "p-12 border-0 text-center max-w-md",
                designSystem.shadows.subtle,
                "bg-gradient-to-br from-white to-slate-50"
              )}>
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-slate-400" />
        </div>
                <h3 className={cn(
                  designSystem.typography.heading,
                  "text-slate-900 mb-3"
                )}>
                  Nenhum pedido encontrado
                </h3>
                <p className={cn(
                  designSystem.typography.caption,
                  "text-slate-500 mb-6"
                )}>
                  {hasActiveFilters 
                    ? "Tente ajustar os filtros ou criar um novo pedido"
                    : "Comece criando seu primeiro pedido no pipeline"
                  }
                </p>
                {hasActiveFilters ? (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mb-3"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                ) : (
                  <Button
                    onClick={() => openNewOrderDialog()}
                    className={designSystem.gradients.primary}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Pedido
                  </Button>
                )}
              </Card>
            </div>
          )}
        </main>

        {/* Enhanced Dialogs */}
        <NewOrderDialog
          open={isNewOrderDialogOpen}
          onOpenChange={(open) => setIsNewOrderDialogOpen(open)}
          onAddOrder={(orderData) => {
            const newOrder: Order = {
              id: `order-${Date.now()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              history: [
                {
                  id: `history-${Date.now()}`,
                  date: new Date(),
                  status: orderData.status,
                  user: 'Sistema',
                  comment: 'Pedido criado com sucesso'
                }
              ],
              ...orderData
            };
            
            dispatch({
              type: 'ADD_ORDER',
              payload: newOrder
            });
            
            toast.success('🎉 Pedido criado com sucesso!', {
              description: `Pedido "${newOrder.title}" adicionado ao pipeline`,
              duration: 3000,
            });
          }}
          initialStatus={newOrderInitialStatus}
        />
      </div>
    </TooltipProvider>
  );
} 