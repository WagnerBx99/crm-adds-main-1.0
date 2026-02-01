"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/config";
import { KanbanCard } from "./kanban-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  id: OrderStatus;
  title: string;
  orders: Order[];
  onCardClick?: (order: Order) => void;
  onAddClick?: () => void;
}

export function KanbanColumn({
  id,
  title,
  orders,
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = STATUS_CONFIG[id];
  const color = STATUS_COLORS[id] || "#6B7280";

  const highPriorityCount = orders.filter((o) => o.priority === "high").length;
  const overdueCount = orders.filter((o) => {
    if (!o.dueDate) return false;
    return new Date(o.dueDate) < new Date() && o.status !== "FINALIZADO" && o.status !== "ENTREGUE";
  }).length;

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/30 rounded-xl border border-border/50 min-w-[300px] max-w-[300px] h-full transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div
        className="p-3 border-b border-border/50 rounded-t-xl"
        style={{ backgroundColor: `${color}10` }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-sm">{config?.label || title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {orders.length}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {highPriorityCount > 0 && (
            <span className="text-destructive font-medium">
              {highPriorityCount} urgente{highPriorityCount > 1 ? "s" : ""}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-orange-600 font-medium">
              {overdueCount} atrasado{overdueCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext
          id={id}
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={cn(
              "flex flex-col gap-2 min-h-[100px] transition-colors",
              isOver && "bg-primary/5 rounded-lg"
            )}
          >
            {orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onClick={() => onCardClick?.(order)}
              />
            ))}

            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-xs">Nenhum pedido</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>

      {/* Add Button */}
      {onAddClick && (
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={onAddClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar pedido
          </Button>
        </div>
      )}
    </div>
  );
}
