"use client";

import { useState, useEffect } from "react";
import type { Order, Customer, OrderStatus, Priority, Label, OrderType } from "@/lib/types";
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { ordersApi, customersApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  X,
} from "lucide-react";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  initialData?: Partial<Order>;
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

const ORDER_TYPES: OrderType[] = ["NOVO", "REPOSICAO", "AMOSTRA", "ORCAMENTO"];

export function OrderForm({ open, onClose, onSave, initialData }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [status, setStatus] = useState<OrderStatus>(initialData?.status || "FAZER");
  const [priority, setPriority] = useState<Priority>(initialData?.priority || "normal");
  const [orderType, setOrderType] = useState<OrderType | "">(initialData?.orderType || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  );
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(initialData?.labels || []);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customersApi.getAll({ limit: 100 });
        setCustomers(response.data);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    };
    loadCustomers();
  }, []);

  // Filter customers by search
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.company?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Titulo e obrigatorio");
      return;
    }

    if (!customerId) {
      toast.error("Selecione um cliente");
      return;
    }

    setLoading(true);
    try {
      const data = {
        title,
        description,
        customerId,
        status,
        priority,
        orderType: orderType || undefined,
        dueDate: dueDate?.toISOString(),
        labels: selectedLabels,
      };

      let result: Order;
      if (initialData?.id) {
        result = await ordersApi.update(initialData.id, data);
        toast.success("Pedido atualizado com sucesso");
      } else {
        result = await ordersApi.create(data);
        toast.success("Pedido criado com sucesso");
      }

      onSave(result);
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Editar Pedido" : "Novo Pedido"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <UILabel htmlFor="title">Titulo *</UILabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do pedido"
              />
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <UILabel>Cliente *</UILabel>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? selectedCustomer.name : "Selecionar cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar cliente..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => {
                              setCustomerId(customer.id);
                              setCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customerId === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p>{customer.name}</p>
                              {customer.company && (
                                <p className="text-xs text-muted-foreground">
                                  {customer.company}
                                </p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <UILabel htmlFor="description">Descricao</UILabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do pedido..."
                rows={3}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <UILabel>Status</UILabel>
                <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <UILabel>Prioridade</UILabel>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Type and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <UILabel>Tipo de Pedido</UILabel>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <UILabel>Data de Entrega</UILabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <UILabel>Etiquetas</UILabel>
              <div className="flex flex-wrap gap-2">
                {LABELS.map((label) => {
                  const config = LABEL_CONFIG[label];
                  const isSelected = selectedLabels.includes(label);
                  return (
                    <Badge
                      key={label}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && config?.bgColor,
                        isSelected && config?.color
                      )}
                      onClick={() => toggleLabel(label)}
                    >
                      {isSelected && <Check className="mr-1 h-3 w-3" />}
                      {config?.label || label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Salvar" : "Criar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
