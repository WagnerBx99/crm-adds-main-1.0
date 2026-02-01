"use client";

import { Label } from "@/lib/types";
import { LABEL_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface KanbanFiltersProps {
  filters: {
    priority: string;
    labels: string[];
    assignedTo: string;
  };
  onFiltersChange: (filters: {
    priority: string;
    labels: string[];
    assignedTo: string;
  }) => void;
}

const LABELS: Label[] = [
  "BOLETO",
  "AGUARDANDO_PAGAMENTO",
  "PEDIDO_CANCELADO",
  "APROV_AGUARDANDO_PAGAMENTO",
  "AMOSTRAS",
  "PAGO",
  "ORCAMENTO_PUBLICO",
];

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  const toggleLabel = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter((l) => l !== label)
      : [...filters.labels, label];
    onFiltersChange({ ...filters, labels: newLabels });
  };

  const clearFilters = () => {
    onFiltersChange({
      priority: "all",
      labels: [],
      assignedTo: "",
    });
  };

  const hasActiveFilters =
    filters.priority !== "all" ||
    filters.labels.length > 0 ||
    filters.assignedTo !== "";

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Prioridade:</span>
        <Select
          value={filters.priority}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, priority: value })
          }
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Labels Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Etiquetas:</span>
        <div className="flex flex-wrap gap-1">
          {LABELS.map((label) => {
            const config = LABEL_CONFIG[label];
            const isActive = filters.labels.includes(label);
            return (
              <Badge
                key={label}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs transition-all",
                  isActive && config?.bgColor,
                  isActive && config?.color
                )}
                onClick={() => toggleLabel(label)}
              >
                {config?.label || label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
