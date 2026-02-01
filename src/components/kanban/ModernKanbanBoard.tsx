import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Plus, 
  Sliders, 
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
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useCardToast } from '@/hooks/useCardToast';
import { 
  reorderCardsInSameColumn,
  moveCardBetweenColumns,
  validateMove,
  createOptimisticSnapshot,
  applyRollback
} from '@/lib/reorderCards';
import { 
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart,
  DragUpdate,
  ResponderProvided
} from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

// Importar estilos CSS personalizados
import '../../styles/kanban.css';
import '../../styles/drag-animations.css';

// Configuração de Design System usando design tokens
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
    primary: "bg-gradient-to-br from-accent-primary via-accent-primary to-accent-secondary",
    secondary: "bg-gradient-to-br from-surface-1 via-surface-0 to-surface-1",
    accent: "bg-gradient-to-r from-accent-secondary to-accent-tertiary",
    warning: "bg-gradient-to-r from-semantic-warning to-accent-secondary",
    danger: "bg-gradient-to-r from-semantic-error to-semantic-warning",
    surface: "bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0"
  },
  surfaces: {
    primary: "bg-surface-0",
    secondary: "bg-surface-1",
    accent: "bg-accent-primary",
    success: "bg-semantic-success",
    warning: "bg-semantic-warning",
    error: "bg-semantic-error"
  },
  shadows: {
    elegant: "shadow-2xl shadow-accent-primary/10",
    floating: "shadow-lg shadow-accent-primary/20",
    subtle: "shadow-sm shadow-accent-primary/10",
    glow: "shadow-2xl shadow-accent-primary/20"
  },
  animations: {
    smooth: "transition-all duration-300 ease-out",
    bounce: "transition-all duration-200 ease-bounce",
    elastic: "transition-all duration-500 ease-elastic"
  }
};

// Configuração de prioridades com design tokens
const priorityConfig = {
  'high': { 
    color: 'bg-semantic-error/10 text-semantic-error border-semantic-error/20', 
    label: 'Crítica',
    icon: AlertTriangle,
    gradient: 'from-semantic-error to-semantic-warning',
    dot: 'bg-semantic-error',
    glow: 'shadow-semantic-error/20'
  },
  'normal': { 
    color: 'bg-surface-1 text-text-high border-accent-primary/20', 
    label: 'Padrão',
    icon: Check,
    gradient: 'from-accent-primary to-accent-secondary',
    dot: 'bg-accent-primary',
    glow: 'shadow-accent-primary/20'
  },
};

// Interface para estatísticas avançadas
interface AdvancedStats {
  total: number;
  highPriority: number;
  overdue: number;
  completedToday: number;
  productivity: number;
  avgTimeInPipeline: number;
  completionRate: number;
}

// 🎨 Component CardOverlay redesenhado - VERSÃO MINIMALISTA
const CardOverlay = ({ order }: { order: Order }) => {
  const currentPriority = order.priority || 'normal';
  const priorityStyle = priorityConfig[currentPriority] || priorityConfig['normal'];

  return (
    <Card className={cn(
      "w-80 bg-white/95 backdrop-blur-sm border border-accent-primary/20",
      "shadow-sm shadow-accent-primary/5",
      // Efeito minimalista - sem scale e ring reduzido
      "transition-none animation-none",
      "kanban-card-drag-overlay-instantaneous"
    )}
    style={{
      transition: 'none',
      animation: 'none'
    }}
    >
      <div className={cn(designSystem.spacing.compact, "space-y-3")}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full",
            priorityStyle.dot,
            "shadow-sm"
          )} />
          <span className={cn(
            designSystem.typography.micro,
            "text-slate-500"
          )}>
            {priorityStyle.label}
          </span>
          <Badge className="ml-auto bg-blue-500/90 text-white text-[10px] px-1.5 py-0.5 border-0 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            Movendo
          </Badge>
        </div>
        
        <h3 className={cn(
          designSystem.typography.heading,
          "text-slate-800 leading-tight line-clamp-2 text-base"
        )}>
          {order.title}
        </h3>
        
        <p className={cn(
          designSystem.typography.caption,
          "text-slate-400 line-clamp-1 text-xs"
        )}>
          {order.customer?.name}
        </p>
      </div>
    </Card>
  );
};

// 🎯 DragOverlay customizado que acompanha o cursor - INSTANTÂNEO
const CustomDragOverlay = ({ activeOrder }: { activeOrder: Order | null }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!activeOrder) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [activeOrder]);

  if (!activeOrder) return null;

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        // ZERO transições para soltura instantânea
        transition: 'none',
        animation: 'none'
      }}
    >
      <CardOverlay order={activeOrder} />
    </div>,
    document.body
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
            "px-4 py-3 border-0 cursor-pointer",
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
  const { state, dispatch, updateOrderStatusApi } = useKanban();
  const { width: viewportWidth } = useViewport();
  const columnWidth = useColumnWidth();
  
  // 🎯 Estados principais com design avançado
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterLabels, setFilterLabels] = useState<Label[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
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
  const COLUMN_GAP = 12;
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
    const gap = isCompactMode ? 8 : 12; // gap-2 ou gap-3 (8px ou 12px)
    const padding = isCompactMode ? 32 : 48; // p-4 ou p-6 (ambos os lados)
    
    const totalWidth = (filteredColumns.length * baseColumnWidth) + 
                       ((filteredColumns.length - 1) * gap) + 
                       padding;
    
    // Força scroll apenas se o conteúdo for maior que a viewport
    // Adiciona 200px extra para garantir scroll quando necessário
    const needsScroll = totalWidth > viewportWidth;
    const finalWidth = totalWidth;   // largura exata do conteúdo
    
    return {
      width: finalWidth,
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

  // 🚀 HANDLERS ULTRA-OTIMIZADOS - Performance tipo Trello/Notion
  const { showMoveSuccess, showReorderSuccess, showError, showDragStart } = useCardToast();
  const { handleAutoScroll, clearAutoScroll } = useAutoScroll();
  
  // Estados para snapshot otimista
  const [optimisticSnapshot, setOptimisticSnapshot] = useState<any>(null);
  
  const handleDragStart = useCallback((start: DragStart) => {
    const { draggableId } = start;
    
    // Throttling avançado com performance.now()
    const now = performance.now();
    if (isDragging || (now - lastDragEndTime) < 100) {
      return;
    }
    
    setIsDragging(true);
    setActiveId(draggableId);

    // Busca otimizada com early return
    for (const column of state.columns) {
      const order = column.orders.find(o => o.id === draggableId);
      if (order) {
        setActiveOrder(order);
        setActiveContainer(column.id);
        
        // Criar snapshot otimista
        setOptimisticSnapshot(createOptimisticSnapshot(column.orders));
        
        // Toast de início de drag
        showDragStart(order.title);
        break;
      }
    }

    // Haptic feedback otimizado
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    console.log('🚀 Drag iniciado [ULTRA-OTIMIZADO]:', { activeId: draggableId });
  }, [state.columns, isDragging, lastDragEndTime, showDragStart]);

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    // ===== NÃO faça NADA no update que altere estado =====
    console.log('🎯 Drag update (apenas log):', {
      from: update.source?.droppableId,
      to: update.destination?.droppableId,
      index: update.destination?.index
    });
    
    /* Removido: setOverId() e outros setState que causavam mutação durante drag */
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    console.log('🔥 onDragEnd', result);
    const { destination, source, draggableId } = result;
    
    // CLEANUP INSTANTÂNEO - SEMPRE EXECUTA (independente de qualquer estado)
    setActiveId(null);
    setActiveOrder(null);
    setActiveContainer(null);
    setOverId(null);
    setOptimisticSnapshot(null);
    setIsDragging(false);
    clearAutoScroll();
    
    const now = performance.now();
    setLastDragEndTime(now);
    
    // Se não há destination, apenas para aqui
    if (!destination) {
      console.log('❌ Drag cancelado - sem target');
      return;
    }

    // Validação rápida para mesmo item e posição
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Busca otimizada de colunas
    const fromColumn = state.columns.find(column => column.id === source.droppableId);
    const toColumn = state.columns.find(column => column.id === destination.droppableId);
    
    if (!fromColumn || !toColumn) {
      console.log('❌ Erro: Coluna não encontrada');
      showError('Erro ao mover card', 'Coluna não encontrada');
      return;
    }

    const draggedOrder = fromColumn.orders.find(order => order.id === draggableId);
    if (!draggedOrder) {
      showError('Erro ao mover card', 'Card não encontrado');
      return;
    }

    console.log('🎯 Processamento INSTANTÂNEO:', {
      from: fromColumn.id,
      to: toColumn.id,
      sameColumn: fromColumn.id === toColumn.id
    });

    if (fromColumn.id === toColumn.id) {
      // Reordenação INSTANTÂNEA na mesma coluna
      if (!validateMove(source.droppableId, destination.droppableId, source.index, destination.index, fromColumn.orders)) {
        showError('Movimento inválido', 'Esta reordenação não é permitida');
        return;
      }

      const reorderResult = reorderCardsInSameColumn(
        fromColumn.orders,
        source.index,
        destination.index
      );
      
      // CORREÇÃO: Dispatch SÍNCRONO para evitar flicker visual
      dispatch({
        type: 'REORDER_ORDERS_IN_COLUMN',
        payload: {
          columnId: fromColumn.id,
          newOrders: reorderResult.sourceOrders
        }
      });
      
      // Toast sem delay
      showReorderSuccess(
        draggedOrder.title,
        statusNames[fromColumn.id],
        () => {
          if (optimisticSnapshot) {
            const rollbackOrders = applyRollback(optimisticSnapshot);
            // CORREÇÃO: Dispatch SÍNCRONO para rollback
            dispatch({
              type: 'REORDER_ORDERS_IN_COLUMN',
              payload: {
                columnId: fromColumn.id,
                newOrders: rollbackOrders
              }
            });
          }
        }
      );
      
      // Haptic feedback instantâneo
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 10, 10]);
      }
    } else {
      // Movimento entre colunas INSTANTÂNEO
      if (!validateMove(source.droppableId, destination.droppableId, source.index, destination.index, fromColumn.orders, toColumn.orders)) {
        showError('Movimento inválido', 'Esta movimentação não é permitida');
        return;
      }

      // CORREÇÃO: Dispatch SÍNCRONO para evitar flicker visual
      dispatch({
        type: 'UPDATE_ORDER_STATUS',
        payload: { orderId: draggableId, newStatus: toColumn.id }
      });
      
      // Salvar no backend imediatamente
      updateOrderStatusApi(draggableId, toColumn.id).catch(error => {
        console.error('❌ Erro ao salvar status no backend:', error);
      });
      
      // Toast sem delay
      showMoveSuccess(
        draggedOrder.title,
        fromColumn.id,
        toColumn.id,
        () => {
          // Rollback: voltar para status anterior
          updateOrderStatusApi(draggableId, fromColumn.id).catch(error => {
            console.error('❌ Erro ao fazer rollback:', error);
          });
        }
      );
      
      // Haptic feedback instantâneo
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 5, 15]);
      }
    }
    
    console.log('🏁 Drop INSTANTÂNEO finalizado');
    console.log('🏁 Estado depois do drop', JSON.stringify(state.columns.map(c => ({id: c.id, orderIds: c.orders.map(o => o.id)}))));
  }, [
    state.columns, 
    updateOrderStatusApi,
    dispatch, 
    showMoveSuccess,
    showReorderSuccess,
    showError,
    clearAutoScroll,
    statusNames,
    optimisticSnapshot
  ]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
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
            <div className="flex gap-6 pb-6">
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
  console.log('🔍 [SCROLL DEBUG FINAL]',
    JSON.stringify({
      columns: filteredColumns.length,
      containerWidth,
      viewportWidth,
      columnWidth,
      scrollWidth: scrollContainerRef.current?.scrollWidth,
      clientWidth: scrollContainerRef.current?.clientWidth
    }, null, 2)
  );
  
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        {/* Background Pattern Sutil */}
        <div className="fixed inset-0 bg-grid-slate-100/30 bg-[size:32px_32px] opacity-60 pointer-events-none" />
        
        {/* Header Otimizado - Design System Avançado */}
        <header className="
          sticky top-0 left-0 z-50
          w-full max-w-full
          bg-surface-0/95 backdrop-blur-xl
          border-b border-accent-primary/20
          shadow-lg shadow-accent-primary/5
        ">
          {/* Container ultra-compacto com densidade otimizada */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {/* Layout Inteligente - Single Row com Hierarquia Visual */}
            <div className="flex items-center justify-between gap-4 lg:gap-6">
              
              {/* Seção Principal: Brand + Título + Métricas Integradas */}
              <div className="flex items-center gap-6 min-w-0 flex-1">
                {/* Brand Compacto */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-surface-0 shadow-lg",
                    designSystem.gradients.primary,
                    "ring-2 ring-accent-primary/20"
                  )}>
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className={cn(
                      "text-xl font-bold tracking-tight leading-none",
                      "bg-gradient-to-r from-text-high via-accent-primary to-accent-secondary bg-clip-text text-transparent"
                    )}>
                      Pipeline CRM
                    </h1>
                    <p className="text-xs text-text-low leading-none mt-0.5">
                      Gestão visual de pedidos
                    </p>
                  </div>
                </div>

                {/* Métricas Horizontais Compactas - Reduzidas */}
                <div className="hidden lg:flex items-center gap-1 bg-surface-1/80 rounded-xl px-3 py-2 border border-accent-primary/20">
                  {/* Apenas 3 Métricas Essenciais */}
                  {[
                    { icon: Target, value: advancedStats.total, label: "Total", color: "text-accent-primary" },
                    { icon: Clock, value: advancedStats.overdue, label: "Atrasados", color: "text-semantic-warning" },
                    { icon: TrendingUp, value: advancedStats.completedToday, label: "Finalizados", color: "text-semantic-success" }
                  ].map((metric, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-surface-0/60 rounded-lg transition-colors">
                            <metric.icon className={cn("h-3.5 w-3.5", metric.color)} />
                            <span className="text-sm font-semibold text-text-high">{metric.value}</span>
                            <span className="text-xs text-text-low hidden xl:block">{metric.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{metric.label}: {metric.value}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Seção de Controles: Search + Filtros + Ações */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Search Compacto - Largura Ajustada */}
                <div className="relative hidden md:block">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-text-low" />
                  </div>
                  <Input
                    placeholder="Pesquisar pedidos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "h-9 w-48 lg:w-56 xl:w-64 pl-9 pr-9 text-sm bg-surface-0/80",
                      "border-accent-primary/20 focus:bg-surface-0 focus:ring-2 focus:ring-accent-primary/20",
                      "focus:border-accent-primary/40 rounded-lg",
                      "placeholder:text-text-low transition-all duration-200"
                    )}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-accent-primary/10 rounded"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Filtros Compactos */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "h-9 px-3 text-sm gap-2 rounded-lg border-accent-primary/20",
                        "bg-surface-0/80 hover:bg-surface-0 transition-all duration-200",
                        hasActiveFilters && [
                          "border-accent-primary bg-accent-primary/5 text-accent-primary",
                          "hover:bg-accent-primary/10"
                        ]
                      )}
                    >
                      <FilterIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                      {hasActiveFilters && (
                        <Badge className="bg-accent-primary text-surface-0 text-[10px] px-1.5 py-0 h-4 border-0">
                          {[
                            filterPriority !== 'all' ? 1 : 0,
                            filterLabels.length,
                            filterDateRange !== 'all' ? 1 : 0,
                          ].reduce((a, b) => a + b, 0)}
                        </Badge>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-80 p-6 border-0 shadow-2xl bg-surface-0/95 backdrop-blur-xl rounded-2xl" 
                    align="end"
                  >
                    <DropdownMenuLabel className={cn(
                      designSystem.typography.heading,
                      "text-text-high flex items-center gap-3 mb-4"
                    )}>
                      <Sliders className="h-5 w-5 text-accent-primary" />
                      Filtros Avançados
                    </DropdownMenuLabel>
                    
                    {/* Priority Filter */}
                    <div className="space-y-3 mb-6">
                      <label className={cn(
                        designSystem.typography.micro,
                        "text-text-low block"
                      )}>
                        Nível de Prioridade
                      </label>
                      <DropdownMenuRadioGroup 
                        value={filterPriority} 
                        onValueChange={(value) => setFilterPriority(value as Priority | 'all')}
                      >
                        <DropdownMenuRadioItem 
                          value="all" 
                          className="py-3 px-4 rounded-lg hover:bg-surface-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-surface-1 to-text-low" />
                            <span className="font-medium">Todas as prioridades</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem 
                          value="high" 
                          className="py-3 px-4 rounded-lg hover:bg-semantic-error/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-semantic-error" />
                            <span className="text-semantic-error font-semibold">Alta prioridade</span>
                            <Badge className="ml-auto bg-semantic-error/10 text-semantic-error text-xs">
                              {state.columns.flatMap(c => c.orders).filter(o => o.priority === 'high').length}
                            </Badge>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem 
                          value="normal" 
                          className="py-3 px-4 rounded-lg hover:bg-surface-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-semantic-success" />
                            <span className="text-text-high font-medium">Prioridade normal</span>
                            <Badge className="ml-auto bg-surface-1 text-text-high text-xs">
                              {state.columns.flatMap(c => c.orders).filter(o => o.priority === 'normal').length}
                            </Badge>
                          </div>
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </div>

                    <DropdownMenuSeparator className="my-4 bg-accent-primary/20" />

                    {/* Date Range Filter */}
                    <div className="space-y-3 mb-6">
                      <label className={cn(
                        designSystem.typography.micro,
                        "text-text-low block"
                      )}>
                        Período de Criação
                      </label>
                      <DropdownMenuRadioGroup 
                        value={filterDateRange} 
                        onValueChange={(value) => setFilterDateRange(value as typeof filterDateRange)}
                      >
                        {[
                          { value: 'all', label: 'Todos os períodos', icon: Calendar, color: 'text-text-low' },
                          { value: 'today', label: 'Criados hoje', icon: Calendar, color: 'text-accent-primary' },
                          { value: 'week', label: 'Últimos 7 dias', icon: Calendar, color: 'text-semantic-success' },
                          { value: 'month', label: 'Últimos 30 dias', icon: Calendar, color: 'text-accent-tertiary' },
                          { value: 'quarter', label: 'Últimos 90 dias', icon: Calendar, color: 'text-accent-secondary' },
                        ].map(option => (
                          <DropdownMenuRadioItem 
                            key={option.value}
                            value={option.value} 
                            className="py-3 px-4 rounded-lg hover:bg-surface-1 cursor-pointer"
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
                        <DropdownMenuSeparator className="my-4 bg-accent-primary/20" />
                        <div className="space-y-3 mb-6">
                          <label className={cn(
                            designSystem.typography.micro,
                            "text-text-low block"
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
                              className="py-3 px-4 rounded-lg hover:bg-surface-1 cursor-pointer"
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
                        <DropdownMenuSeparator className="my-4 bg-accent-primary/20" />
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="w-full py-3 text-semantic-error hover:text-semantic-error hover:bg-semantic-error/5 border-semantic-error/20 rounded-lg"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpar todos os filtros
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Botão Refresh */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRefreshing(true)}
                        disabled={refreshing}
                        className="h-9 w-9 p-0 rounded-lg border-accent-primary/20 hover:bg-accent-primary/5 transition-all duration-200"
                      >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Atualizar dados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Botão Principal - Novo Pedido */}
                <Button
                  onClick={() => openNewOrderDialog()}
                  size="sm"
                  className={cn(
                    "h-9 px-4 text-sm font-semibold rounded-lg shadow-md",
                    designSystem.gradients.primary,
                    "hover:shadow-lg hover:scale-105",
                    designSystem.animations.smooth,
                    "ring-1 ring-accent-primary/20"
                  )}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Novo Pedido</span>
                  <span className="sm:hidden">Novo</span>
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Pipeline Revolution */}
        <section
          className={cn(
            "relative z-10 pb-2 w-full max-w-full",
            // ✅ MUDANÇA: Classes dinâmicas ultra-otimizadas para fases do drag
            isDragging && "drag-active kanban-board--dragging",
            activeId && overId && activeContainer !== overId && "drag-phase-over drag-between-columns-optimized",
            !isDragging && "drag-phase-end",
            activeContainer && overId && activeContainer === overId && "drag-reordering-optimized"
          )}
        >
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          >
            {/* Kanban Container with Revolutionary Design */}
            <div className="relative">
              {/* Scroll Shadow Indicators */}
              {!isDragging && (
                <>
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-8 z-[-1] pointer-events-none",
                    "bg-gradient-to-r from-slate-50 to-transparent",
                    "opacity-0 transition-opacity duration-300",
                    canScrollLeft && "opacity-100"
                  )} />
                  <div className={cn(
                    "absolute right-0 top-0 bottom-0 w-8 z-[-1] pointer-events-none",
                    "bg-gradient-to-l from-slate-50 to-transparent",
                    "opacity-0 transition-opacity duration-300",
                    canScrollRight && "opacity-100"
                  )} />
                </>
              )}
              
              {/* Horizontal Scroll Container - SOLUÇÃO FINAL RESPONSIVA */}
              <div 
                ref={scrollContainerRef}
                className={cn(
                  // Scroll horizontal responsivo - SEM overflow-y para evitar nested scroll
                  "overflow-x-auto",
                  // Container responsivo - garante que NUNCA ultrapasse o viewport
                  "w-full max-w-full min-h-[600px]"
                )}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overflowY: 'visible',
                  scrollBehavior: isScrolling ? 'smooth' : 'auto'
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
                {/* Container das colunas com largura responsiva */}
                <div 
                  className={cn(
                    "flex gap-3 px-6 pt-6 pb-2",
                    isCompactMode && "gap-2 px-4 pt-4 pb-1"
                  )}
                >
                  {filteredColumns.map((column, columnIndex) => (
                    <Droppable
                      key={column.id}
                      droppableId={column.id}
                      type="CARD"
                    >
                      {(provided, snapshot) => (
                        <div 
                          className={cn(
                            "flex-shrink-0",
                            // Larguras responsivas das colunas
                            "w-80 lg:w-80 md:w-72 sm:w-64",
                            snapshot.isDraggingOver && "kanban-column--drag-over"
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
                            isDragOver={snapshot.isDraggingOver}
                            activeId={activeId}
                            placeholder={provided.placeholder}
                            droppableRef={provided.innerRef}
                            droppableProps={provided.droppableProps}
                          />
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </div>
            </div>
          </DragDropContext>

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
        </section>

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

        {/* Indicador de Filtros Ativos - Compacto */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-3 mx-6 mb-2 px-3 py-2 bg-blue-50/60 rounded-lg border border-blue-200/30">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-700 truncate">
                {advancedStats.total} de {state.columns.flatMap(c => c.orders).length} pedidos
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 w-6 p-0 hover:bg-blue-100/80 rounded-md flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Custom Drag Overlay - Tripla validação para desmontagem garantida */}
        {isDragging && activeId && activeOrder && <CustomDragOverlay activeOrder={activeOrder} />}
      </div>
    </TooltipProvider>
  );
} 
