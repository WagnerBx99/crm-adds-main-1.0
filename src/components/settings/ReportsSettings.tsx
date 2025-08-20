import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  FileText, 
  Calendar as CalendarIcon, 
  Download, 
  Plus, 
  Settings, 
  Clock, 
  Users, 
  Package,
  BarChart2,
  Activity,
  TrendingUp,
  ListFilter,
  Search,
  Save,
  RefreshCw,
  ChevronDown,
  Filter,
  Eye,
  Copy,
  Mail,
  Trash,
  Edit,
  X,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  DollarSign,
  Layers,
  PanelLeft,
  Move,
  Table,
  Share2,
  Sliders,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  FileCog,
  FileSpreadsheet,
  FileType,
  FileJson,
  HelpCircle,
  Smartphone,
  Laptop,
  Loader2,
  LayoutDashboard,
  ArrowUpDown,
  ChevronsUpDown,
  Tag,
  Workflow,
  Radar,
  Info,
  MoreHorizontal,
  Cloud,
  Shield,
  Printer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { addDays, format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { UserRole, User, Status, Label as LabelType } from '@/types';
import { userService } from '@/lib/services/userService';
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Tipos
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterOperator = 'AND' | 'OR';

type FilterCondition = {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
};

type Filter = {
  id: string;
  name: string;
  dateRange?: DateRange;
  conditions: FilterCondition[];
  operator: FilterOperator;
  favorite?: boolean;
};

type ReportFrequency = 'diário' | 'semanal' | 'mensal' | 'sob demanda';
type ReportType = 'vendas' | 'estoque' | 'clientes' | 'financeiro' | 'produção' | 'desempenho' | 'kanban' | 'status' | 'leadTime' | 'aprovacao' | 'retrabalho' | 'topClientes' | 'produtosMaisVendidos' | 'produtividade' | 'atrasados';
type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html' | 'json';
type ReportStatus = 'ativo' | 'inativo';
type VisualizationType = 'line' | 'bar' | 'pie' | 'donut' | 'radar' | 'table' | 'gauge' | 'card' | 'kpi' | 'stackedBar' | 'heatmap' | 'gantt';

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  lastGenerated?: Date;
  nextScheduled?: Date;
  status: ReportStatus;
  configuration: {
    visualization: VisualizationType;
    filters: Filter;
    dateRange?: {
      from?: Date;
      to?: Date;
      preset?: string;
    };
    groupBy?: string[];
    metrics: string[];
    columns?: string[];
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    }[];
  };
}

interface DashboardWidget {
  id: string;
  reportId: string;
  position: { x: number, y: number, w: number, h: number };
  title: string;
  type: VisualizationType;
  filters?: Filter;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  icon: React.ElementType;
  defaultVisualization: VisualizationType;
  supportedVisualizations: VisualizationType[];
  availableMetrics: { id: string, name: string }[];
  availableColumns: { id: string, name: string }[];
  availableGroupBy: { id: string, name: string }[];
  requiredFilters?: string[];
}

interface ExportJob {
  id: string;
  reportIds: string[];
  formats: ReportFormat[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  userId: string;
  userName: string;
}

interface ReportUsageLog {
  id: string;
  reportId: string;
  reportName: string;
  action: 'view' | 'export' | 'schedule' | 'edit' | 'delete';
  timestamp: Date;
  userId: string;
  userName: string;
  details?: {
    format?: ReportFormat;
    filters?: any;
  };
}

// Dados de exemplo para filtros
const predefinedDateRanges = [
  { id: 'today', name: 'Hoje', getValue: () => ({ from: new Date(), to: new Date() }) },
  { id: 'yesterday', name: 'Ontem', getValue: () => { 
    const yesterday = subDays(new Date(), 1);
    return { from: yesterday, to: yesterday };
  }},
  { id: 'thisWeek', name: 'Esta Semana', getValue: () => ({ 
    from: startOfWeek(new Date(), { locale: ptBR }), 
    to: endOfWeek(new Date(), { locale: ptBR }) 
  })},
  { id: 'last7Days', name: 'Últimos 7 Dias', getValue: () => ({ 
    from: subDays(new Date(), 6), 
    to: new Date() 
  })},
  { id: 'thisMonth', name: 'Este Mês', getValue: () => ({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })},
  { id: 'lastMonth', name: 'Último Mês', getValue: () => { 
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return { 
      from: startOfMonth(date), 
      to: endOfMonth(date) 
    };
  }},
  { id: 'yearToDate', name: 'Ano até a Data', getValue: () => ({ 
    from: startOfYear(new Date()), 
    to: new Date() 
  })},
  { id: 'custom', name: 'Personalizado', getValue: () => ({ from: undefined, to: undefined }) }
];

// Catálogo de relatórios padrão
const defaultReportTemplates: ReportTemplate[] = [
  {
    id: 'pedidos-periodo',
    name: 'Volume de Pedidos por Período',
    description: 'Acompanhe a evolução do volume de pedidos ao longo do tempo',
    type: 'vendas',
    icon: LineChart,
    defaultVisualization: 'line',
    supportedVisualizations: ['line', 'bar', 'table'],
    availableMetrics: [
      { id: 'count', name: 'Quantidade de Pedidos' },
      { id: 'valor_total', name: 'Valor Total' }
    ],
    availableColumns: [
      { id: 'data', name: 'Data' },
      { id: 'pedido_id', name: 'ID do Pedido' },
      { id: 'cliente', name: 'Cliente' },
      { id: 'produto', name: 'Produto' },
      { id: 'valor', name: 'Valor' }
    ],
    availableGroupBy: [
      { id: 'dia', name: 'Por Dia' },
      { id: 'semana', name: 'Por Semana' },
      { id: 'mes', name: 'Por Mês' },
      { id: 'produto', name: 'Por Produto' },
      { id: 'cliente', name: 'Por Cliente' }
    ]
  },
  {
    id: 'distribuicao-status',
    name: 'Distribuição de Status',
    description: 'Visualize a distribuição percentual de pedidos por status',
    type: 'status',
    icon: PieChart,
    defaultVisualization: 'donut',
    supportedVisualizations: ['donut', 'pie', 'bar', 'table'],
    availableMetrics: [
      { id: 'count', name: 'Quantidade de Pedidos' },
      { id: 'percentual', name: 'Percentual' }
    ],
    availableColumns: [
      { id: 'status', name: 'Status' },
      { id: 'quantidade', name: 'Quantidade' },
      { id: 'percentual', name: 'Percentual (%)' }
    ],
    availableGroupBy: [
      { id: 'status', name: 'Por Status' },
      { id: 'etiqueta', name: 'Por Etiqueta' }
    ]
  },
  {
    id: 'lead-time-medio',
    name: 'Lead Time Médio por Etapa',
    description: 'Analise o tempo médio que os pedidos passam em cada etapa do Kanban',
    type: 'leadTime',
    icon: BarChart,
    defaultVisualization: 'bar',
    supportedVisualizations: ['bar', 'table', 'heatmap'],
    availableMetrics: [
      { id: 'tempo_medio', name: 'Tempo Médio (horas)' },
      { id: 'tempo_minimo', name: 'Tempo Mínimo (horas)' },
      { id: 'tempo_maximo', name: 'Tempo Máximo (horas)' }
    ],
    availableColumns: [
      { id: 'etapa', name: 'Etapa' },
      { id: 'tempo_medio', name: 'Tempo Médio (horas)' },
      { id: 'tempo_minimo', name: 'Tempo Mínimo (horas)' },
      { id: 'tempo_maximo', name: 'Tempo Máximo (horas)' }
    ],
    availableGroupBy: [
      { id: 'etapa', name: 'Por Etapa' },
      { id: 'produto', name: 'Por Produto' },
      { id: 'cliente', name: 'Por Cliente' }
    ]
  },
  {
    id: 'taxa-aprovacao',
    name: 'Taxa de Aprovação',
    description: 'Acompanhe a porcentagem de artes aprovadas na primeira tentativa',
    type: 'aprovacao',
    icon: CheckCircle2,
    defaultVisualization: 'gauge',
    supportedVisualizations: ['gauge', 'card', 'line', 'table'],
    availableMetrics: [
      { id: 'taxa_aprovacao', name: 'Taxa de Aprovação (%)' },
      { id: 'aprovacoes_primeira', name: 'Aprovações na Primeira Tentativa' },
      { id: 'total_aprovacoes', name: 'Total de Aprovações' }
    ],
    availableColumns: [
      { id: 'periodo', name: 'Período' },
      { id: 'taxa_aprovacao', name: 'Taxa de Aprovação (%)' },
      { id: 'aprovacoes_primeira', name: 'Aprovações na Primeira Tentativa' },
      { id: 'total_aprovacoes', name: 'Total de Aprovações' }
    ],
    availableGroupBy: [
      { id: 'dia', name: 'Por Dia' },
      { id: 'semana', name: 'Por Semana' },
      { id: 'mes', name: 'Por Mês' },
      { id: 'cliente', name: 'Por Cliente' },
      { id: 'produto', name: 'Por Produto' }
    ]
  },
  {
    id: 'retrabalho-ajustes',
    name: 'Retrabalho e Ajustes',
    description: 'Análise da quantidade de ajustes versus aprovações diretas',
    type: 'retrabalho',
    icon: Activity,
    defaultVisualization: 'stackedBar',
    supportedVisualizations: ['stackedBar', 'bar', 'table'],
    availableMetrics: [
      { id: 'aprovacoes_diretas', name: 'Aprovações Diretas' },
      { id: 'ajustes', name: 'Ajustes Realizados' },
      { id: 'media_ajustes', name: 'Média de Ajustes por Pedido' }
    ],
    availableColumns: [
      { id: 'periodo', name: 'Período' },
      { id: 'aprovacoes_diretas', name: 'Aprovações Diretas' },
      { id: 'ajustes', name: 'Ajustes Realizados' },
      { id: 'media_ajustes', name: 'Média de Ajustes por Pedido' }
    ],
    availableGroupBy: [
      { id: 'dia', name: 'Por Dia' },
      { id: 'semana', name: 'Por Semana' },
      { id: 'mes', name: 'Por Mês' },
      { id: 'cliente', name: 'Por Cliente' },
      { id: 'produto', name: 'Por Produto' },
      { id: 'responsavel', name: 'Por Responsável' }
    ]
  },
  {
    id: 'top-clientes',
    name: 'Top 10 Clientes',
    description: 'Identifique os clientes com maior número de pedidos ou faturamento',
    type: 'topClientes',
    icon: Users,
    defaultVisualization: 'bar',
    supportedVisualizations: ['bar', 'table', 'pie'],
    availableMetrics: [
      { id: 'quantidade_pedidos', name: 'Quantidade de Pedidos' },
      { id: 'valor_total', name: 'Valor Total (R$)' },
      { id: 'ticket_medio', name: 'Ticket Médio (R$)' }
    ],
    availableColumns: [
      { id: 'cliente', name: 'Cliente' },
      { id: 'quantidade_pedidos', name: 'Quantidade de Pedidos' },
      { id: 'valor_total', name: 'Valor Total (R$)' },
      { id: 'ticket_medio', name: 'Ticket Médio (R$)' }
    ],
    availableGroupBy: [
      { id: 'cliente', name: 'Por Cliente' },
      { id: 'regiao', name: 'Por Região' }
    ]
  },
  {
    id: 'produtos-personalizados',
    name: 'Produtos Mais Personalizados',
    description: 'Ranking de produtos por volume de personalização',
    type: 'produtosMaisVendidos',
    icon: Package,
    defaultVisualization: 'bar',
    supportedVisualizations: ['bar', 'table', 'pie'],
    availableMetrics: [
      { id: 'quantidade', name: 'Quantidade' },
      { id: 'percentual', name: 'Percentual (%)' },
      { id: 'valor_total', name: 'Valor Total (R$)' }
    ],
    availableColumns: [
      { id: 'produto', name: 'Produto' },
      { id: 'quantidade', name: 'Quantidade' },
      { id: 'percentual', name: 'Percentual (%)' },
      { id: 'valor_total', name: 'Valor Total (R$)' }
    ],
    availableGroupBy: [
      { id: 'produto', name: 'Por Produto' },
      { id: 'categoria', name: 'Por Categoria' }
    ]
  },
  {
    id: 'produtividade-colaborador',
    name: 'Produtividade por Colaborador',
    description: 'Pedidos concluídos por usuário no período',
    type: 'produtividade',
    icon: Radar,
    defaultVisualization: 'radar',
    supportedVisualizations: ['radar', 'bar', 'table'],
    availableMetrics: [
      { id: 'pedidos_concluidos', name: 'Pedidos Concluídos' },
      { id: 'tempo_medio', name: 'Tempo Médio de Conclusão (horas)' },
      { id: 'taxa_aprovacao', name: 'Taxa de Aprovação (%)' }
    ],
    availableColumns: [
      { id: 'colaborador', name: 'Colaborador' },
      { id: 'pedidos_concluidos', name: 'Pedidos Concluídos' },
      { id: 'tempo_medio', name: 'Tempo Médio de Conclusão (horas)' },
      { id: 'taxa_aprovacao', name: 'Taxa de Aprovação (%)' }
    ],
    availableGroupBy: [
      { id: 'colaborador', name: 'Por Colaborador' },
      { id: 'etapa', name: 'Por Etapa' },
      { id: 'produto', name: 'Por Produto' }
    ]
  },
  {
    id: 'pedidos-atrasados',
    name: 'Pedidos Atrasados',
    description: 'Lista detalhada de pedidos cujo prazo foi ultrapassado',
    type: 'atrasados',
    icon: AlertCircle,
    defaultVisualization: 'table',
    supportedVisualizations: ['table', 'bar'],
    availableMetrics: [
      { id: 'quantidade', name: 'Quantidade' },
      { id: 'dias_atraso', name: 'Dias de Atraso (média)' }
    ],
    availableColumns: [
      { id: 'pedido_id', name: 'ID do Pedido' },
      { id: 'cliente', name: 'Cliente' },
      { id: 'produto', name: 'Produto' },
      { id: 'prazo', name: 'Prazo' },
      { id: 'dias_atraso', name: 'Dias de Atraso' },
      { id: 'status', name: 'Status Atual' },
      { id: 'responsavel', name: 'Responsável' }
    ],
    availableGroupBy: [
      { id: 'status', name: 'Por Status' },
      { id: 'responsavel', name: 'Por Responsável' },
      { id: 'cliente', name: 'Por Cliente' }
    ]
  },
  {
    id: 'relatorio-financeiro',
    name: 'Relatório Financeiro',
    description: 'Receita estimada vs. realizada por período',
    type: 'financeiro',
    icon: DollarSign,
    defaultVisualization: 'line',
    supportedVisualizations: ['line', 'bar', 'table', 'kpi'],
    availableMetrics: [
      { id: 'receita_estimada', name: 'Receita Estimada (R$)' },
      { id: 'receita_realizada', name: 'Receita Realizada (R$)' },
      { id: 'diferenca', name: 'Diferença (R$)' },
      { id: 'diferenca_percentual', name: 'Diferença (%)' }
    ],
    availableColumns: [
      { id: 'periodo', name: 'Período' },
      { id: 'receita_estimada', name: 'Receita Estimada (R$)' },
      { id: 'receita_realizada', name: 'Receita Realizada (R$)' },
      { id: 'diferenca', name: 'Diferença (R$)' },
      { id: 'diferenca_percentual', name: 'Diferença (%)' }
    ],
    availableGroupBy: [
      { id: 'dia', name: 'Por Dia' },
      { id: 'semana', name: 'Por Semana' },
      { id: 'mes', name: 'Por Mês' },
      { id: 'cliente', name: 'Por Cliente' },
      { id: 'produto', name: 'Por Produto' }
    ]
  }
];

// Dados de exemplo para relatórios agendados
const defaultScheduledReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Vendas Mensais',
    description: 'Relatório mensal de vendas por categoria',
    type: 'vendas',
    frequency: 'mensal',
    format: 'pdf',
    recipients: ['admin@empresa.com.br', 'financeiro@empresa.com.br'],
    lastGenerated: new Date(2023, 10, 1),
    nextScheduled: new Date(2023, 11, 1),
    status: 'ativo',
    configuration: {
      visualization: 'line',
      filters: {
        id: 'vendas-filter',
        name: 'Vendas Mensais',
        operator: 'AND',
        conditions: [
          {
            id: 'status-condition',
            field: 'status',
            operator: 'equals',
            value: 'APROVADO'
          }
        ]
      },
      dateRange: {
        preset: 'thisMonth'
      },
      groupBy: ['categoria', 'vendedor'],
      metrics: ['valor_total', 'quantidade', 'média']
    }
  },
  {
    id: '2',
    name: 'Resumo de Produção Semanal',
    description: 'Relatório semanal de itens produzidos',
    type: 'produção',
    frequency: 'semanal',
    format: 'excel',
    recipients: ['producao@empresa.com.br'],
    lastGenerated: new Date(2023, 10, 25),
    nextScheduled: new Date(2023, 11, 2),
    status: 'ativo',
    configuration: {
      visualization: 'bar',
      filters: {
        id: 'producao-filter',
        name: 'Produção Semanal',
        operator: 'AND',
        conditions: [
          {
            id: 'departamento-condition',
            field: 'departamento',
            operator: 'in',
            value: ['montagem', 'finalização']
          }
        ]
      },
      dateRange: {
        from: subDays(new Date(), 7),
        to: new Date()
      },
      groupBy: ['produto', 'linha'],
      metrics: ['quantidade', 'tempo_produção', 'retrabalho']
    }
  },
  {
    id: '3',
    name: 'Pedidos Atrasados',
    description: 'Lista de pedidos com prazo excedido',
    type: 'atrasados',
    frequency: 'diário',
    format: 'excel',
    recipients: ['gestores@empresa.com.br', 'supervisao@empresa.com.br'],
    lastGenerated: new Date(2023, 10, 29),
    nextScheduled: new Date(2023, 10, 30),
    status: 'ativo',
    configuration: {
      visualization: 'table',
      filters: {
        id: 'atrasados-filter',
        name: 'Pedidos Atrasados',
        operator: 'AND',
        conditions: [
          {
            id: 'atraso-condition',
            field: 'dias_atraso',
            operator: 'greaterThan',
            value: 0
          }
        ]
      },
      columns: ['pedido_id', 'cliente', 'produto', 'prazo', 'dias_atraso', 'status', 'responsavel'],
      metrics: ['dias_atraso'],
      sort: [
        {
          field: 'dias_atraso',
          direction: 'desc'
        }
      ]
    }
  }
];

// Dados de exemplo para dashboards
const defaultDashboards: Dashboard[] = [
  {
    id: '1',
    name: 'Visão Geral do Negócio',
    description: 'Principais indicadores de desempenho do negócio',
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date(2023, 0, 1),
    widgets: [
      {
        id: 'widget-1',
        reportId: 'pedidos-periodo',
        position: { x: 0, y: 0, w: 8, h: 4 },
        title: 'Volume de Pedidos por Período',
        type: 'line'
      },
      {
        id: 'widget-2',
        reportId: 'distribuicao-status',
        position: { x: 8, y: 0, w: 4, h: 4 },
        title: 'Distribuição de Status',
        type: 'donut'
      },
      {
        id: 'widget-3',
        reportId: 'top-clientes',
        position: { x: 0, y: 4, w: 6, h: 4 },
        title: 'Top 5 Clientes',
        type: 'bar'
      },
      {
        id: 'widget-4',
        reportId: 'taxa-aprovacao',
        position: { x: 6, y: 4, w: 6, h: 4 },
        title: 'Taxa de Aprovação',
        type: 'gauge'
      }
    ]
  },
  {
    id: '2',
    name: 'Dashboard de Produção',
    description: 'Métricas relacionadas à produção e lead time',
    createdBy: 'system',
    createdAt: new Date(2023, 1, 15),
    widgets: [
      {
        id: 'widget-5',
        reportId: 'lead-time-medio',
        position: { x: 0, y: 0, w: 12, h: 4 },
        title: 'Lead Time Médio por Etapa',
        type: 'bar'
      },
      {
        id: 'widget-6',
        reportId: 'produtividade-colaborador',
        position: { x: 0, y: 4, w: 6, h: 4 },
        title: 'Produtividade por Colaborador',
        type: 'radar'
      },
      {
        id: 'widget-7',
        reportId: 'pedidos-atrasados',
        position: { x: 6, y: 4, w: 6, h: 4 },
        title: 'Pedidos Atrasados',
        type: 'table'
      }
    ]
  }
];

// Componente para os filtros avançados
const AdvancedFilters = ({ 
  filter, 
  onFilterChange, 
  availableFields = [], 
  showDateRange = true
}: { 
  filter: Filter; 
  onFilterChange: (filter: Filter) => void; 
  availableFields?: { id: string, name: string }[];
  showDateRange?: boolean;
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    filter.dateRange || { from: undefined, to: undefined }
  );

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    onFilterChange({
      ...filter,
      dateRange: range
    });
  };

  const handlePresetDateRange = (presetId: string) => {
    const preset = predefinedDateRanges.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getValue();
      setDateRange(range);
      onFilterChange({
        ...filter,
        dateRange: range
      });
    }
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onFilterChange({
      ...filter,
      operator
    });
  };

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: availableFields.length > 0 ? availableFields[0].id : '',
      operator: 'equals',
      value: ''
    };

    onFilterChange({
      ...filter,
      conditions: [...filter.conditions, newCondition]
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    onFilterChange({
      ...filter,
      conditions: filter.conditions.filter(c => c.id !== conditionId)
    });
  };

  const handleConditionChange = (conditionId: string, updates: Partial<FilterCondition>) => {
    onFilterChange({
      ...filter,
      conditions: filter.conditions.map(condition => 
        condition.id === conditionId 
          ? { ...condition, ...updates } 
          : condition
      )
    });
  };

  const handleValueChange = (conditionId: string, value: string) => {
    const condition = filter.conditions.find(c => c.id === conditionId);
    if (condition) {
      let processedValue = value;
      // Tentar converter para array se for operador 'in'
      if (condition.operator === 'in' && value.includes(',')) {
        // Não atribuir diretamente para evitar erro de tipo
        processedValue = value;
      }
      
      handleConditionChange(condition.id, { value: processedValue });
    }
  };

  return (
    <div className="space-y-4">
      {showDateRange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="date-range" className="text-sm font-medium">Período</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Períodos Predefinidos
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Selecionar Período</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {predefinedDateRanges.map(preset => (
                  <DropdownMenuItem 
                    key={preset.id}
                    onClick={() => handlePresetDateRange(preset.id)}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {preset.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <DatePickerWithRange 
            date={dateRange} 
            setDate={handleDateRangeChange} 
            locale={ptBR}
            className="w-full"
            showShortcuts={true}
            label=""
            placeholder="Selecione um período para filtrar"
            onApply={(range) => {
              toast.success("Período aplicado com sucesso!", {
                description: `Filtro atualizado para o período selecionado.`,
              });
            }}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">Operador de Condições</Label>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroup 
              value={filter.operator} 
              onValueChange={(value) => handleOperatorChange(value as FilterOperator)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AND" id="operator-and" />
                <Label htmlFor="operator-and" className="cursor-pointer">
                  E (AND) - Todas as condições
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OR" id="operator-or" />
                <Label htmlFor="operator-or" className="cursor-pointer">
                  OU (OR) - Qualquer condição
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Condições de Filtro</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAddCondition}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Condição
          </Button>
        </div>
        
        {filter.conditions.length === 0 ? (
          <div className="p-4 text-center bg-gray-50 rounded-md">
            <p className="text-sm text-muted-foreground">
              Nenhuma condição adicionada. Clique em "Adicionar Condição" para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filter.conditions.map((condition, index) => (
              <Card key={condition.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div>
                      <Label htmlFor={`field-${condition.id}`} className="text-xs mb-1 block">
                        Campo
                      </Label>
                      <Select 
                        value={condition.field} 
                        onValueChange={(value) => handleConditionChange(condition.id, { field: value })}
                      >
                        <SelectTrigger id={`field-${condition.id}`}>
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map(field => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`operator-${condition.id}`} className="text-xs mb-1 block">
                        Operador
                      </Label>
                      <Select 
                        value={condition.operator} 
                        onValueChange={(value) => handleConditionChange(
                          condition.id, 
                          { operator: value as FilterCondition['operator'] }
                        )}
                      >
                        <SelectTrigger id={`operator-${condition.id}`}>
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="greaterThan">Maior que</SelectItem>
                          <SelectItem value="lessThan">Menor que</SelectItem>
                          <SelectItem value="between">Entre</SelectItem>
                          <SelectItem value="in">Em (lista)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`value-${condition.id}`} className="text-xs mb-1 block">
                        Valor
                      </Label>
                      <Input 
                        id={`value-${condition.id}`}
                        value={typeof condition.value === 'string' ? condition.value : JSON.stringify(condition.value)}
                        onChange={(e) => handleValueChange(condition.id, e.target.value)}
                        placeholder="Valor da condição"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {condition.operator === 'in' && 'Separe múltiplos valores com vírgula'}
                        {condition.operator === 'between' && 'Formato: "valor1,valor2"'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveCondition(condition.id)}
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente que exibe um esqueleto de carregamento para os relatórios
const ReportSkeleton = ({ type = 'bar' }: { type?: VisualizationType }) => {
  if (type === 'table') {
    return (
      <div className="w-full space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  if (type === 'donut' || type === 'pie') {
    return (
      <div className="flex justify-center items-center">
        <div className="relative w-40 h-40 rounded-full overflow-hidden">
          <Skeleton className="absolute inset-0" />
          <Skeleton className="absolute inset-[25%] rounded-full bg-background" />
        </div>
      </div>
    );
  }
  
  if (type === 'gauge') {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative w-32 h-16 overflow-hidden rounded-t-full">
          <Skeleton className="absolute inset-0" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }
  
  if (type === 'card' || type === 'kpi') {
    return (
      <div className="flex flex-col items-center space-y-4 p-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }
  
  if (type === 'radar') {
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <Skeleton className="absolute inset-0 rounded-full opacity-30" />
          <Skeleton className="absolute inset-[15%] rounded-full opacity-50" />
          <Skeleton className="absolute inset-[30%] rounded-full opacity-70" />
          <Skeleton className="absolute inset-[45%] rounded-full opacity-90" />
          <Skeleton className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 opacity-20" />
          <Skeleton className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 opacity-20" />
        </div>
      </div>
    );
  }
  
  // default: bar/line/etc
  return (
    <div className="w-full space-y-2">
      <div className="flex items-end w-full h-48 gap-2">
        <Skeleton className="w-1/6 h-1/4" />
        <Skeleton className="w-1/6 h-2/3" />
        <Skeleton className="w-1/6 h-1/3" />
        <Skeleton className="w-1/6 h-1/2" />
        <Skeleton className="w-1/6 h-4/5" />
        <Skeleton className="w-1/6 h-2/5" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  );
};

// Componente que mostra uma visualização de relatório
const ReportVisualization = ({ 
  type,
  reportType,
  isLoading,
  reportData
}: { 
  type: VisualizationType,
  reportType: ReportType,
  isLoading: boolean,
  reportData?: any
}) => {
  if (isLoading) {
    return <ReportSkeleton type={type} />;
  }
  
  // Visualizações mais realistas e profissionais
  if (type === 'line') {
    return (
      <div className="w-full h-full flex flex-col relative">
        <div className="absolute top-0 right-2 flex space-x-1">
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Filter className="h-3 w-3 text-gray-400" />
          </div>
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Download className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <div className="w-full flex-1 flex items-end space-x-1 pt-6">
          <div className="flex-1 flex flex-col justify-end h-full relative">
            <div className="absolute left-0 right-0 bottom-[20%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[40%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[60%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[80%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-200"></div>
            <div className="relative w-full h-full px-1">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <path 
                  d="M0,100 L20,80 L40,90 L60,50 L80,30 L100,40" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path 
                  d="M0,100 L20,80 L40,90 L60,50 L80,30 L100,40" 
                  fill="url(#blueGradient)" 
                  fillOpacity="0.1" 
                  stroke="none"
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-0.5 pt-1 mt-auto">
          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, i) => (
            <div key={i} className="text-[9px] text-center text-gray-500">{month}</div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'bar') {
    return (
      <div className="w-full h-full flex flex-col relative">
        <div className="absolute top-0 right-2 flex space-x-1">
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Filter className="h-3 w-3 text-gray-400" />
          </div>
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Download className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <div className="w-full flex-1 flex items-end space-x-3 pt-6 px-2">
          <div className="flex-1 flex flex-col justify-end h-full relative">
            <div className="absolute left-0 right-0 bottom-[20%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[40%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[60%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute left-0 right-0 bottom-[80%] border-t border-dashed border-gray-200 w-full"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-200"></div>
            <div className="flex space-x-2 h-full w-full items-end">
              <div className="flex-1 h-[30%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">128</div>
              </div>
              <div className="flex-1 h-[60%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">245</div>
              </div>
              <div className="flex-1 h-[45%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">179</div>
              </div>
              <div className="flex-1 h-[75%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">310</div>
              </div>
              <div className="flex-1 h-[90%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">387</div>
              </div>
              <div className="flex-1 h-[65%] rounded-t-sm bg-emerald-500 hover:bg-emerald-600 transition-colors group relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">268</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-0.5 pt-1 mt-auto">
          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, i) => (
            <div key={i} className="text-[9px] text-center text-gray-500">{month}</div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'donut' || type === 'pie') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <div className="absolute top-1 right-2 flex space-x-1">
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Filter className="h-3 w-3 text-gray-400" />
          </div>
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Download className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <div className="w-32 h-32 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ddd" strokeWidth="20" />
            
            {/* Primeiro segmento: 45% */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke="#8b5cf6" 
              strokeWidth="20" 
              strokeDasharray="251.2 251.2" 
              strokeDashoffset="138.16" 
              transform="rotate(-90 50 50)"
            />
            
            {/* Segundo segmento: 30% */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke="#10b981" 
              strokeWidth="20" 
              strokeDasharray="251.2 251.2" 
              strokeDashoffset="75.36" 
              transform="rotate(72 50 50)"
            />
            
            {/* Terceiro segmento: 15% */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke="#3b82f6" 
              strokeWidth="20" 
              strokeDasharray="251.2 251.2" 
              strokeDashoffset="37.68" 
              transform="rotate(180 50 50)"
            />
            
            {/* Quarto segmento: 10% */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke="#f59e0b" 
              strokeWidth="20" 
              strokeDasharray="251.2 251.2" 
              strokeDashoffset="25.12" 
              transform="rotate(234 50 50)"
            />
            
            {type === 'donut' && <circle cx="50" cy="50" r="30" fill="white" />}
          </svg>
          
          {type === 'donut' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold">45%</div>
                <div className="text-xs text-gray-500">Concluído</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-sm mr-2"></div>
            <span className="text-gray-700">Análise</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
            <span className="text-gray-700">Produção</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
            <span className="text-gray-700">Aprovação</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div>
            <span className="text-gray-700">Entrega</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'gauge') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <div className="absolute top-1 right-2 flex space-x-1">
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Filter className="h-3 w-3 text-gray-400" />
          </div>
          <div className="p-1 rounded-sm hover:bg-gray-100 cursor-pointer">
            <Download className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        
        <div className="relative w-36 h-20">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Fundo do medidor */}
            <path 
              d="M10,50 A 40 40 0 0 1 90,50" 
              fill="none" 
              stroke="#f3f4f6" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            
            {/* Áreas coloridas */}
            <path 
              d="M10,50 A 40 40 0 0 1 25,15.5" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            <path 
              d="M25,15.5 A 40 40 0 0 1 50,10" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            <path 
              d="M50,10 A 40 40 0 0 1 90,50" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            
            {/* Marcadores */}
            <text x="10" y="55" fontSize="5" textAnchor="middle" fill="#6b7280">0</text>
            <text x="50" y="55" fontSize="5" textAnchor="middle" fill="#6b7280">50</text>
            <text x="90" y="55" fontSize="5" textAnchor="middle" fill="#6b7280">100</text>
            
            {/* Ponteiro */}
            <line 
              x1="50" 
              y1="50" 
              x2="75" 
              y2="25" 
              stroke="#0f172a" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="4" fill="#0f172a" />
          </svg>
        </div>
        
        <div className="flex flex-col items-center mt-1">
          <div className="text-2xl font-bold">72%</div>
          <div className="text-xs text-gray-500">Taxa de Aprovação</div>
          <div className="text-xs text-green-600 font-medium flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" /> +5% em relação ao mês anterior
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'table') {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="w-full grid grid-cols-4 bg-gray-50 border-b py-2 px-3">
          <div className="font-medium text-xs text-gray-700">Cliente</div>
          <div className="font-medium text-xs text-gray-700">Produto</div>
          <div className="font-medium text-xs text-gray-700">Prazo</div>
          <div className="font-medium text-xs text-gray-700">Status</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {[
            { cliente: 'Empresa ABC', produto: 'Calendário', prazo: '15/05/2023', status: 'Concluído' },
            { cliente: 'Loja XYZ', produto: 'Canetas Personalizadas', prazo: '22/05/2023', status: 'Em Produção' },
            { cliente: 'Consultoria 123', produto: 'Cartões de Visita', prazo: '18/05/2023', status: 'Atrasado' },
            { cliente: 'Escritório JKL', produto: 'Banner', prazo: '30/05/2023', status: 'Aguardando' },
            { cliente: 'Escola QWE', produto: 'Blocos de Anotações', prazo: '10/06/2023', status: 'Em Análise' }
          ].map((row, index) => (
            <div key={index} className={`w-full grid grid-cols-4 py-2 px-3 text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b hover:bg-blue-50 transition-colors cursor-pointer`}>
              <div className="truncate" title={row.cliente}>{row.cliente}</div>
              <div className="truncate" title={row.produto}>{row.produto}</div>
              <div>{row.prazo}</div>
              <div>
                {row.status === 'Concluído' && <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">{row.status}</Badge>}
                {row.status === 'Em Produção' && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">{row.status}</Badge>}
                {row.status === 'Atrasado' && <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">{row.status}</Badge>}
                {row.status === 'Aguardando' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">{row.status}</Badge>}
                {row.status === 'Em Análise' && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0">{row.status}</Badge>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-2 px-3 flex justify-between text-xs text-gray-500 border-t">
          <div>Exibindo 5 de 42 registros</div>
          <div className="flex space-x-1">
            <Button variant="outline" size="icon" className="h-6 w-6 p-0">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="icon" className="h-6 w-6 p-0 bg-primary text-white hover:bg-primary/90">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-6 w-6 p-0">
              2
            </Button>
            <Button variant="outline" size="icon" className="h-6 w-6 p-0">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Outras visualizações ou fallback
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 border border-dashed rounded-md">
      <div className="flex items-center justify-center mb-4">
        {type === 'radar' && <Radar className="h-10 w-10 text-indigo-500" />}
        {type === 'stackedBar' && <BarChart2 className="h-10 w-10 text-teal-500" />}
        {(type === 'card' || type === 'kpi') && <Info className="h-10 w-10 text-blue-500" />}
        {type === 'gantt' && <Workflow className="h-10 w-10 text-orange-500" />}
        {type === 'heatmap' && <BarChart2 className="h-10 w-10 text-red-500" />}
      </div>
      <p className="text-center font-medium mb-2">Visualização: {type}</p>
      <p className="text-center text-muted-foreground text-xs">Dados do relatório disponíveis</p>
    </div>
  );
};

// Componente para selecionar o formato de exportação
const ExportFormatSelector = ({ 
  value,
  onChange
}: { 
  value: ReportFormat[],
  onChange: (formats: ReportFormat[]) => void
}) => {
  const handleToggleFormat = (format: ReportFormat) => {
    if (value.includes(format)) {
      onChange(value.filter(f => f !== format));
    } else {
      onChange([...value, format]);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={value.includes('pdf') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggleFormat('pdf')}
        className="flex items-center"
      >
        <FileType className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button
        variant={value.includes('excel') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggleFormat('excel')}
        className="flex items-center"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
      <Button
        variant={value.includes('csv') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggleFormat('csv')}
        className="flex items-center"
      >
        <FileText className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button
        variant={value.includes('html') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggleFormat('html')}
        className="flex items-center"
      >
        <FileText className="mr-2 h-4 w-4" />
        HTML
      </Button>
      <Button
        variant={value.includes('json') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggleFormat('json')}
        className="flex items-center"
      >
        <FileJson className="mr-2 h-4 w-4" />
        JSON
      </Button>
    </div>
  );
};

export function ReportsSettings() {
  // Estados
  const [activeTab, setActiveTab] = useState<string>('relatorios');
  const [activeReportTab, setActiveReportTab] = useState<string>('configuracao');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isCreateDashboardDialogOpen, setIsCreateDashboardDialogOpen] = useState<boolean>(false);
  const [dashboardName, setDashboardName] = useState<string>('');
  const [dashboardDescription, setDashboardDescription] = useState<string>('');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [selectedReportTemplate, setSelectedReportTemplate] = useState<ReportTemplate | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Filter>({
    id: `filter-${Date.now()}`,
    name: 'Filtro Padrão',
    operator: 'AND',
    conditions: []
  });
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [exportFormats, setExportFormats] = useState<ReportFormat[]>(['pdf']);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(defaultScheduledReports);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationType>('line');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string>('todos');
  const [selectedClients, setSelectedClients] = useState<string>('todos');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState<boolean>(false);
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  // Carregar usuários
  useEffect(() => {
    const users = userService.getUsers();
    setUsersList(users);
  }, []);

  // Tags disponíveis para relatórios
  const availableTags = [
    { id: 'prioritario', name: 'Prioritário', color: '#3b82f6' },
    { id: 'concluido', name: 'Concluído', color: '#10b981' },
    { id: 'em-andamento', name: 'Em andamento', color: '#f59e0b' },
    { id: 'atrasado', name: 'Atrasado', color: '#ef4444' },
    { id: 'aguardando', name: 'Aguardando', color: '#6366f1' },
    { id: 'revisao', name: 'Em revisão', color: '#8b5cf6' }
  ];

  // Função para alternar seleção de tags
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Filtragem de relatórios
  const filteredReports = useMemo(() => {
    return scheduledReports.filter(report => {
      const matchesSearch = searchQuery === '' || 
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = showArchived || report.status === 'ativo';
      
      return matchesSearch && matchesStatus;
    });
  }, [scheduledReports, searchQuery, showArchived]);
  
  // Manipuladores de eventos
  const handleGenerateReport = async (reportId: string) => {
    try {
      setIsGeneratingReport(true);
      setIsLoading(true);
      
      // Simular chamada de API para obter dados do relatório
      const template = defaultReportTemplates.find(t => t.id === reportId);
      
      if (!template) {
        toast.error('Modelo de relatório não encontrado');
        return;
      }
      
      // Gerar dados fictícios com base no tipo de relatório
      let mockData;
      
      switch (template.type) {
        case 'vendas':
          mockData = {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
              label: 'Vendas',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              borderColor: 'rgb(53, 162, 235)',
              borderWidth: 1
            }]
          };
          break;
        case 'status':
          mockData = {
            labels: ['Concluído', 'Em Andamento', 'Atrasado', 'Aguardando'],
            datasets: [{
              label: 'Status',
              data: [63, 25, 8, 4],
              backgroundColor: [
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(99, 102, 241, 0.7)'
              ],
              borderWidth: 1
            }]
          };
          break;
        default:
          mockData = {
            labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
            datasets: [{
              label: 'Dados',
              data: [12, 19, 3, 5, 2],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1
            }]
          };
      }
      
      setReportData(mockData);
      setSelectedVisualization(template.defaultVisualization);
      
      // Abrir o diálogo de pré-visualização
      setIsPreviewDialogOpen(true);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Ocorreu um erro ao gerar o relatório');
    } finally {
      setIsGeneratingReport(false);
      setIsLoading(false);
    }
  };

  // Função para exportar relatório em PDF
  const handleExportPDF = async () => {
    if (!reportPreviewRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Usar html2canvas para capturar o conteúdo do relatório
      const canvas = await html2canvas(reportPreviewRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // Criar PDF com jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar título
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(selectedReportTemplate?.name || 'Relatório', 15, 15);
      
      // Adicionar data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 22);
      
      // Adicionar imagem do gráfico
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
      
      // Salvar PDF
      pdf.save(`relatorio-${Date.now()}.pdf`);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Ocorreu um erro ao exportar o PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para imprimir relatório
  const handlePrintReport = () => {
    if (!reportPreviewRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Criar um novo elemento para impressão
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 8px; }
          p { font-size: 12px; color: #666; margin-bottom: 20px; }
          img { max-width: 100%; height: auto; }
        </style>
        <h1>${selectedReportTemplate?.name || 'Relatório'}</h1>
        <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      `;
      
      // Clonar o conteúdo do relatório
      const reportClone = reportPreviewRef.current.cloneNode(true) as HTMLElement;
      
      // Adicionar o clone ao conteúdo de impressão
      printContent.appendChild(reportClone);
      
      // Criar iframe para impressão
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      document.body.appendChild(printFrame);
      
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printContent.innerHTML);
        frameDoc.close();
        
        // Imprimir após carregar o conteúdo
        setTimeout(() => {
          printFrame.contentWindow?.print();
          document.body.removeChild(printFrame);
          setIsLoading(false);
        }, 500);
      }
      
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      toast.error('Ocorreu um erro ao imprimir o relatório');
      setIsLoading(false);
    }
  };
  
  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setIsEditingReport(true);
    setCurrentFilter(report.configuration.filters);
  };
  
  const handleNewReport = () => {
    // Encontrar o primeiro template disponível
    const firstTemplate = defaultReportTemplates[0];
    
    const newReport: ScheduledReport = {
      id: Date.now().toString(),
      name: 'Novo Relatório',
      description: '',
      type: firstTemplate.type,
      frequency: 'sob demanda',
      format: 'pdf',
      recipients: [],
      status: 'ativo',
      configuration: {
        visualization: firstTemplate.defaultVisualization,
        filters: {
          id: `filter-${Date.now()}`,
          name: 'Novo Filtro',
          operator: 'AND',
          conditions: []
        },
        dateRange: {
          from: subDays(new Date(), 30),
          to: new Date()
        },
        metrics: firstTemplate.availableMetrics.slice(0, 1).map(m => m.id)
      }
    };
    
    setEditingReport(newReport);
    setIsEditingReport(true);
    setSelectedReportTemplate(firstTemplate);
    setCurrentFilter(newReport.configuration.filters);
    setActiveReportTab('configuracao');
  };
  
  const handleSaveReport = () => {
    // Lógica para salvar relatório
    if (!editingReport) return;
    
    // Atualizar com os filtros atuais
    const updatedReport = {
      ...editingReport,
      configuration: {
        ...editingReport.configuration,
        filters: currentFilter
      }
    };
    
    if (scheduledReports.find(r => r.id === updatedReport.id)) {
      // Atualizar relatório existente
      setScheduledReports(reports => 
        reports.map(r => r.id === updatedReport.id ? updatedReport : r)
      );
      toast.success('Relatório atualizado com sucesso!');
    } else {
      // Adicionar novo relatório
      setScheduledReports(reports => [...reports, updatedReport]);
      toast.success('Novo relatório adicionado com sucesso!');
    }
    
    setIsEditingReport(false);
    setEditingReport(null);
  };
  
  // Função para criar nova dashboard
  const handleCreateDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error('O nome do dashboard é obrigatório');
      return;
    }
    
    if (!currentDashboard) {
      toast.error('Você precisa estar logado para criar um dashboard');
      return;
    }
    
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: dashboardName,
      description: dashboardDescription,
      widgets: [],
      createdBy: currentDashboard.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setDashboards([...dashboards, newDashboard]);
    setCurrentDashboard(newDashboard);
    setIsCreateDashboardDialogOpen(false);
    setDashboardName('');
    setDashboardDescription('');
    
    toast.success('Dashboard criado com sucesso!');
  };
  
  // Função para adicionar widget à dashboard
  const handleAddWidget = (reportId: string) => {
    if (!currentDashboard) return;
    
    const report = defaultReportTemplates.find(r => r.id === reportId);
    if (!report) return;
    
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      reportId,
      title: report.name,
      type: report.defaultVisualization,
      position: { x: 0, y: 0, w: 6, h: 4 }
    };
    
    const updatedDashboard = {
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget],
      updatedAt: new Date()
    };
    
    setDashboards(
      dashboards.map(dash => dash.id === currentDashboard.id ? updatedDashboard : dash)
    );
    setCurrentDashboard(updatedDashboard);
    
    toast.success('Widget adicionado ao dashboard!');
  };
  
  // Função para exportar relatórios
  const handleExportReports = (reportId: string) => {
    try {
      setIsLoading(true);
      
      // Simular processamento
      setTimeout(() => {
        toast.success('Relatório exportado com sucesso!');
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Ocorreu um erro ao exportar o relatório');
      setIsLoading(false);
    }
  };
  
  // Render do Dashboard
  const renderDashboard = () => {
    if (!currentDashboard) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <LayoutDashboard className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum Dashboard Selecionado</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Selecione um dashboard existente ou crie um novo para visualizar seus relatórios de maneira personalizada.
          </p>
          <Button onClick={() => setIsCreateDashboardDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Dashboard
          </Button>
        </div>
      );
    }
    
    if (currentDashboard.widgets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <BarChart2 className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Dashboard Vazio</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Este dashboard não possui widgets. Adicione relatórios para começar a visualizar métricas importantes.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Adicionar Relatório ao Dashboard</DialogTitle>
                <DialogDescription>
                  Selecione um dos relatórios disponíveis para adicionar ao seu dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {defaultReportTemplates.map(template => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col"
                    onClick={() => handleAddWidget(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <template.icon className="h-5 w-5 mr-2 text-primary" />
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0 mt-auto">
                      <div className="flex flex-wrap gap-1">
                        {template.supportedVisualizations.slice(0, 3).map(viz => (
                          <Badge key={viz} variant="outline" className="text-xs">
                            {viz}
                          </Badge>
                        ))}
                        {template.supportedVisualizations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.supportedVisualizations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
    
    // Dashboard with widgets
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{currentDashboard.name}</h2>
              {currentDashboard.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Dashboard Padrão
                </Badge>
              )}
            </div>
            {currentDashboard.description && (
              <p className="text-muted-foreground mt-1">{currentDashboard.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => toast.success("Dados atualizados!")}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar Dados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsEditingReport(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileType className="mr-2 h-4 w-4" />
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar como Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Widget
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Adicionar Widget ao Dashboard</DialogTitle>
                        <DialogDescription>
                          Selecione um dos relatórios para adicionar como novo widget.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        {defaultReportTemplates.map(template => (
                          <Card 
                            key={template.id} 
                            className="cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col"
                            onClick={() => handleAddWidget(template.id)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center">
                                <template.icon className="h-5 w-5 mr-2 text-primary" />
                                {template.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                            </CardContent>
                            <CardFooter className="pt-0 mt-auto">
                              <div className="flex flex-wrap gap-1">
                                {template.supportedVisualizations.slice(0, 3).map(viz => (
                                  <Badge key={viz} variant="outline" className="text-xs">
                                    {viz}
                                  </Badge>
                                ))}
                                {template.supportedVisualizations.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.supportedVisualizations.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar Widget</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDashboard.widgets.map((widget) => {
            const report = defaultReportTemplates.find(r => r.id === widget.reportId);
            if (!report) return null;
            
            // Map widget type to appropriate span
            let widgetClassName = "col-span-1";
            
            // Adjust width by importance
            if (widget.reportId === 'pedidos-periodo' || widget.reportId === 'lead-time-medio') {
              widgetClassName = "col-span-1 md:col-span-2";
            }
            
            // Tables often need more space
            if (widget.type === 'table') {
              widgetClassName = "col-span-1 lg:col-span-2";
            }
            
            return (
              <Card 
                key={widget.id} 
                className={cn(widgetClassName, "group relative hover:shadow-md transition-all")}
              >
                <div className={cn("absolute inset-0 bg-black/70 items-center justify-center z-10 hidden group-hover:flex")}>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-white gap-2" onClick={() => {
                      toast.info("Edição de widget será implementada em breve");
                    }}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => {
                      if (currentDashboard) {
                        const updatedDashboard = {
                          ...currentDashboard,
                          widgets: currentDashboard.widgets.filter(w => w.id !== widget.id),
                          updatedAt: new Date()
                        };
                        
                        setDashboards(
                          dashboards.map(dash => dash.id === currentDashboard.id ? updatedDashboard : dash)
                        );
                        setCurrentDashboard(updatedDashboard);
                        
                        toast.success('Widget removido com sucesso!');
                      }
                    }}>
                      <Trash className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
                <CardHeader className="pb-0 pt-3 px-4">
                  <CardTitle className="flex items-center text-sm font-medium">
                    <report.icon className="h-4 w-4 mr-2 text-primary" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-[220px]">
                  <ReportVisualization 
                    type={widget.type}
                    reportType={report.type}
                    isLoading={false}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-center mt-2">
          <div className="bg-muted/40 border rounded-lg p-3 text-center max-w-md">
            <p className="text-sm text-muted-foreground">
              Cada widget pode ser personalizado conforme suas necessidades específicas.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Diálogo de loading durante geração de relatório
  const renderLoadingDialog = () => (
    isGeneratingReport && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-[300px]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Gerando Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Aguarde enquanto o relatório está sendo gerado...</p>
          </CardContent>
        </Card>
      </div>
    )
  );
  
  // Diálogo para criar novo dashboard
  const renderCreateDashboardDialog = () => (
    <Dialog open={isCreateDashboardDialogOpen} onOpenChange={setIsCreateDashboardDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Dashboard</DialogTitle>
          <DialogDescription>
            Preencha as informações para criar seu dashboard personalizado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dashboard-name">Nome do Dashboard</Label>
            <Input 
              id="dashboard-name" 
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="Ex: Dashboard de Vendas"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-description">Descrição (opcional)</Label>
            <Textarea 
              id="dashboard-description" 
              value={dashboardDescription}
              onChange={(e) => setDashboardDescription(e.target.value)}
              placeholder="Descreva o propósito deste dashboard"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCreateDashboardDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateDashboard}>Criar Dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Renderizar diálogo de pré-visualização
  const renderPreviewDialog = () => (
    <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          <DialogDescription>
            Visualize o relatório gerado e escolha as opções de exportação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Área de visualização do relatório */}
          <div ref={reportPreviewRef} className="p-6 bg-white rounded-md border">
            <h2 className="text-xl font-bold mb-2">{selectedReportTemplate?.name}</h2>
            <p className="text-sm text-gray-500 mb-6">
              Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ReportVisualization 
                type={selectedVisualization} 
                reportType={selectedReportTemplate?.type || 'vendas'} 
                isLoading={false} 
                reportData={reportData} 
              />
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedVisualization('line')} 
              className={cn(selectedVisualization === 'line' && 'bg-sky-50 border-sky-200 text-sky-700')}
            >
              <LineChart className="h-4 w-4 mr-1.5" />
              Linha
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedVisualization('bar')} 
              className={cn(selectedVisualization === 'bar' && 'bg-sky-50 border-sky-200 text-sky-700')}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Barra
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedVisualization('pie')} 
              className={cn(selectedVisualization === 'pie' && 'bg-sky-50 border-sky-200 text-sky-700')}
            >
              <PieChart className="h-4 w-4 mr-1.5" />
              Pizza
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedVisualization('table')} 
              className={cn(selectedVisualization === 'table' && 'bg-sky-50 border-sky-200 text-sky-700')}
            >
              <Table className="h-4 w-4 mr-1.5" />
              Tabela
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintReport} disabled={isLoading}>
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir
            </Button>
            <Button variant="default" onClick={handleExportPDF} disabled={isLoading}>
              <Download className="h-4 w-4 mr-1.5" />
              Baixar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <div className="space-y-6">
      {renderLoadingDialog()}
      {renderCreateDashboardDialog()}
      {renderPreviewDialog()}
      
      {/* Abas principais */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="relatorios">Catálogo de Relatórios</TabsTrigger>
          <TabsTrigger value="agendados">Relatórios Agendados</TabsTrigger>
          <TabsTrigger value="configuracao">Configurações</TabsTrigger>
        </TabsList>
        
        {/* Catálogo de Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">Catálogo de Relatórios</h2>
              <Badge variant="outline" className="ml-2">
                {defaultReportTemplates.length} modelos disponíveis
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar relatórios..."
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={true}>
                    Vendas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Produção
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Financeiro
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Desempenho
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Painel de personalização movido para o topo */}
          <div className="bg-card rounded-lg border shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Personalizar Relatório</h3>
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white gap-1.5">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Período */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-gray-700">Período</h4>
                <div className="relative w-full">
                  <div className="flex w-full items-center rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-1 focus-within:ring-sky-400">
                    <CalendarIcon className="ml-3 h-4 w-4 text-gray-500" />
                    <DatePickerWithRange 
                      date={{ from: subDays(new Date(), 30), to: new Date() }} 
                      setDate={() => {}}
                      className="[&>button]:border-0 [&>button]:pl-1.5 [&>button]:pr-2.5 [&>button]:py-2.5 [&>button]:shadow-none"
                      locale={ptBR}
                      showShortcuts={true}
                      label=""
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 p-0 rounded-full mr-1.5"
                      onClick={() => toast.success("Período limpo")}
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Filtros */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-gray-700">Filtros</h4>
                <div className="space-y-2">
                  <div className="relative">
                    <Select defaultValue="todos">
                      <SelectTrigger 
                        className="w-full border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:ring-1 focus:ring-sky-400"
                      >
                        <div className="flex items-center">
                          <SelectValue placeholder="Todos os clientes" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os clientes</SelectItem>
                        <SelectItem value="ativos">Apenas clientes ativos</SelectItem>
                        <SelectItem value="novos">Novos clientes (30 dias)</SelectItem>
                        <SelectItem value="recorrentes">Clientes recorrentes</SelectItem>
                        <SelectItem value="vip">Clientes VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative">
                    <Select defaultValue="todos">
                      <SelectTrigger 
                        className="w-full border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:ring-1 focus:ring-sky-400"
                      >
                        <div className="flex items-center">
                          <SelectValue placeholder="Todos os usuários" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os usuários</SelectItem>
                        <SelectItem value="atendentes">Apenas atendentes</SelectItem>
                        <SelectItem value="gerentes">Apenas gerentes</SelectItem>
                        <SelectItem value="administradores">Administradores</SelectItem>
                        <SelectItem value="vendedores">Vendedores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Etiquetas */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-gray-700">Etiquetas</h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableTags.map(tag => (
                    <Badge 
                      key={tag.id}
                      className={cn(
                        "cursor-pointer border-0 rounded px-2.5 py-1 text-xs font-medium",
                        selectedTags.includes(tag.id)
                          ? `bg-opacity-100 bg-${tag.id} text-white`
                          : `bg-opacity-10 hover:bg-opacity-20 text-${tag.id}`,
                        tag.id === 'prioritario' && (selectedTags.includes(tag.id) ? 'bg-blue-600' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'),
                        tag.id === 'concluido' && (selectedTags.includes(tag.id) ? 'bg-green-600' : 'bg-green-100 text-green-800 hover:bg-green-200'),
                        tag.id === 'em-andamento' && (selectedTags.includes(tag.id) ? 'bg-amber-600' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'),
                        tag.id === 'atrasado' && (selectedTags.includes(tag.id) ? 'bg-red-600' : 'bg-red-100 text-red-800 hover:bg-red-200'),
                        tag.id === 'aguardando' && (selectedTags.includes(tag.id) ? 'bg-indigo-600' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'),
                        tag.id === 'revisao' && (selectedTags.includes(tag.id) ? 'bg-purple-600' : 'bg-purple-100 text-purple-800 hover:bg-purple-200')
                      )}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Visualização */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-gray-700">Visualização</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "h-10 px-4 font-normal bg-white border-gray-200 hover:bg-gray-50",
                        selectedVisualization === 'bar' && "bg-sky-50 border-sky-200 text-sky-700"
                      )}
                      onClick={() => setSelectedVisualization('bar')}
                    >
                      <BarChart2 className="h-4 w-4 mr-1.5" />
                      Gráfico
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "h-10 px-4 font-normal bg-white border-gray-200 hover:bg-gray-50",
                        selectedVisualization === 'table' && "bg-sky-50 border-sky-200 text-sky-700"
                      )}
                      onClick={() => setSelectedVisualization('table')}
                    >
                      <Table className="h-4 w-4 mr-1.5" />
                      Tabela
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão Salvar */}
            <div className="px-5 py-4 bg-muted/50 border-t flex justify-end">
              <Button onClick={() => {
                const anyReportId = defaultReportTemplates[0]?.id;
                if (anyReportId) {
                  setSelectedReportTemplate(defaultReportTemplates[0]);
                  handleGenerateReport(anyReportId);
                }
              }}>
                <Eye className="h-4 w-4 mr-1.5" />
                Gerar Relatório
              </Button>
            </div>
          </div>
          
          {/* Nova interface mais prática e funcional */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="bg-card rounded-lg border shadow-sm">
                <div className="grid grid-cols-1 divide-y">
                  {defaultReportTemplates
                    .filter(template => 
                      searchQuery === '' || 
                      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      template.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(template => (
                      <div key={template.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                              <template.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{template.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {template.type}
                                </Badge>
                                {template.supportedVisualizations.slice(0, 3).map(viz => (
                                  <Badge key={viz} variant="outline" className="text-xs">
                                    {viz}
                                  </Badge>
                                ))}
                                {template.supportedVisualizations.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.supportedVisualizations.length - 3} visualizações
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1" 
                              onClick={() => {
                                setSelectedReportTemplate(template);
                                handleGenerateReport(template.id);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Visualizar</span>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">Ações</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedReportTemplate(template);
                                  handleGenerateReport(template.id);
                                }}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Exportar Agora
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  // Criar novo agendamento baseado neste template
                                  const newReport: ScheduledReport = {
                                    id: Date.now().toString(),
                                    name: template.name,
                                    description: template.description,
                                    type: template.type,
                                    frequency: 'sob demanda',
                                    format: 'pdf',
                                    recipients: [],
                                    status: 'ativo',
                                    configuration: {
                                      visualization: template.defaultVisualization,
                                      filters: {
                                        id: `filter-${Date.now()}`,
                                        name: 'Novo Filtro',
                                        operator: 'AND',
                                        conditions: []
                                      },
                                      dateRange: {
                                        from: subDays(new Date(), 30),
                                        to: new Date()
                                      },
                                      metrics: template.availableMetrics.slice(0, 1).map(m => m.id)
                                    }
                                  };
                                  
                                  setEditingReport(newReport);
                                  setIsEditingReport(true);
                                  setSelectedReportTemplate(template);
                                  setCurrentFilter(newReport.configuration.filters);
                                  setActiveReportTab('configuracao');
                                  setActiveTab('agendados');
                                }}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Agendar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  toast.success("Link copiado para a área de transferência");
                                }}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Compartilhar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Histórico de relatórios gerados recentemente */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Histórico de Relatórios Recentes</h3>
              <Button variant="ghost" size="sm" className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Relatório</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead>Gerado por</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 1, name: 'Volume de Pedidos por Período', date: '15/05/2023 14:30', user: 'Ana Silva', format: 'PDF' },
                    { id: 2, name: 'Top 10 Clientes', date: '14/05/2023 09:15', user: 'Carlos Santos', format: 'Excel' },
                    { id: 3, name: 'Taxa de Aprovação', date: '10/05/2023 16:45', user: 'Júlia Costa', format: 'CSV' },
                    { id: 4, name: 'Distribuição de Status', date: '08/05/2023 11:20', user: 'Roberto Alves', format: 'PDF' },
                  ].map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>
                        {item.format === 'PDF' && <Badge className="bg-red-100 text-red-800 border-0">PDF</Badge>}
                        {item.format === 'Excel' && <Badge className="bg-green-100 text-green-800 border-0">Excel</Badge>}
                        {item.format === 'CSV' && <Badge className="bg-blue-100 text-blue-800 border-0">CSV</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        
        {/* Relatórios Agendados */}
        <TabsContent value="agendados" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">Relatórios Agendados</h2>
              <Badge variant="outline" className="ml-2">
                {filteredReports.length} relatórios
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar relatórios..."
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Switch 
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="cursor-pointer">
                Mostrar arquivados
              </Label>
              <Button onClick={handleNewReport}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Último Gerado</TableHead>
                    <TableHead>Próximo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Nenhum relatório agendado encontrado</p>
                          <Button variant="outline" className="mt-4" onClick={handleNewReport}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Agendamento
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">{report.description}</div>
                        </TableCell>
                        <TableCell>
                          {report.type === 'vendas' && <BarChart2 className="h-4 w-4 text-green-500 inline mr-1" />}
                          {report.type === 'produção' && <Package className="h-4 w-4 text-blue-500 inline mr-1" />}
                          {report.type === 'atrasados' && <AlertCircle className="h-4 w-4 text-red-500 inline mr-1" />}
                          {report.type === 'financeiro' && <DollarSign className="h-4 w-4 text-purple-500 inline mr-1" />}
                          {report.type}
                        </TableCell>
                        <TableCell>{report.frequency}</TableCell>
                        <TableCell>
                          {report.format === 'pdf' && <FileType className="h-4 w-4 text-red-500 inline mr-1" />}
                          {report.format === 'excel' && <FileSpreadsheet className="h-4 w-4 text-green-500 inline mr-1" />}
                          {report.format === 'csv' && <FileText className="h-4 w-4 text-blue-500 inline mr-1" />}
                          {report.format.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {report.lastGenerated ? (
                            format(report.lastGenerated, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          ) : (
                            <span className="text-muted-foreground text-sm">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.nextScheduled ? (
                            format(report.nextScheduled, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          ) : (
                            <span className="text-muted-foreground text-sm">Não agendado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.status === 'ativo' ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              <X className="h-3 w-3 mr-1" /> Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleGenerateReport(report.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Gerar Agora
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditReport(report)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Diálogo para editar relatório */}
          <Dialog open={isEditingReport} onOpenChange={setIsEditingReport}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{editingReport?.id ? 'Editar Relatório' : 'Novo Relatório'}</DialogTitle>
                <DialogDescription>
                  Configure os detalhes do seu relatório agendado.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue={activeReportTab} onValueChange={setActiveReportTab} className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="configuracao">Configuração</TabsTrigger>
                  <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
                  <TabsTrigger value="destinatarios">Destinatários</TabsTrigger>
                </TabsList>
                
                <TabsContent value="configuracao" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-name">Nome do Relatório</Label>
                      <Input 
                        id="report-name" 
                        value={editingReport?.name || ''}
                        onChange={(e) => setEditingReport(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Ex: Relatório Mensal de Vendas"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Tipo de Relatório</Label>
                      <Select 
                        value={editingReport?.type || 'vendas'}
                        onValueChange={(value) => {
                          const template = defaultReportTemplates.find(t => t.type === value);
                          if (template && editingReport) {
                            setEditingReport({
                              ...editingReport,
                              type: value as ReportType,
                              configuration: {
                                ...editingReport.configuration,
                                visualization: template.defaultVisualization
                              }
                            });
                            setSelectedReportTemplate(template);
                          }
                        }}
                      >
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(defaultReportTemplates.map(t => t.type))).map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="report-description">Descrição</Label>
                    <Textarea 
                      id="report-description" 
                      value={editingReport?.description || ''}
                      onChange={(e) => setEditingReport(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Descreva o propósito deste relatório"
                      rows={2}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="visualization-type">Tipo de Visualização</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {selectedReportTemplate?.supportedVisualizations.map(viz => (
                        <Button
                          key={viz}
                          type="button"
                          variant={editingReport?.configuration.visualization === viz ? 'default' : 'outline'}
                          className="flex flex-col items-center justify-center p-3 h-auto"
                          onClick={() => setEditingReport(prev => prev ? {
                            ...prev,
                            configuration: {
                              ...prev.configuration,
                              visualization: viz
                            }
                          } : null)}
                        >
                          {viz === 'line' && <LineChart className="h-6 w-6 mb-1" />}
                          {viz === 'bar' && <BarChart className="h-6 w-6 mb-1" />}
                          {viz === 'pie' && <PieChart className="h-6 w-6 mb-1" />}
                          {viz === 'donut' && <PieChart className="h-6 w-6 mb-1" />}
                          {viz === 'table' && <Table className="h-6 w-6 mb-1" />}
                          {viz === 'gauge' && <Activity className="h-6 w-6 mb-1" />}
                          {viz === 'radar' && <Radar className="h-6 w-6 mb-1" />}
                          <span className="text-xs mt-1">{viz}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Filtros Avançados</h3>
                      <Button variant="outline" size="sm">
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        Salvar Filtro
                      </Button>
                    </div>
                    
                    <AdvancedFilters 
                      filter={currentFilter} 
                      onFilterChange={setCurrentFilter} 
                      availableFields={selectedReportTemplate?.availableColumns || []}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="agendamento" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-frequency">Frequência</Label>
                      <Select 
                        value={editingReport?.frequency || 'sob demanda'}
                        onValueChange={(value) => setEditingReport(prev => prev ? {
                          ...prev, 
                          frequency: value as ReportFrequency
                        } : null)}
                      >
                        <SelectTrigger id="report-frequency">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diário">Diário</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="sob demanda">Sob Demanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-format">Formato de Saída</Label>
                      <Select 
                        value={editingReport?.format || 'pdf'}
                        onValueChange={(value) => setEditingReport(prev => prev ? {
                          ...prev, 
                          format: value as ReportFormat
                        } : null)}
                      >
                        <SelectTrigger id="report-format">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <Label className="mb-2 block">Status do Agendamento</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroup 
                          value={editingReport?.status || 'ativo'} 
                          onValueChange={(value) => setEditingReport(prev => prev ? {
                            ...prev, 
                            status: value as ReportStatus
                          } : null)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ativo" id="status-active" />
                            <Label htmlFor="status-active" className="cursor-pointer">
                              Ativo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="inativo" id="status-inactive" />
                            <Label htmlFor="status-inactive" className="cursor-pointer">
                              Inativo
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="destinatarios" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Destinatários do Relatório</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Destinatário
                      </Button>
                    </div>
                    
                    {(editingReport?.recipients || []).length === 0 ? (
                      <div className="border rounded-md p-4 text-center text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <p>Nenhum destinatário adicionado</p>
                        <p className="text-sm">Adicione emails para receber o relatório automaticamente</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editingReport?.recipients.map((recipient, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback>{recipient.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span>{recipient}</span>
                            </div>
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditingReport(false)}>Cancelar</Button>
                <Button onClick={handleSaveReport} className="ml-2">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Relatório
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="configuracao" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Configurações de Relatórios</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sliders className="h-5 w-5 mr-2" />
                  Preferências de Visualização
                </CardTitle>
                <CardDescription>
                  Configure como os relatórios serão exibidos no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tema Padrão dos Gráficos</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione o esquema de cores para seus relatórios
                    </p>
                  </div>
                  <Select defaultValue="corporate">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="vibrant">Vibrante</SelectItem>
                      <SelectItem value="monochrome">Monocromático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar Valores nos Gráficos</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibe valores numéricos nos elementos visuais
                    </p>
                  </div>
                  <Switch defaultChecked id="show-values" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Decimais Exibidos</Label>
                    <p className="text-sm text-muted-foreground">
                      Número de casas decimais em valores numéricos
                    </p>
                  </div>
                  <Select defaultValue="2">
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm">Salvar Preferências</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cloud className="h-5 w-5 mr-2" />
                  Dados e Armazenamento
                </CardTitle>
                <CardDescription>
                  Gerencie como os relatórios são armazenados e processados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache de Relatórios</Label>
                    <p className="text-sm text-muted-foreground">
                      Tempo para manter relatórios em cache
                    </p>
                  </div>
                  <Select defaultValue="24h">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecionar duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="6h">6 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Retenção de Relatórios</Label>
                    <p className="text-sm text-muted-foreground">
                      Período para manter histórico de relatórios gerados
                    </p>
                  </div>
                  <Select defaultValue="30d">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 dias</SelectItem>
                      <SelectItem value="30d">30 dias</SelectItem>
                      <SelectItem value="90d">90 dias</SelectItem>
                      <SelectItem value="365d">1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compressão de Relatórios</Label>
                    <p className="text-sm text-muted-foreground">
                      Comprime arquivos exportados para economizar espaço
                    </p>
                  </div>
                  <Switch defaultChecked id="compression" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="mr-2">Limpar Cache</Button>
                <Button size="sm">Salvar Configurações</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Permissões de Relatórios
              </CardTitle>
              <CardDescription>
                Configure quem pode acessar e gerenciar relatórios no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Usuário</TableHead>
                    <TableHead>Visualizar</TableHead>
                    <TableHead>Exportar</TableHead>
                    <TableHead>Criar</TableHead>
                    <TableHead>Editar</TableHead>
                    <TableHead>Excluir</TableHead>
                    <TableHead>Gerenciar Configurações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Administrador</TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Gerente</TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Operador</TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Visualizador</TableCell>
                    <TableCell><CheckCircle2 className="h-5 w-5 text-green-500" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                    <TableCell><X className="h-5 w-5 text-gray-300" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Restaurar Padrões</Button>
              <Button>Salvar Permissões</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 