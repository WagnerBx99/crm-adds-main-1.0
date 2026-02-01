"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { KanbanFilters } from "./kanban-filters";
import { OrderDetails } from "@/components/orders/order-details";
import { OrderForm } from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Plus, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "@/lib/api";

// All status columns in order
const COLUMN_ORDER: OrderStatus[] = [
  "FAZER",
  "AJUSTE",
  "APROVACAO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "ARTE_APROVADA",
  "PRODUCAO",
  "EXPEDICAO",
  "FINALIZADO",
  "ENTREGUE",
  "FATURADO",
  "ARQUIVADO",
];

interface KanbanBoardProps {
  initialOrders?: Order[];
}

export function KanbanBoard({ initialOrders = [] }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: "all",
    labels: [] as string[],
    assignedTo: "",
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          order.title.toLowerCase().includes(query) ||
          order.customer?.name?.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (filters.priority !== "all" && order.priority !== filters.priority) {
        return false;
      }

      // Labels filter
      if (filters.labels.length > 0) {
        const hasLabel = order.labels?.some((l) => filters.labels.includes(l));
        if (!hasLabel) return false;
      }

      // Assigned filter
      if (filters.assignedTo && order.assignedTo !== filters.assignedTo) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, filters]);

  // Group orders by status
  const columns = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = {} as Record<OrderStatus, Order[]>;
    
    COLUMN_ORDER.forEach((status) => {
      grouped[status] = [];
    });

    filteredOrders.forEach((order) => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  }, [filteredOrders]);

  // Get active order for drag overlay
  const activeOrder = useMemo(() => {
    if (!activeId) return null;
    return orders.find((o) => o.id === activeId) || null;
  }, [activeId, orders]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeOrder = orders.find((o) => o.id === active.id);
    if (!activeOrder) return;

    // If dropping over a column
    if (COLUMN_ORDER.includes(over.id as OrderStatus)) {
      const newStatus = over.id as OrderStatus;
      if (activeOrder.status !== newStatus) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === active.id ? { ...o, status: newStatus } : o
          )
        );
      }
    }
  }, [orders]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeOrder = orders.find((o) => o.id === active.id);
    if (!activeOrder) return;

    // Determine the new status
    let newStatus = activeOrder.status;
    
    if (COLUMN_ORDER.includes(over.id as OrderStatus)) {
      newStatus = over.id as OrderStatus;
    } else {
      // Dropped over another card - find its column
      const overOrder = orders.find((o) => o.id === over.id);
      if (overOrder) {
        newStatus = overOrder.status;
      }
    }

    // Update if status changed
    if (activeOrder.status !== newStatus) {
      try {
        await ordersApi.updateStatus(activeOrder.id, newStatus);
        toast.success(`Pedido movido para ${STATUS_CONFIG[newStatus].label}`);
      } catch (error) {
        // Revert on error
        setOrders((prev) =>
          prev.map((o) =>
            o.id === active.id ? { ...o, status: activeOrder.status } : o
          )
        );
        toast.error("Erro ao atualizar status");
      }
    }
  }, [orders]);

  // Refresh orders
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getKanban();
      const allOrders: Order[] = [];
      Object.values(response.columns).forEach((columnOrders) => {
        allOrders.push(...columnOrders);
      });
      setOrders(allOrders);
      toast.success("Pedidos atualizados");
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Order actions
  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  const handleOrderSave = useCallback((order: Order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === order.id);
      if (exists) {
        return prev.map((o) => (o.id === order.id ? order : o));
      }
      return [...prev, order];
    });
    setShowOrderForm(false);
    setSelectedOrder(null);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-primary/10")}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setShowOrderForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <KanbanFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filteredOrders.length} pedidos</span>
          <span className="text-destructive">
            {filteredOrders.filter((o) => o.priority === "high").length} urgentes
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-4 h-full kanban-scroll">
            {COLUMN_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                id={status}
                title={STATUS_CONFIG[status].label}
                orders={columns[status] || []}
                onCardClick={handleOrderClick}
                onAddClick={status === "FAZER" ? () => setShowOrderForm(true) : undefined}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeOrder && (
            <div className="drag-overlay">
              <KanbanCard order={activeOrder} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Order Details Sheet */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleOrderSave}
        />
      )}

      {/* New Order Form */}
      {showOrderForm && (
        <OrderForm
          open={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          onSave={handleOrderSave}
        />
      )}
    </div>
  );
}
