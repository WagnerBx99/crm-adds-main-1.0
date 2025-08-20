import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Eye, 
  Copy, 
  Printer, 
  Archive,
  Calendar,
  Plus,
  ChevronDown,
  User,
  Zap,
  Tag,
  Tags,
  Hash,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Order, Priority, Status, Label as OrderLabel } from '@/types';
import { cn } from '@/lib/utils';
import { labelColors, labelNames, orderTypeColors, orderTypeNames } from '@/lib/data';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderDetailsDialog from './OrderDetailsDialog';
import { useKanban } from '@/contexts/KanbanContext';

interface ModernKanbanCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: Status) => void;
  onUpdateOrder?: (orderId: string, updatedData: Partial<Order>) => void;
  activeFilterLabel?: OrderLabel;
}

// Configuração de prioridades compacta - apenas 2 níveis
const priorityConfig = {
  'normal': { 
    color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', 
    label: 'Normal',
    bgColor: 'bg-gray-500',
    dot: 'bg-gray-500'
  },
  'high': { 
    color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', 
    label: 'Alta',
    bgColor: 'bg-red-500',
    dot: 'bg-red-500'
  }
};

// Todas as opções de etiquetas disponíveis
const allLabels: OrderLabel[] = [
  'BOLETO',
  'AGUARDANDO_PAGAMENTO', 
  'PEDIDO_CANCELADO',
  'APROV_AGUARDANDO_PAGAMENTO',
  'AMOSTRAS',
  'PAGO',
  'ORCAMENTO_PUBLICO'
];

// Opções de status/etapas do pipeline
const statusOptions: { value: Status; label: string; color: string }[] = [
  { value: 'FAZER', label: 'A Fazer', color: 'text-gray-700' },
  { value: 'AJUSTE', label: 'Ajuste', color: 'text-orange-700' },
  { value: 'APROVACAO', label: 'Aprovação', color: 'text-blue-700' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação', color: 'text-yellow-700' },
  { value: 'APROVADO', label: 'Aprovado', color: 'text-green-700' },
  { value: 'ARTE_APROVADA', label: 'Arte Aprovada', color: 'text-teal-700' },
  { value: 'PRODUCAO', label: 'Produção', color: 'text-purple-700' },
  { value: 'EXPEDICAO', label: 'Expedição', color: 'text-indigo-700' }
];

export default function ModernKanbanCard({ 
  order, 
  onUpdateStatus,
  onUpdateOrder,
  activeFilterLabel
}: ModernKanbanCardProps) {
  const { dispatch } = useKanban();
  const [isHovering, setIsHovering] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Estados para edição inline
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingLabels, setIsEditingLabels] = useState(false);
  const [labelsCloseTimeout, setLabelsCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper para normalizar prioridades antigas
  const normalizePriority = (priority: any): Priority => {
    if (priority === 'low' || priority === 'medium') {
      return 'normal';
    }
    if (priority === 'high') {
      return 'high';
    }
    return 'normal'; // fallback padrão
  };

  const normalizedPriority = normalizePriority(order.priority);
  const hasActiveFilterLabel = activeFilterLabel && order.labels?.includes(activeFilterLabel);

  // Handlers das ações do menu
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsDialog(true);
    toast.info('Abrindo detalhes do pedido...', { duration: 1000 });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Criar uma cópia do pedido com novo ID e data
      const duplicatedOrder: Order = {
        ...order,
        id: `${order.id}-copy-${Date.now()}`,
        title: `${order.title} (Cópia)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'FAZER', // Sempre volta para o início do processo
        history: [
          {
            id: `history-${Date.now()}`,
            date: new Date(),
            status: 'FAZER',
            user: 'Sistema',
            comment: 'Pedido duplicado'
          }
        ]
      };

      // Adicionar ao contexto usando dispatch
      dispatch({
        type: 'ADD_ORDER',
        payload: duplicatedOrder
      });
      
      toast.success('Pedido duplicado com sucesso!', { 
        duration: 2000,
        description: `"${order.title}" foi duplicado e está na coluna "A Fazer"`
      });
    } catch (error) {
      console.error('Erro ao duplicar pedido:', error);
      toast.error('Erro ao duplicar pedido');
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Criar conteúdo profissional para impressão
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ficha do Pedido - ${order.id}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.4; 
              color: #333;
              background: #fff;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            
            /* Header */
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: start;
              padding: 20px 0;
              border-bottom: 3px solid #3b82f6;
              margin-bottom: 30px;
            }
            .logo-section h1 { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1e40af;
              margin-bottom: 5px;
            }
            .logo-section p { 
              color: #6b7280; 
              font-size: 14px;
            }
            .document-info { 
              text-align: right; 
              font-size: 12px;
              color: #6b7280;
            }
            .document-info .doc-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            
            /* Grid System */
            .grid { display: grid; gap: 20px; margin-bottom: 25px; }
            .grid-2 { grid-template-columns: 1fr 1fr; }
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            
            /* Cards */
            .card { 
              background: #f9fafb; 
              border: 1px solid #e5e7eb;
              border-radius: 8px; 
              padding: 20px;
            }
            .card-header { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .card-header::before {
              content: "📄";
              font-size: 18px;
            }
            .card-header.status::before { content: "📊"; }
            .card-header.client::before { content: "👤"; }
            .card-header.priority::before { content: "⭐"; }
            .card-header.dates::before { content: "📅"; }
            .card-header.labels::before { content: "🏷️"; }
            
            /* Field Groups */
            .field-group { margin-bottom: 12px; }
            .field-label { 
              font-size: 12px; 
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
              display: block;
            }
            .field-value { 
              font-size: 14px; 
              color: #1f2937;
              font-weight: 500;
            }
            .field-value.large {
              font-size: 18px;
              font-weight: bold;
            }
            
            /* Badges */
            .badge { 
              display: inline-block;
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 11px; 
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 2px;
            }
            .badge.high { background: #fee2e2; color: #dc2626; }
            .badge.normal { background: #f3f4f6; color: #6b7280; }
            .badge.status { background: #dbeafe; color: #1d4ed8; }
            .badge.label { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
            
            /* Description */
            .description { 
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              border-radius: 0 6px 6px 0;
              font-style: italic;
              color: #475569;
            }
            
            /* Footer */
            .footer { 
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
            }
            
            /* Print Styles */
            @media print { 
              body { margin: 0; }
              .container { max-width: none; padding: 15px; }
              .header { margin-bottom: 20px; }
              .card { break-inside: avoid; margin-bottom: 15px; }
            }

            /* Address styling */
            .address-block {
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              padding: 12px;
              border-radius: 0 6px 6px 0;
              margin: 5px 0;
              line-height: 1.6;
            }
            .highlight-field {
              background: #fef3c7;
              border-left: 3px solid #f59e0b;
              padding: 8px;
              margin: 5px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                <h1>ADDS Sistema</h1>
                <p>Gestão de Pedidos & Produção</p>
              </div>
              <div class="document-info">
                <div class="doc-title">FICHA DO PEDIDO</div>
                <div>Impresso em: ${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}</div>
                <div>ID: ${order.id}</div>
              </div>
            </div>
            
            <!-- Informações Principais -->
            <div class="grid grid-2">
              <!-- Dados do Pedido -->
              <div class="card">
                <div class="card-header">Dados do Pedido</div>
                <div class="field-group">
                  <span class="field-label">Título</span>
                  <div class="field-value large">${order.title}</div>
                </div>
                <div class="field-group">
                  <span class="field-label">Status Atual</span>
                  <div class="field-value">
                    <span class="badge status">${statusOptions.find(s => s.value === order.status)?.label || order.status}</span>
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Prioridade</span>
                  <div class="field-value">
                    <span class="badge ${normalizedPriority}">${priorityConfig[normalizedPriority].label}</span>
                  </div>
                </div>
              </div>
              
              <!-- Dados do Cliente -->
              <div class="card">
                <div class="card-header client">Dados do Cliente</div>
                <div class="field-group">
                  <span class="field-label">Nome/Razão Social</span>
                  <div class="field-value">${order.customer?.name || 'Não informado'}</div>
                </div>
                <div class="field-group">
                  <span class="field-label">Empresa</span>
                  <div class="field-value">${order.customer?.company || 'Não informado'}</div>
                </div>
                <div class="field-group">
                  <span class="field-label">Endereço Completo</span>
                  <div class="field-value">
                    ${order.customer?.address ? `
                      <div class="address-block">
                        <strong>${order.customer.address}${order.customer.number ? `, ${order.customer.number}` : ''}</strong><br>
                        ${order.customer.neighborhood ? `<strong>Bairro:</strong> ${order.customer.neighborhood}<br>` : ''}
                        <strong>Cidade:</strong> ${order.customer.city || 'Não informado'}${order.customer.state ? ` - <strong>Estado:</strong> ${order.customer.state}` : ''}<br>
                        ${order.customer.zipCode ? `<strong>CEP:</strong> ${order.customer.zipCode}` : ''}
                      </div>
                    ` : '<span style="color: #9ca3af; font-style: italic;">Endereço não informado</span>'}
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Tipo de Pessoa</span>
                  <div class="field-value">${order.customer?.personType || 'Não informado'}</div>
                </div>
                ${order.customer?.document ? `
                <div class="field-group">
                  <span class="field-label">Documento (CPF/CNPJ)</span>
                  <div class="field-value">${order.customer.document}</div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Detalhes do Produto e Personalização -->
            <div class="grid grid-2">
              <!-- Produtos -->
              <div class="card">
                <div class="card-header">📦 Produtos Solicitados</div>
                ${order.products && order.products.length > 0 ? 
                  order.products.map(product => `
                    <div class="field-group">
                      <span class="field-label">Produto</span>
                      <div class="field-value">${product.name}</div>
                    </div>
                    <div class="field-group">
                      <span class="field-label">Quantidade</span>
                      <div class="field-value">${product.quantity} unidades</div>
                    </div>
                  `).join('<hr style="margin: 10px 0; border: 1px solid #e5e7eb;">') :
                  '<div class="field-value" style="color: #9ca3af; font-style: italic;">Nenhum produto especificado</div>'
                }
              </div>
              
              <!-- Personalização -->
              <div class="card">
                <div class="card-header">🎨 Detalhes da Personalização</div>
                ${order.personalizationDetails ? `
                  <div class="field-group">
                    <span class="field-label">Especificações Técnicas</span>
                    <div class="field-value" style="white-space: pre-line; line-height: 1.5;">${formatCustomizationDetails(order.personalizationDetails)}</div>
                  </div>
                ` : ''}
                ${order.customerDetails ? `
                  <div class="field-group">
                    <span class="field-label">Observações do Cliente</span>
                    <div class="field-value" style="white-space: pre-line; line-height: 1.5;">${formatCustomizationDetails(order.customerDetails)}</div>
                  </div>
                ` : ''}
                ${!order.personalizationDetails && !order.customerDetails ? 
                  '<div class="field-value" style="color: #9ca3af; font-style: italic;">Nenhuma personalização especificada</div>' : ''
                }
              </div>
            </div>
            
            <!-- Descrição/Observações Gerais -->
            ${order.description ? `
            <div class="card">
              <div class="card-header">📝 Descrição e Observações Gerais</div>
              <div class="description">${formatCustomizationDetails(order.description)}</div>
            </div>
            ` : ''}
            
            <!-- Datas e Classificações -->
            <div class="grid grid-2">
              <!-- Cronograma -->
              <div class="card">
                <div class="card-header dates">📅 Cronograma do Pedido</div>
                <div class="field-group">
                  <span class="field-label">Data de Abertura</span>
                  <div class="field-value">${format(new Date(order.createdAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}</div>
                </div>
                <div class="field-group">
                  <span class="field-label">Última Atualização</span>
                  <div class="field-value">${format(new Date(order.updatedAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}</div>
                </div>
                ${order.dueDate ? `
                <div class="field-group">
                  <span class="field-label">⏰ Prazo de Entrega</span>
                  <div class="field-value" style="font-weight: bold; color: #dc2626;">${format(new Date(order.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
                ` : ''}
                ${order.startDate ? `
                <div class="field-group">
                  <span class="field-label">Data de Início</span>
                  <div class="field-value">${format(new Date(order.startDate), 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
                ` : ''}
              </div>
              
              <!-- Classificações e Tags -->
              <div class="card">
                <div class="card-header labels">🏷️ Classificações e Marcadores</div>
                <div class="field-group">
                  <span class="field-label">Etiquetas Aplicadas</span>
                  <div class="field-value">
                    ${order.labels && order.labels.length > 0 ? 
                      order.labels.map(label => `<span class="badge label">${labelNames[label]}</span>`).join(' ') :
                      '<span style="color: #9ca3af; font-style: italic;">Nenhuma etiqueta aplicada</span>'
                    }
                  </div>
                </div>
                ${order.orderType ? `
                <div class="field-group">
                  <span class="field-label">Tipo de Pedido</span>
                  <div class="field-value" style="font-weight: 600;">${order.orderType}</div>
                </div>
                ` : ''}
                ${order.assignedTo ? `
                <div class="field-group">
                  <span class="field-label">Responsável Técnico</span>
                  <div class="field-value">${order.assignedTo}</div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>Esta ficha foi gerada automaticamente pelo Sistema ADDS</p>
              <p>Para mais informações, acesse o sistema ou entre em contato com a equipe de suporte</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Abrir janela de impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Aguardar carregamento e imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
        
        toast.success('Ficha do pedido enviada para impressão!', { 
          duration: 2000,
          description: `Ficha profissional de "${order.title}" preparada`
        });
      } else {
        toast.error('Não foi possível abrir a janela de impressão');
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao preparar impressão da ficha');
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!onUpdateOrder) {
      toast.error('Função de arquivamento não disponível');
      return;
    }

    // Implementar arquivamento usando campos existentes do Order
    const archivedData: Partial<Order> = {
      status: 'EXPEDICAO', // Mover para status final como "arquivado"
      updatedAt: new Date(),
      history: [
        ...(order.history || []),
        {
          id: `history-${Date.now()}`,
          date: new Date(),
          status: 'EXPEDICAO',
          user: 'Sistema',
          comment: 'Pedido arquivado'
        }
      ]
    };

    onUpdateOrder(order.id, archivedData);
    
    toast.success('Pedido arquivado!', { 
      duration: 2000,
      description: `"${order.title}" foi movido para expedição (arquivado)`
    });
  };

  // Handler para adicionar etiqueta rápida
  const handleQuickAddLabel = (label: OrderLabel) => {
    if (!onUpdateOrder) return;
    
    const currentLabels = order.labels || [];
    if (currentLabels.includes(label)) {
      toast.info(`Etiqueta "${labelNames[label]}" já existe`);
      return;
    }
    
    const newLabels = [...currentLabels, label];
    onUpdateOrder(order.id, { labels: newLabels });
    
    toast.success(`+ ${labelNames[label]}`, { duration: 1500 });
  };

  // Handler para remover etiqueta rápida
  const handleQuickRemoveLabel = (label: OrderLabel) => {
    if (!onUpdateOrder) return;
    
    const currentLabels = order.labels || [];
    const newLabels = currentLabels.filter(l => l !== label);
    
    onUpdateOrder(order.id, { labels: newLabels });
    toast.success(`- ${labelNames[label]}`, { duration: 1500 });
  };

  // Handler para clique no card
  const handleCardClick = () => {
    setShowDetailsDialog(true);
  };

  // Handlers para edição de prioridade
  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingPriority(true);
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (onUpdateOrder && newPriority !== order.priority) {
      onUpdateOrder(order.id, { priority: newPriority });
      toast.success(`Prioridade: ${priorityConfig[newPriority].label}`, { duration: 1500 });
    }
    setIsEditingPriority(false);
  };

  const handlePriorityOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditingPriority(false);
    }
  };

  // Handlers para edição de etiquetas
  const handleLabelsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabels(true);
    
    if (labelsCloseTimeout) {
      clearTimeout(labelsCloseTimeout);
      setLabelsCloseTimeout(null);
    }
  };

  const handleLabelToggle = (label: OrderLabel, checked: boolean) => {
    if (!onUpdateOrder) return;
    
    const currentLabels = order.labels || [];
    const newLabels = checked 
      ? [...currentLabels, label]
      : currentLabels.filter(l => l !== label);
    
    onUpdateOrder(order.id, { labels: newLabels });
    
    const action = checked ? '+' : '-';
    toast.success(`${action} ${labelNames[label]}`, { duration: 1000 });

    if (labelsCloseTimeout) {
      clearTimeout(labelsCloseTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsEditingLabels(false);
    }, 1500);
    
    setLabelsCloseTimeout(timeout);
  };

  const handleLabelsOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditingLabels(false);
      if (labelsCloseTimeout) {
        clearTimeout(labelsCloseTimeout);
        setLabelsCloseTimeout(null);
      }
    }
  };

  // Handler para mudança de status/etapa
  const handleChangeStatus = (newStatus: Status) => {
    if (newStatus === order.status) {
      toast.info('Este pedido já está nesta etapa');
      return;
    }
    
    onUpdateStatus(order.id, newStatus);
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
    
    toast.success(`Movido para: ${statusLabel}`, { 
      duration: 2000,
      description: `"${order.title}" foi movido para ${statusLabel}`
    });
  };

  // Processar e traduzir detalhes de personalização
  const formatCustomizationDetails = (description: string) => {
    if (!description) return '';
    
    return description
      .replace(/📋 Orçamento público recebido em/g, '📋 Solicitação recebida em')
      .replace(/🛍️ Produto:/g, '🛍️ Produto Solicitado:')
      .replace(/🎨 Personalização:/g, '🎨 Detalhes da Personalização:')
      .replace(/Product:/g, 'Produto:')
      .replace(/Customization:/g, 'Personalização:')
      .replace(/quantity:/g, 'Quantidade:')
      .replace(/color:/g, 'Cor:')
      .replace(/size:/g, 'Tamanho:')
      .replace(/material:/g, 'Material:')
      .replace(/finish:/g, 'Acabamento:')
      .replace(/text:/g, 'Texto:')
      .replace(/font:/g, 'Fonte:')
      .replace(/position:/g, 'Posição:')
      .replace(/design:/g, 'Design:')
      .replace(/logo:/g, 'Logo:')
      .replace(/image:/g, 'Imagem:')
      .replace(/notes:/g, 'Observações:')
      .replace(/dimensions:/g, 'Dimensões:')
      .replace(/weight:/g, 'Peso:')
      .replace(/delivery:/g, 'Entrega:')
      .replace(/deadline:/g, 'Prazo:')
      .replace(/budget:/g, 'Orçamento:')
      .replace(/price:/g, 'Preço:');
  };

  return (
    <>
      <Card
        className={cn(
          "group relative bg-white border border-gray-200/60 cursor-grab active:cursor-grabbing",
          "kanban-card-ultra-optimized kanban-performance-ultra",
          // Hover otimizado com transições fluidas
          "hover:border-blue-200/80 hover:shadow-lg hover:shadow-blue-100/40",
          // Estados de filtro ativo
          hasActiveFilterLabel && "ring-1 ring-blue-400/30 border-blue-300/60 bg-blue-50/20",
          // Focus melhorado para acessibilidade
          "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1"
          // REMOVIDO: overflow-hidden - causava nested scroll container
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Container principal ultra-compacto */}
        <div className="p-3 space-y-2.5">
          
          {/* Header: Prioridade + Menu (linha super compacta) */}
          <div className="flex items-center justify-between">
            {/* Prioridade compacta */}
            <div className="flex items-center gap-1.5">
              {isEditingPriority ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={normalizedPriority}
                    onValueChange={handlePriorityChange}
                    onOpenChange={handlePriorityOpenChange}
                  >
                    <SelectTrigger className="h-6 text-xs px-2 w-20 border-0 bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 cursor-pointer group/priority"
                  onClick={handlePriorityClick}
                  title="Clique para editar"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-all duration-200",
                    priorityConfig[normalizedPriority].dot,
                    normalizedPriority === 'high' && "ring-1 ring-red-200"
                  )} />
                  <span className={cn(
                    "text-xs font-medium transition-colors duration-200",
                    normalizedPriority === 'high' ? 'text-red-700' : 'text-gray-700',
                    "group-hover/priority:underline"
                  )}>
                    {priorityConfig[normalizedPriority].label}
                  </span>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-1">
              {/* Botão de detalhes */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  isHovering && "opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailsDialog(true);
                }}
                title="Ver detalhes do pedido"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              
              {/* Menu de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200",
                      "opacity-0 group-hover:opacity-100",
                      isHovering && "opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpen} className="text-sm py-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Abrir Detalhes
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleDuplicate} className="text-sm py-2">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar Pedido
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handlePrint} className="text-sm py-2">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Ficha
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Submenu de Mudança de Etapa */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-sm py-2">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Mudar Etapa
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <div className="p-1">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2 uppercase tracking-wide">
                        Mover para:
                      </div>
                      {statusOptions.map(status => (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => handleChangeStatus(status.value)}
                          disabled={status.value === order.status}
                          className={cn(
                            "text-sm py-2 cursor-pointer flex items-center justify-between",
                            status.value === order.status && "opacity-50 cursor-not-allowed bg-gray-50",
                            status.color
                          )}
                        >
                          <span>{status.label}</span>
                          {status.value === order.status && (
                            <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0 ml-2">
                              Atual
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Submenu de Etiquetas */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-sm py-2">
                    <Tags className="h-4 w-4 mr-2" />
                    Gerenciar Etiquetas
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                        Adicionar Etiquetas
                      </div>
                      {allLabels.filter(label => !order.labels?.includes(label)).map(label => (
                        <DropdownMenuItem
                          key={label}
                          onClick={() => handleQuickAddLabel(label)}
                          className="text-sm py-1.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          <span 
                            className={cn(
                              "text-xs px-2 py-1 rounded mr-2",
                              labelColors[label]
                            )}
                          >
                            {labelNames[label]}
                          </span>
                        </DropdownMenuItem>
                      ))}
                      
                      {order.labels && order.labels.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                            Remover Etiquetas
                          </div>
                          {order.labels.map(label => (
                            <DropdownMenuItem
                              key={label}
                              onClick={() => handleQuickRemoveLabel(label)}
                              className="text-sm py-1.5 cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-2" />
                              <span 
                                className={cn(
                                  "text-xs px-2 py-1 rounded mr-2",
                                  labelColors[label]
                                )}
                              >
                                {labelNames[label]}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      
                      {allLabels.filter(label => !order.labels?.includes(label)).length === 0 && (
                        <div className="text-xs text-gray-500 italic py-2">
                          Todas as etiquetas já foram adicionadas
                        </div>
                      )}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Submenu de Tags Rápidas */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-sm py-2">
                    <Tag className="h-4 w-4 mr-2" />
                    Prioridade Rápida
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuItem
                      onClick={() => onUpdateOrder && onUpdateOrder(order.id, { priority: 'high' })}
                      className="text-sm py-2 text-red-700 hover:bg-red-50"
                    >
                      <Hash className="h-3 w-3 mr-2" />
                      Marcar como Alta
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateOrder && onUpdateOrder(order.id, { priority: 'normal' })}
                      className="text-sm py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Hash className="h-3 w-3 mr-2" />
                      Marcar como Normal
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleArchive} 
                  className="text-sm py-2 text-gray-600 hover:bg-gray-50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar Pedido
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {/* Título ultra-compacto */}
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {order.title}
            </h3>
            
            {/* Cliente compacto */}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate font-medium">
                {order.customer?.name || 'Cliente não informado'}
              </span>
            </div>
          </div>

          {/* Etiquetas + Data (linha híbrida compacta) */}
          <div className="flex items-center justify-between gap-2">
            {/* Etiquetas compactas */}
            <div className="flex-1 min-w-0">
              {isEditingLabels ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu onOpenChange={handleLabelsOpenChange}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 text-xs px-2 border-dashed">
                        <Plus className="h-3 w-3 mr-1" />
                        Tags
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <div className="p-2 space-y-1">
                        {allLabels.map(label => (
                          <div key={label} className="flex items-center space-x-2">
                            <Checkbox
                              id={label}
                              checked={order.labels?.includes(label)}
                              onCheckedChange={(checked) => handleLabelToggle(label, checked as boolean)}
                              className="h-3 w-3"
                            />
                            <label 
                              htmlFor={label}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded cursor-pointer truncate flex-1",
                                labelColors[label]
                              )}
                            >
                              {labelNames[label]}
                            </label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {order.labels && order.labels.length > 0 ? (
                    <>
                      {order.labels.slice(0, 2).map(label => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className={cn(
                            "text-xs px-1.5 py-0 h-5 rounded border-0 font-normal cursor-pointer transition-all duration-200 hover:scale-105",
                            labelColors[label],
                            hasActiveFilterLabel && activeFilterLabel === label && "ring-1 ring-current ring-opacity-50"
                          )}
                          onClick={handleLabelsClick}
                        >
                          {labelNames[label]}
                        </Badge>
                      ))}
                      {order.labels.length > 2 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1.5 py-0 h-5 rounded border-0 bg-gray-100 text-gray-600 cursor-pointer hover:scale-105 transition-all duration-200"
                          onClick={handleLabelsClick}
                        >
                          +{order.labels.length - 2}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs px-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      onClick={handleLabelsClick}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tags
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Data ultra-compacta */}
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              <Calendar className="h-3 w-3" />
              <span className="font-mono">
                {format(new Date(order.createdAt), 'dd/MM', { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de filtro ativo ultra-compacto */}
        {hasActiveFilterLabel && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-sm animate-pulse">
            <div className="absolute inset-0.5 bg-white rounded-full" />
          </div>
        )}

        {/* Hover indicator */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300",
          isHovering ? "opacity-100" : "opacity-0"
        )} />
      </Card>

      {/* Dialog de Detalhes */}
      <OrderDetailsDialog
        order={order}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onUpdateOrder={onUpdateOrder || (() => {})}
        onUpdateStatus={onUpdateStatus}
      />
    </>
  );
} 