"use client";

import { useState } from "react";
import type { Order, OrderStatus, Comment } from "@/lib/types";
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { ordersApi } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Building2,
  MessageSquare,
  Paperclip,
  History,
  Edit2,
  Send,
  X,
  AlertTriangle,
  CheckCircle,
  Image,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderDetailsProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onUpdate: (order: Order) => void;
}

export function OrderDetails({ order, open, onClose, onUpdate }: OrderDetailsProps) {
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const statusConfig = STATUS_CONFIG[order.status];
  const priorityConfig = PRIORITY_CONFIG[order.priority];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setChangingStatus(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, newStatus);
      onUpdate(updated);
      toast.success(`Status alterado para ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      toast.error("Erro ao alterar status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      const updated = await ordersApi.addComment(order.id, newComment);
      onUpdate(updated);
      setNewComment("");
      toast.success("Comentario adicionado");
    } catch (error) {
      toast.error("Erro ao adicionar comentario");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl pr-8">{order.title}</SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn(statusConfig?.bgColor, statusConfig?.color)}>
                  {statusConfig?.label}
                </Badge>
                {order.priority === "high" && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Urgente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start px-6 py-0 h-12 bg-transparent border-b rounded-none">
              <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Comentarios ({order.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Historico
              </TabsTrigger>
              <TabsTrigger value="artwork" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Artes
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="p-6 space-y-6">
              {/* Status Change */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={order.status}
                  onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                  disabled={changingStatus}
                >
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

              {/* Customer Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {order.customer?.name?.slice(0, 2).toUpperCase() || "CL"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.customer?.name}</p>
                    {order.customer?.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {order.customer.company}
                      </p>
                    )}
                    {order.customer?.email && (
                      <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {order.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descricao</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {order.description}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {order.dueDate && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Entrega</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(order.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Labels */}
              {order.labels && order.labels.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex flex-wrap gap-2">
                    {order.labels.map((label) => {
                      const config = LABEL_CONFIG[label];
                      return (
                        <Badge
                          key={label}
                          className={cn(config?.bgColor, config?.color)}
                        >
                          {config?.label || label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {order.attachments && order.attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anexos</label>
                  <div className="space-y-2">
                    {order.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm flex-1 truncate">{att.name}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="p-6 space-y-4">
              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || sendingComment}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Comentario
              </Button>

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {order.comments?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum comentario ainda
                  </p>
                )}
                {order.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.userName?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-6">
              <div className="space-y-4">
                {order.history?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum historico ainda
                  </p>
                )}
                {order.history?.map((entry, index) => (
                  <div key={entry.id || index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <History className="h-4 w-4" />
                      </div>
                      {index < (order.history?.length || 0) - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{entry.action}</p>
                      {entry.from && entry.to && (
                        <p className="text-xs text-muted-foreground">
                          {STATUS_CONFIG[entry.from as OrderStatus]?.label || entry.from} →{" "}
                          {STATUS_CONFIG[entry.to as OrderStatus]?.label || entry.to}
                        </p>
                      )}
                      {entry.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.userName && `${entry.userName} - `}
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Artwork Tab */}
            <TabsContent value="artwork" className="p-6">
              <div className="space-y-4">
                {(!order.artworkImages || order.artworkImages.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma arte enviada ainda
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {order.artworkImages?.map((art) => (
                    <div
                      key={art.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={art.url}
                        alt={art.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" asChild>
                          <a href={art.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir
                          </a>
                        </Button>
                      </div>
                      {art.status && (
                        <Badge
                          className={cn(
                            "absolute top-2 right-2",
                            art.status === "approved" && "bg-green-500",
                            art.status === "adjustment_requested" && "bg-yellow-500",
                            art.status === "pending" && "bg-gray-500"
                          )}
                        >
                          {art.status === "approved"
                            ? "Aprovada"
                            : art.status === "adjustment_requested"
                            ? "Ajuste"
                            : "Pendente"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {order.approvalLink && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <label className="text-sm font-medium">Link de Aprovacao</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs p-2 bg-background rounded truncate">
                        {order.approvalLink}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(order.approvalLink || "");
                          toast.success("Link copiado!");
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
