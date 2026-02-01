"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Paperclip,
  GripVertical,
  Building2,
  User
} from "lucide-react";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KanbanCardProps {
  order: Order;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ order, onClick, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = order.dueDate && isPast(new Date(order.dueDate)) && !isToday(new Date(order.dueDate));
  const isDueToday = order.dueDate && isToday(new Date(order.dueDate));
  const isHighPriority = order.priority === "high";

  const customerName = order.customer?.name || order.customerDetails || "Cliente";
  const customerInitials = customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "kanban-card-modern cursor-pointer border bg-card p-3 transition-all",
        (isDragging || isSortableDragging) && "opacity-50 shadow-2xl scale-105 rotate-2",
        isHighPriority && "border-l-4 border-l-destructive",
        isOverdue && "border-l-4 border-l-orange-500"
      )}
      onClick={onClick}
    >
      {/* Header with drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
            {order.title}
          </h3>
        </div>

        {isHighPriority && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="priority-badge-high">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Prioridade Alta</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        {order.customer?.company ? (
          <Building2 className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )}
        <span className="truncate">{customerName}</span>
      </div>

      {/* Labels */}
      {order.labels && order.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {order.labels.slice(0, 2).map((label) => {
            const config = LABEL_CONFIG[label];
            return (
              <Badge
                key={label}
                variant="secondary"
                className={cn("text-[10px] px-1.5 py-0", config?.bgColor, config?.color)}
              >
                {config?.label || label}
              </Badge>
            );
          })}
          {order.labels.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{order.labels.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Due Date */}
          {order.dueDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[10px]",
                      isOverdue && "text-orange-600 font-medium",
                      isDueToday && "text-yellow-600 font-medium",
                      !isOverdue && !isDueToday && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(order.dueDate), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Entrega: {format(new Date(order.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                  {isOverdue && " (Atrasado)"}
                  {isDueToday && " (Hoje)"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Comments count */}
          {order.comments && order.comments.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{order.comments.length}</span>
            </div>
          )}

          {/* Attachments count */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>{order.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assigned user */}
        {order.assignedTo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {order.assignedTo.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Atribuido a: {order.assignedTo}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}
