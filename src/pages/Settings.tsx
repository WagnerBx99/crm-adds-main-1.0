import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Settings as SettingsIcon, 
  Link as LinkIcon, 
  Users, 
  Tag, 
  Kanban, 
  FileText, 
  Database, 
  BarChart,
  Search,
  Home,
  Palette,
  Package,
  ChevronRight,
  Menu,
  X,
  Check,
  Plus,
  Trash,
  Edit,
  Save,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  Key,
  MoreVertical,
  UserCog,
  ChevronDown,
  Loader2,
  ChevronUp,
  History
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TinyIntegrationSettings } from '@/components/settings/TinyIntegrationSettings';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Status, UserRole, rolePermissions, User } from '@/types';
import { statusColors, statusNames } from '@/lib/data';
import { userService } from '@/lib/services/userService';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { BackupSettings } from '@/components/settings/BackupSettings';
import { Checkbox } from "@/components/ui/checkbox";
import { ReportsSettings } from '@/components/settings/ReportsSettings';

// Definição temporária de statusTransitions para a página de configurações
const statusTransitions: Record<Status, Status[]> = {
  'FAZER': ['AJUSTE', 'APROVACAO'],
  'AJUSTE': ['APROVACAO', 'FAZER'],
  'APROVACAO': ['AGUARDANDO_APROVACAO', 'AJUSTE'],
  'AGUARDANDO_APROVACAO': ['APROVADO', 'AJUSTE'],
  'APROVADO': ['PRODUCAO', 'AJUSTE'],
  'ARTE_APROVADA': ['PRODUCAO', 'AJUSTE'],
  'PRODUCAO': ['EXPEDICAO', 'AJUSTE'],
  'EXPEDICAO': ['FAZER', 'AJUSTE']
};

// Tipos
type SettingCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
};

type ProductType = {
  id: string;
  name: string;
  description: string;
  customizationOptions: CustomizationOption[];
  active: boolean;
  visibleInPersonalization?: boolean;
  imageUrl?: string; // URL da imagem para personalização
};

type CustomizationOption = {
  id: string;
  name: string;
  type: 'text' | 'color' | 'size' | 'image' | 'checkbox';
  required: boolean;
  description?: string;
};

// Tipo para as etiquetas
type Label = {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  active: boolean;
};

// Dados de exemplo
const defaultProductTypes: ProductType[] = [
  {
    id: 'ADDS_IMPLANT',
    name: 'ADDS Implant',
    description: 'Produto premium para implantes dentários',
    active: true,
    visibleInPersonalization: true,
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png',
    customizationOptions: [
      { id: 'color', name: 'Cor', type: 'color', required: true },
      { id: 'size', name: 'Tamanho', type: 'size', required: true },
      { id: 'logo', name: 'Logo', type: 'image', required: false },
      { id: 'text', name: 'Texto', type: 'text', required: false }
    ]
  },
  {
    id: 'ADDS_ULTRA',
    name: 'ADDS Ultra',
    description: 'Nossa solução avançada para higiene oral',
    active: true,
    visibleInPersonalization: true,
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png',
    customizationOptions: [
      { id: 'color', name: 'Cor', type: 'color', required: true },
      { id: 'logo', name: 'Logo', type: 'image', required: false }
    ]
  },
  {
    id: 'RASPADOR_LINGUA',
    name: 'Raspador de Língua',
    description: 'Higiene completa com nosso raspador de língua',
    active: true,
    visibleInPersonalization: true,
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png',
    customizationOptions: [
      { id: 'color', name: 'Cor', type: 'color', required: true },
      { id: 'logo', name: 'Logo', type: 'image', required: false }
    ]
  },
  {
    id: 'ESTOJO_VIAGEM',
    name: 'Estojo de Viagem',
    description: 'Estojo para transporte de produtos dentários',
    active: true,
    visibleInPersonalization: true,
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png', // Usando imagem padrão
    customizationOptions: [
      { id: 'size', name: 'Tamanho', type: 'size', required: true },
      { id: 'color', name: 'Cor', type: 'color', required: true },
      { id: 'logo', name: 'Logo', type: 'image', required: true }
    ]
  }
];

// Categorias de configurações
const settingCategories: SettingCategory[] = [
  { 
    id: 'products', 
    name: 'Produtos', 
    icon: Package,
    description: 'Gerencie os tipos de produtos e opções de personalização'
  },
  { 
    id: 'kanban', 
    name: 'Kanban', 
    icon: Kanban,
    description: 'Configure as colunas e fluxos de trabalho do quadro Kanban'
  },
  { 
    id: 'users', 
    name: 'Usuários', 
    icon: Users,
    description: 'Gerencie usuários, permissões e funções no sistema'
  },
  { 
    id: 'labels', 
    name: 'Etiquetas', 
    icon: Tag,
    description: 'Configure as etiquetas para categorização de pedidos'
  },
  { 
    id: 'notifications', 
    name: 'Notificações', 
    icon: Bell,
    description: 'Configure alertas e notificações do sistema'
  },
  { 
    id: 'system', 
    name: 'Sistema', 
    icon: SettingsIcon,
    description: 'Configurações gerais do sistema'
  },
  { 
    id: 'security', 
    name: 'Segurança', 
    icon: Shield,
    description: 'Configure autenticação, permissões e proteção do sistema'
  },
  { 
    id: 'integrations', 
    name: 'Integrações', 
    icon: LinkIcon,
    description: 'Configure integrações com sistemas externos'
  },
  { 
    id: 'backup', 
    name: 'Backup', 
    icon: Database,
    description: 'Gerenciamento de backup e recuperação de dados'
  },
  { 
    id: 'reports', 
    name: 'Relatórios', 
    icon: BarChart,
    description: 'Configure relatórios e análises do sistema'
  }
];

// Dados de exemplo para etiquetas
const defaultLabels: Label[] = [
  {
    id: 'urgente',
    name: 'Urgente',
    color: '#f44336',
    description: 'Pedidos que precisam de atenção imediata',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'prioritario',
    name: 'Prioritário',
    color: '#ff9800',
    description: 'Pedidos com alta prioridade',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'cliente-vip',
    name: 'Cliente VIP',
    color: '#9c27b0',
    description: 'Pedidos de clientes especiais',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'em-atraso',
    name: 'Em Atraso',
    color: '#e91e63',
    description: 'Pedidos que estão atrasados',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'aguardando-cliente',
    name: 'Aguardando Cliente',
    color: '#2196f3',
    description: 'Pedidos que estão aguardando resposta do cliente',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'finalizado',
    name: 'Finalizado',
    color: '#4caf50',
    description: 'Pedidos concluídos',
    createdAt: new Date(),
    active: true
  },
  {
    id: 'cancelado',
    name: 'Cancelado',
    color: '#9e9e9e',
    description: 'Pedidos cancelados',
    createdAt: new Date(),
    active: false
  }
];

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState<string>('products');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false);
  
  // Estado para o usuário atual
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Estados para gerenciamento de etiquetas
  const [labels, setLabels] = useState<Label[]>([]);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState<boolean>(false);
  const [isNewLabel, setIsNewLabel] = useState<boolean>(false);
  const [labelErrors, setLabelErrors] = useState<Record<string, string>>({});
  const [labelSearchQuery, setLabelSearchQuery] = useState<string>('');
  const [showInactiveLabels, setShowInactiveLabels] = useState<boolean>(false);
  const [isDeleteLabelDialogOpen, setIsDeleteLabelDialogOpen] = useState<boolean>(false);
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);
  const [labelAuditLogs, setLabelAuditLogs] = useState<{
    action: 'create' | 'update' | 'delete' | 'restore';
    labelId: string;
    labelName: string;
    timestamp: Date;
    userId: string;
    userName: string;
  }[]>([]);
  
  // Estados para gerenciamento das colunas do Kanban
  const [kanbanColumns, setKanbanColumns] = useState<Record<Status, { name: string, color: string, active: boolean }>>({
    'FAZER': { name: statusNames['FAZER'], color: statusColors['FAZER'].replace('bg-', ''), active: true },
    'AJUSTE': { name: statusNames['AJUSTE'], color: statusColors['AJUSTE'].replace('bg-', ''), active: true },
    'APROVACAO': { name: statusNames['APROVACAO'], color: statusColors['APROVACAO'].replace('bg-', ''), active: true },
    'AGUARDANDO_APROVACAO': { name: statusNames['AGUARDANDO_APROVACAO'], color: statusColors['AGUARDANDO_APROVACAO'].replace('bg-', ''), active: true },
    'APROVADO': { name: statusNames['APROVADO'], color: statusColors['APROVADO'].replace('bg-', ''), active: true },
    'ARTE_APROVADA': { name: statusNames['ARTE_APROVADA'], color: statusColors['ARTE_APROVADA'].replace('bg-', ''), active: true },
    'PRODUCAO': { name: statusNames['PRODUCAO'], color: statusColors['PRODUCAO'].replace('bg-', ''), active: true },
    'EXPEDICAO': { name: statusNames['EXPEDICAO'], color: statusColors['EXPEDICAO'].replace('bg-', ''), active: true },
  });
  const [editingColumn, setEditingColumn] = useState<{ id: Status, name: string, color: string } | null>(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState<boolean>(false);
  
  // Efeito para definir a categoria ativa com base no parâmetro de consulta 'tab'
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && settingCategories.some(cat => cat.id === tabParam)) {
      setActiveCategory(tabParam);
    }
  }, [searchParams]);
  
  // Carregar dados iniciais
  useEffect(() => {
    // Carregar produtos
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(defaultProductTypes);
      localStorage.setItem('products', JSON.stringify(defaultProductTypes));
    }
    
    // Carregar etiquetas
    const storedLabels = localStorage.getItem('labels');
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels));
    } else {
      setLabels(defaultLabels);
      localStorage.setItem('labels', JSON.stringify(defaultLabels));
    }
    
    // Carregar o usuário atual
    const loadedUser = userService.getCurrentUser();
    console.log('Settings: Usuário carregado:', loadedUser);
    setCurrentUser(loadedUser);
    
    // Verificar se o usuário tem permissão para acessar configurações
    if (loadedUser) {
      const canAccess = loadedUser.role === 'MASTER' || 
        rolePermissions[loadedUser.role].canAccessSettings;
      console.log('Settings: Usuário pode acessar configurações:', canAccess);
      
      // Verificar permissão para notificações
      const canManageNotifications = loadedUser.role === 'MASTER' ||
        rolePermissions[loadedUser.role].canManageNotifications;
      console.log('Settings: Usuário pode gerenciar notificações:', canManageNotifications);
    }
    
    // Carregar logs de auditoria de etiquetas
    const storedLabelLogs = localStorage.getItem('labelAuditLogs');
    if (storedLabelLogs) {
      setLabelAuditLogs(JSON.parse(storedLabelLogs));
    }
  }, []);
  
  // Filtrar produtos com base na pesquisa e no estado ativo/inativo
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesActiveState = showInactive || product.active;
    
    return matchesSearch && matchesActiveState;
  });
  
  // Validação de formulário
  const validateProduct = (product: ProductType): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!product.name.trim()) {
      errors.name = 'O nome do produto é obrigatório';
    }
    
    if (!product.id.trim()) {
      errors.id = 'O ID do produto é obrigatório';
    } else if (
      products.some(p => p.id === product.id && (isNewProduct || (editingProduct && p.id !== editingProduct.id)))
    ) {
      errors.id = 'Este ID já está em uso por outro produto';
    }
    
    return errors;
  };
  
  // Manipuladores de eventos
  const handleToggleProductActive = (productId: string) => {
    const updatedProducts = products.map(product => 
      product.id === productId 
        ? { ...product, active: !product.active } 
        : product
    );
    setProducts(updatedProducts);
    toast.success('Status do produto atualizado com sucesso!');
  };
  
  const handleToggleProductVisibility = (productId: string) => {
    const updatedProducts = products.map(product => 
      product.id === productId 
        ? { ...product, visibleInPersonalization: !product.visibleInPersonalization } 
        : product
    );
    setProducts(updatedProducts);
    toast.success('Visibilidade do produto atualizada com sucesso!');
  };
  
  const handleEditProduct = (product: ProductType) => {
    setEditingProduct({ ...product });
    setIsNewProduct(false);
    setErrors({});
    setIsProductDialogOpen(true);
  };
  
  const handleSaveProduct = () => {
    if (!editingProduct) return;
    
    // Validar os campos obrigatórios
    const errors = validateProduct(editingProduct);
    if (Object.keys(errors).length > 0) {
      // Mostrar erro para cada campo inválido
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
      return;
    }
    
    console.log('Salvando produto com URL de imagem:', editingProduct.imageUrl);
    
    // Encontrar o índice do produto atual (se for edição) ou -1 (se for novo)
    const productIndex = products.findIndex(p => p.id === editingProduct.id);
    
    if (productIndex >= 0) {
      // Atualizar produto existente
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...editingProduct,
        // Garantir que a imageUrl seja mantida
        imageUrl: editingProduct.imageUrl || ''
      };
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produto atualizado com sucesso!');
    } else {
      // Adicionar novo produto
      const newProducts = [...products, {
        ...editingProduct,
        // Garantir que a imageUrl seja mantida
        imageUrl: editingProduct.imageUrl || ''
      }];
      setProducts(newProducts);
      localStorage.setItem('products', JSON.stringify(newProducts));
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produto adicionado com sucesso!');
    }
    
    // Limpar o produto em edição e fechar o diálogo
    setEditingProduct(null);
    setIsNewProduct(false);
  };
  
  const handleAddCustomizationOption = () => {
    if (!editingProduct) return;
    
    const newOption: CustomizationOption = {
      id: `option-${Date.now()}`,
      name: 'Nova Opção',
      type: 'text',
      required: false,
      description: ''
    };
    
    setEditingProduct({
      ...editingProduct,
      customizationOptions: [...editingProduct.customizationOptions, newOption]
    });
  };
  
  const handleRemoveCustomizationOption = (optionId: string) => {
    if (!editingProduct) return;
    
    setEditingProduct({
      ...editingProduct,
      customizationOptions: editingProduct.customizationOptions.filter(
        option => option.id !== optionId
      )
    });
  };
  
  const handleUpdateCustomizationOption = (optionId: string, updates: Partial<CustomizationOption>) => {
    if (!editingProduct) return;
    
    setEditingProduct({
      ...editingProduct,
      customizationOptions: editingProduct.customizationOptions.map(option => 
        option.id === optionId ? { ...option, ...updates } : option
      )
    });
  };
  
  // Função para adicionar um novo produto
  const handleAddNewProduct = () => {
    const newProduct: ProductType = {
      id: '',
      name: '',
      description: '',
      active: true,
      visibleInPersonalization: true,
      imageUrl: '',
      customizationOptions: []
    };
    
    setEditingProduct(newProduct);
    setIsNewProduct(true);
    setErrors({});
    setIsProductDialogOpen(true);
  };
  
  // Função para excluir um produto
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      toast.success('Produto excluído com sucesso!');
    }
  };
  
  // Funções para gerenciar as colunas do Kanban
  const handleEditColumn = (columnId: Status) => {
    setEditingColumn({
      id: columnId,
      name: kanbanColumns[columnId].name,
      color: kanbanColumns[columnId].color
    });
    setIsColumnDialogOpen(true);
  };
  
  const handleSaveColumn = () => {
    if (!editingColumn) return;
    
    setKanbanColumns({
      ...kanbanColumns,
      [editingColumn.id]: {
        ...kanbanColumns[editingColumn.id],
        name: editingColumn.name,
        color: editingColumn.color
      }
    });
    
    setIsColumnDialogOpen(false);
    setEditingColumn(null);
    toast.success('Coluna atualizada com sucesso!');
  };
  
  const handleToggleColumnVisibility = (columnId: Status) => {
    setKanbanColumns({
      ...kanbanColumns,
      [columnId]: {
        ...kanbanColumns[columnId],
        active: !kanbanColumns[columnId].active
      }
    });
    
    toast.success(`Coluna ${kanbanColumns[columnId].active ? 'ocultada' : 'exibida'} com sucesso!`);
  };
  
  // Carregar etiquetas do localStorage na inicialização
  useEffect(() => {
    const savedLabels = localStorage.getItem('labels');
    if (savedLabels) {
      try {
        // Converter as strings de data para objetos Date
        const parsedLabels = JSON.parse(savedLabels, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        setLabels(parsedLabels);
      } catch (error) {
        console.error('Erro ao carregar etiquetas do localStorage:', error);
        setLabels(defaultLabels);
      }
    } else {
      setLabels(defaultLabels);
    }
    
    // Carregar logs de auditoria
    const savedLogs = localStorage.getItem('labelAuditLogs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs, (key, value) => {
          if (key === 'timestamp') {
            return new Date(value);
          }
          return value;
        });
        setLabelAuditLogs(parsedLogs);
      } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
        setLabelAuditLogs([]);
      }
    }
  }, []);
  
  // Salvar etiquetas no localStorage quando houver alterações
  useEffect(() => {
    if (labels.length > 0) {
      localStorage.setItem('labels', JSON.stringify(labels));
    }
  }, [labels]);
  
  // Salvar logs de auditoria no localStorage
  useEffect(() => {
    if (labelAuditLogs.length > 0) {
      localStorage.setItem('labelAuditLogs', JSON.stringify(labelAuditLogs));
    }
  }, [labelAuditLogs]);
  
  // Filtrar etiquetas com base na pesquisa e no estado ativo/inativo
  const filteredLabels = useMemo(() => {
    return labels
      .filter(label => 
        (showInactiveLabels || label.active) &&
        (labelSearchQuery === '' || 
          label.name.toLowerCase().includes(labelSearchQuery.toLowerCase()) ||
          (label.description && label.description.toLowerCase().includes(labelSearchQuery.toLowerCase())))
      )
      .sort((a, b) => {
        // Ordenar por status (ativos primeiro) e depois por nome
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [labels, labelSearchQuery, showInactiveLabels]);
  
  // Função para adicionar log de auditoria
  const addLabelAuditLog = (action: 'create' | 'update' | 'delete' | 'restore', label: Label) => {
    if (!currentUser) return;
    
    const newLog = {
      action,
      labelId: label.id,
      labelName: label.name,
      timestamp: new Date(),
      userId: currentUser.id,
      userName: currentUser.name
    };
    
    setLabelAuditLogs(prev => [newLog, ...prev]);
    
    // Salvar logs no localStorage
    const storedLogs = localStorage.getItem('labelAuditLogs');
    const existingLogs = storedLogs ? JSON.parse(storedLogs) : [];
    localStorage.setItem('labelAuditLogs', JSON.stringify([newLog, ...existingLogs]));
  };
  
  // Validação de formulário para etiquetas
  const validateLabel = (label: Label): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!label.name.trim()) {
      errors.name = 'O nome da etiqueta é obrigatório';
    }
    
    if (!label.id.trim()) {
      errors.id = 'O ID da etiqueta é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(label.id)) {
      errors.id = 'O ID deve conter apenas letras minúsculas, números e hífens';
    } else if (isNewLabel && labels.some(l => l.id === label.id)) {
      errors.id = 'Este ID já está em uso por outra etiqueta';
    }
    
    if (!label.color.trim()) {
      errors.color = 'A cor da etiqueta é obrigatória';
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(label.color)) {
      errors.color = 'A cor deve estar no formato hexadecimal (ex: #FF0000)';
    }
    
    return errors;
  };
  
  // Manipuladores de eventos para etiquetas
  const handleToggleLabelActive = (labelId: string) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para realizar esta ação');
      return;
    }
    
    if (!(rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER')) {
      toast.error('Você não tem permissão para gerenciar etiquetas');
      return;
    }
    
    const label = labels.find(l => l.id === labelId);
    if (!label) return;
    
    const updatedLabels = labels.map(label => 
      label.id === labelId 
        ? { 
            ...label, 
            active: !label.active,
            updatedAt: new Date(),
            updatedBy: currentUser?.id
          } 
        : label
    );
    
    setLabels(updatedLabels);
    addLabelAuditLog(label.active ? 'delete' : 'restore', {
      ...label,
      active: !label.active
    });
    
    toast.success(`Etiqueta ${label.active ? 'desativada' : 'ativada'} com sucesso!`);
  };
  
  const handleEditLabel = (label: Label) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para realizar esta ação');
      return;
    }
    
    if (!(rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER')) {
      toast.error('Você não tem permissão para gerenciar etiquetas');
      return;
    }
    
    setEditingLabel({ ...label });
    setIsNewLabel(false);
    setLabelErrors({});
    setIsLabelDialogOpen(true);
  };
  
  const handleAddNewLabel = () => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para realizar esta ação');
      return;
    }
    
    if (!(rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER')) {
      toast.error('Você não tem permissão para gerenciar etiquetas');
      return;
    }
    
    const newLabel: Label = {
      id: '',
      name: '',
      color: '#21add6', // Cor padrão do sistema
      description: '',
      createdAt: new Date(),
      createdBy: currentUser?.id,
      active: true
    };
    
    setEditingLabel(newLabel);
    setIsNewLabel(true);
    setLabelErrors({});
    setIsLabelDialogOpen(true);
  };
  
  const handleSaveLabel = () => {
    if (!editingLabel || !currentUser) return;
    
    const validationErrors = validateLabel(editingLabel);
    if (Object.keys(validationErrors).length > 0) {
      setLabelErrors(validationErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    if (isNewLabel) {
      const newLabel = {
        ...editingLabel,
        createdAt: new Date(),
        createdBy: currentUser?.id
      };
      
      setLabels([...labels, newLabel]);
      addLabelAuditLog('create', newLabel);
      toast.success('Nova etiqueta adicionada com sucesso!');
    } else {
      const updatedLabels = labels.map(label => 
        label.id === editingLabel.id 
          ? {
              ...editingLabel,
              updatedAt: new Date(),
              updatedBy: currentUser?.id
            }
          : label
      );
      
      setLabels(updatedLabels);
      addLabelAuditLog('update', {
        ...editingLabel,
        updatedAt: new Date(),
        updatedBy: currentUser?.id
      });
      
      toast.success('Etiqueta atualizada com sucesso!');
    }
    
    setIsLabelDialogOpen(false);
    setEditingLabel(null);
    setLabelErrors({});
  };
  
  const handleDeleteLabel = (label: Label) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para realizar esta ação');
      return;
    }
    
    if (!(rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER')) {
      toast.error('Você não tem permissão para gerenciar etiquetas');
      return;
    }
    
    setLabelToDelete(label);
    setIsDeleteLabelDialogOpen(true);
  };
  
  const confirmDeleteLabel = () => {
    if (!labelToDelete || !currentUser) return;
    
    // Soft delete - apenas marca como inativo
    const updatedLabels = labels.map(label => 
      label.id === labelToDelete.id 
        ? { 
            ...label, 
            active: false,
            updatedAt: new Date(),
            updatedBy: currentUser?.id
          } 
        : label
    );
    
    setLabels(updatedLabels);
    addLabelAuditLog('delete', {
      ...labelToDelete,
      active: false,
      updatedAt: new Date(),
      updatedBy: currentUser?.id
    });
    
    toast.success('Etiqueta excluída com sucesso!');
    setIsDeleteLabelDialogOpen(false);
    setLabelToDelete(null);
  };
  
  // Renderizar o conteúdo da categoria ativa
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Produtos e Personalização</h2>
                <p className="text-muted-foreground">
                  Gerencie os tipos de produtos disponíveis e suas opções de personalização
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-inactive" 
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label htmlFor="show-inactive">Mostrar inativos</Label>
                </div>
                <Button onClick={handleAddNewProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className={cn(!product.active && "opacity-70")}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center">
                          {product.name}
                          {!product.active && (
                            <Badge variant="outline" className="ml-2 text-xs">Inativo</Badge>
                          )}
                          {!product.visibleInPersonalization && (
                            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200">Oculto</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleProductVisibility(product.id)}
                          title={product.visibleInPersonalization ? "Ocultar na personalização" : "Mostrar na personalização"}
                        >
                          {product.visibleInPersonalization ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                          title="Editar produto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive"
                          title="Excluir produto"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Opções de Personalização:</h4>
                      <ul className="space-y-1">
                        {product.customizationOptions.map(option => (
                          <li key={option.id} className="text-sm flex items-center">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                            <span className="font-medium">{option.name}</span>
                            {option.required && (
                              <Badge variant="secondary" className="ml-2 text-[10px] px-1">Obrigatório</Badge>
                            )}
                          </li>
                        ))}
                        
                        {product.customizationOptions.length === 0 && (
                          <li className="text-sm text-gray-500 italic">
                            Nenhuma opção de personalização configurada
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
                  <Package className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery 
                      ? `Nenhum produto corresponde à pesquisa "${searchQuery}"`
                      : 'Nenhum produto disponível. Adicione um novo produto para começar.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'kanban':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Configurações do Kanban</h2>
                <p className="text-muted-foreground">
                  Configure as colunas do quadro Kanban
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Colunas do Kanban</CardTitle>
                  <CardDescription>
                    Configure as colunas que aparecem no quadro Kanban e suas propriedades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {Object.entries(kanbanColumns).map(([status, column]) => (
                      <div key={status} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-4 h-4 rounded-full", `bg-${column.color}`)} />
                          <div>
                            <p className="font-medium">{column.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditColumn(status as Status)}
                            title="Editar coluna"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground"
                            onClick={() => handleToggleColumnVisibility(status as Status)}
                            title={column.active ? "Ocultar coluna" : "Mostrar coluna"}
                          >
                            {column.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    // Restaurar configurações padrão
                    setKanbanColumns({
                      'FAZER': { name: statusNames['FAZER'], color: statusColors['FAZER'].replace('bg-', ''), active: true },
                      'AJUSTE': { name: statusNames['AJUSTE'], color: statusColors['AJUSTE'].replace('bg-', ''), active: true },
                      'APROVACAO': { name: statusNames['APROVACAO'], color: statusColors['APROVACAO'].replace('bg-', ''), active: true },
                      'AGUARDANDO_APROVACAO': { name: statusNames['AGUARDANDO_APROVACAO'], color: statusColors['AGUARDANDO_APROVACAO'].replace('bg-', ''), active: true },
                      'APROVADO': { name: statusNames['APROVADO'], color: statusColors['APROVADO'].replace('bg-', ''), active: true },
                      'ARTE_APROVADA': { name: statusNames['ARTE_APROVADA'], color: statusColors['ARTE_APROVADA'].replace('bg-', ''), active: true },
                      'PRODUCAO': { name: statusNames['PRODUCAO'], color: statusColors['PRODUCAO'].replace('bg-', ''), active: true },
                      'EXPEDICAO': { name: statusNames['EXPEDICAO'], color: statusColors['EXPEDICAO'].replace('bg-', ''), active: true },
                    });
                    toast.success('Configurações padrão restauradas com sucesso!');
                  }}>
                    Restaurar Padrões
                  </Button>
                  <Button onClick={() => toast.success('Configurações salvas com sucesso!')}>
                    Salvar Configurações
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        );
      
      case 'users':
        return <UserManagement />;
      
      case 'labels':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Gerenciamento de Etiquetas</h2>
                <p className="text-muted-foreground">
                  Configure as etiquetas utilizadas para categorizar e filtrar pedidos
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-inactive-labels" 
                    checked={showInactiveLabels}
                    onCheckedChange={setShowInactiveLabels}
                  />
                  <Label htmlFor="show-inactive-labels">Mostrar inativas</Label>
                </div>
                {currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && (
                  <Button 
                    onClick={handleAddNewLabel}
                    size="lg"
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-md"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Nova Etiqueta
                  </Button>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar etiquetas por nome ou descrição..."
                className="pl-8"
                value={labelSearchQuery}
                onChange={(e) => setLabelSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLabels.length > 0 ? (
                filteredLabels.map(label => (
                  <Card 
                    key={label.id} 
                    className={cn(
                      "border-l-4 transition-all duration-200 hover:shadow-md",
                      !label.active && "opacity-70",
                      label.active ? `border-l-[${label.color}]` : "border-l-gray-300"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && handleEditLabel(label)}
                        >
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" 
                            style={{ backgroundColor: label.color }}
                          >
                            <Tag className="h-5 w-5 text-white" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="flex items-center group">
                              {label.name}
                              {!label.active && (
                                <Badge variant="outline" className="ml-2 text-xs">Inativa</Badge>
                              )}
                              {currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && (
                                <Edit className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-70 transition-opacity" />
                              )}
                            </CardTitle>
                            <CardDescription>{label.description}</CardDescription>
                          </div>
                        </div>
                        {currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && (
                          <div className="flex">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleLabelActive(label.id)}
                              title={label.active ? "Desativar etiqueta" : "Ativar etiqueta"}
                              className="hover:bg-muted"
                            >
                              {label.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditLabel(label)}
                              title="Editar etiqueta"
                              className="hover:bg-muted"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteLabel(label)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Excluir etiqueta"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Cor:</span>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: label.color }}
                            ></div>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{label.color}</code>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">ID:</span>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{label.id}</code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Criada em:</span>
                          <span>{new Date(label.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-muted rounded-full p-3 mb-4">
                    <Tag className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhuma etiqueta encontrada</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    {labelSearchQuery 
                      ? "Tente ajustar sua busca ou criar uma nova etiqueta" 
                      : "Comece criando sua primeira etiqueta"}
                  </p>
                  {currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && (
                    <Button onClick={handleAddNewLabel}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Etiqueta
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Botão flutuante para adicionar etiqueta (visível em telas menores) */}
            {currentUser && (rolePermissions[currentUser.role].canManageLabels || currentUser.role === 'MASTER') && (
              <Button
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg md:hidden"
                size="icon"
                onClick={handleAddNewLabel}
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </div>
        );
      
      case 'notifications':
        return <NotificationSettings />;
      
      case 'system':
        return <SystemSettings />;
      
      case 'security':
        return <SecuritySettings />;
      
      case 'integrations':
        return <SystemSettings />;
        
      case 'backup':
        return <BackupSettings />;
        
      case 'reports':
        return <ReportsSettings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <SettingsIcon className="h-12 w-12 text-gray-500" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-medium mb-2">Configurações em Desenvolvimento</h3>
              <p className="text-muted-foreground mb-6">
                Esta seção está em desenvolvimento e estará disponível em breve.
              </p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-6 pb-0">
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden p-6 pt-4">
        <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
          <div className="border-b mb-6 sticky top-0 bg-background z-10 pb-2 pt-2">
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Configurações</h3>
                <div className="md:hidden">
                  <Select
                    value={activeCategory}
                    onValueChange={setActiveCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {settingCategories.filter(cat => cat.id !== 'audit').map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="hidden md:block">
                <TabsList className="w-full flex flex-wrap justify-start gap-1">
                  {settingCategories.filter(cat => cat.id !== 'audit').map(category => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm"
                    >
                      <category.icon className="h-4 w-4" />
                      <span>{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <TabsContent value={activeCategory} className="mt-0 h-full">
                {renderCategoryContent()}
        </TabsContent>
            </ScrollArea>
          </div>
      </Tabs>
      </div>
      
      {/* Diálogo para editar/adicionar produto */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewProduct ? 'Adicionar Novo Produto' : 'Editar Produto'}</DialogTitle>
            <DialogDescription>
              {isNewProduct 
                ? 'Preencha os detalhes para adicionar um novo produto ao catálogo' 
                : 'Modifique as informações e opções de personalização do produto'}
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Nome do Produto</Label>
                  <Input 
                    id="product-name" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="Ex: ADDS Implant"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-id">ID do Produto</Label>
                  <Input 
                    id="product-id" 
                    value={editingProduct.id}
                    onChange={(e) => setEditingProduct({...editingProduct, id: e.target.value})}
                    className={errors.id ? "border-red-500" : ""}
                    placeholder="Ex: ADDS_IMPLANT"
                  />
                  {errors.id && (
                    <p className="text-xs text-red-500">{errors.id}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-description">Descrição</Label>
                <Textarea 
                  id="product-description" 
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  placeholder="Descrição detalhada do produto"
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-image">Imagem para Personalização</Label>
                <div className="flex flex-col gap-4">
                  {editingProduct.imageUrl && (
                    <div className="relative max-w-sm mx-auto border rounded-md overflow-hidden bg-gray-50 p-2">
                      <img 
                        src={editingProduct.imageUrl} 
                        alt={editingProduct.name}
                        className="h-48 w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={() => setEditingProduct({...editingProduct, imageUrl: ''})}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        id="product-image" 
                        value={editingProduct.imageUrl || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                        placeholder="URL da imagem (ex: https://exemplo.com/imagem.jpg)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Verificar se a URL é válida
                          if (editingProduct.imageUrl) {
                            const img = new Image();
                            img.onload = () => toast.success("URL da imagem verificada com sucesso");
                            img.onerror = () => toast.error("A URL da imagem parece inválida. Verifique se a URL está correta.");
                            img.src = editingProduct.imageUrl;
                          } else {
                            toast.error("Por favor, insira uma URL de imagem");
                          }
                        }}
                      >
                        Verificar
                      </Button>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center"
                      onClick={() => {
                        // Abrir seletor de URLs comuns
                        const commonUrls = [
                          'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png',
                          'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png',
                          'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png'
                        ];
                        
                        // Exibir diálogo com URLs comuns
                        const url = prompt(
                          'Selecione uma URL de imagem pré-definida ou insira sua própria URL:', 
                          editingProduct.imageUrl || commonUrls[0]
                        );
                        
                        if (url) {
                          setEditingProduct({...editingProduct, imageUrl: url});
                        }
                      }}
                    >
                      <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Clique para inserir uma URL de imagem</p>
                      <p className="text-xs text-muted-foreground">Você pode usar URLs externas para as imagens dos produtos</p>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Recomendações para imagens:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Use imagens de alta qualidade com fundo transparente quando possível</li>
                        <li>Tamanho recomendado: 800x600 pixels ou maior</li>
                        <li>Formatos suportados: PNG, JPG ou SVG</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="product-active" 
                    checked={editingProduct.active}
                    onCheckedChange={(checked) => setEditingProduct({...editingProduct, active: checked})}
                  />
                  <Label htmlFor="product-active">Produto Ativo</Label>
                </div>
               
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="product-visible" 
                    checked={editingProduct.visibleInPersonalization}
                    onCheckedChange={(checked) => setEditingProduct({...editingProduct, visibleInPersonalization: checked})}
                  />
                  <Label htmlFor="product-visible">Visível na Personalização</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-48 text-xs">Se desativado, o produto não aparecerá nas opções de personalização, mas continuará disponível no sistema</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
      
              <Separator />
      
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Opções de Personalização</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCustomizationOption}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Opção
                  </Button>
                </div>
                
                {editingProduct.customizationOptions.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-gray-50">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma opção de personalização configurada.
                      Adicione opções para permitir a personalização deste produto.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editingProduct.customizationOptions.map((option, index) => (
                      <Card key={option.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Opção #{index + 1}</h4>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveCustomizationOption(option.id)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label htmlFor={`option-name-${option.id}`}>Nome da Opção</Label>
                              <Input 
                                id={`option-name-${option.id}`} 
                                value={option.name}
                                onChange={(e) => handleUpdateCustomizationOption(option.id, { name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`option-type-${option.id}`}>Tipo</Label>
                              <Select 
                                value={option.type}
                                onValueChange={(value) => handleUpdateCustomizationOption(
                                  option.id, 
                                  { type: value as CustomizationOption['type'] }
                                )}
                              >
                                <SelectTrigger id={`option-type-${option.id}`}>
                                  <SelectValue placeholder="Selecione um tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto</SelectItem>
                                  <SelectItem value="color">Cor</SelectItem>
                                  <SelectItem value="size">Tamanho</SelectItem>
                                  <SelectItem value="image">Imagem</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <Label htmlFor={`option-description-${option.id}`}>Descrição (opcional)</Label>
                            <Input 
                              id={`option-description-${option.id}`} 
                              value={option.description || ''}
                              onChange={(e) => handleUpdateCustomizationOption(option.id, { description: e.target.value })}
                              placeholder="Descrição ou instruções para esta opção"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`option-required-${option.id}`} 
                              checked={option.required}
                              onCheckedChange={(checked) => handleUpdateCustomizationOption(option.id, { required: checked })}
                            />
                            <Label htmlFor={`option-required-${option.id}`}>Opção Obrigatória</Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProductDialogOpen(false);
                setEditingProduct(null);
                setErrors({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct}>
              {isNewProduct ? 'Adicionar Produto' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar coluna do Kanban */}
      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Coluna do Kanban</DialogTitle>
            <DialogDescription>
              Modifique as propriedades da coluna do Kanban
            </DialogDescription>
          </DialogHeader>
          
          {editingColumn && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="column-name">Nome da Coluna</Label>
                <Input 
                  id="column-name" 
                  value={editingColumn.name}
                  onChange={(e) => setEditingColumn({...editingColumn, name: e.target.value})}
                  placeholder="Ex: Em Progresso"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="column-color">Cor da Coluna</Label>
                <Select 
                  value={editingColumn.color}
                  onValueChange={(value) => setEditingColumn({...editingColumn, color: value})}
                >
                  <SelectTrigger id="column-color">
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow-500">Amarelo</SelectItem>
                    <SelectItem value="orange-500">Laranja</SelectItem>
                    <SelectItem value="red-500">Vermelho</SelectItem>
                    <SelectItem value="blue-500">Azul</SelectItem>
                    <SelectItem value="green-500">Verde</SelectItem>
                    <SelectItem value="purple-500">Roxo</SelectItem>
                    <SelectItem value="indigo-500">Índigo</SelectItem>
                    <SelectItem value="slate-500">Cinza</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <div className={cn("w-4 h-4 rounded-full", `bg-${editingColumn.color}`)} />
                  <span className="text-xs text-muted-foreground">Visualização da cor</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsColumnDialogOpen(false);
                setEditingColumn(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveColumn}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar/adicionar etiqueta */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isNewLabel ? 'Adicionar Nova Etiqueta' : 'Editar Etiqueta'}</DialogTitle>
            <DialogDescription>
              {isNewLabel 
                ? 'Preencha os detalhes para adicionar uma nova etiqueta ao sistema' 
                : 'Modifique as informações da etiqueta'}
            </DialogDescription>
          </DialogHeader>
          
          {editingLabel && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-name" className="flex items-center">
                    Nome da Etiqueta <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="label-name" 
                    value={editingLabel.name}
                    onChange={(e) => setEditingLabel({...editingLabel, name: e.target.value})}
                    className={labelErrors.name ? "border-red-500" : ""}
                    placeholder="Ex: Urgente"
                    autoFocus
                  />
                  {labelErrors.name && (
                    <p className="text-xs text-red-500">{labelErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-id" className="flex items-center">
                    ID da Etiqueta <span className="text-red-500 ml-1">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            O ID é usado internamente pelo sistema e deve conter apenas letras minúsculas, 
                            números e hífens. Não pode ser alterado após a criação.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="label-id" 
                    value={editingLabel.id}
                    onChange={(e) => setEditingLabel({...editingLabel, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                    className={labelErrors.id ? "border-red-500" : ""}
                    placeholder="Ex: urgente"
                    disabled={!isNewLabel} // Não permitir editar o ID de etiquetas existentes
                  />
                  {labelErrors.id && (
                    <p className="text-xs text-red-500">{labelErrors.id}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label-color" className="flex items-center">
                  Cor da Etiqueta <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex space-x-2">
                  <div 
                    className="w-10 h-10 rounded-md border shadow-sm"
                    style={{ backgroundColor: editingLabel.color }}
                  ></div>
                  <Input 
                    id="label-color" 
                    value={editingLabel.color}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Garantir que o valor comece com #
                      const color = value.startsWith('#') ? value : `#${value}`;
                      setEditingLabel({...editingLabel, color});
                    }}
                    className={cn("font-mono", labelErrors.color ? "border-red-500" : "")}
                    placeholder="#FF0000"
                    maxLength={7}
                  />
                </div>
                {labelErrors.color && (
                  <p className="text-xs text-red-500">{labelErrors.color}</p>
                )}
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {[
                    '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
                    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
                    '#009688', '#4caf50', '#8bc34a', '#cddc39',
                    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
                    '#795548', '#9e9e9e', '#607d8b', '#000000',
                    '#21add6', '#f07d00', '#0b4269', '#ffffff'
                  ].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-md border transition-all",
                        editingLabel.color.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary ring-offset-2",
                        color === '#ffffff' && "border-gray-200"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingLabel({...editingLabel, color})}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label-description">Descrição (opcional)</Label>
                <Textarea 
                  id="label-description" 
                  value={editingLabel.description || ''}
                  onChange={(e) => setEditingLabel({...editingLabel, description: e.target.value})}
                  rows={3}
                  placeholder="Descreva o propósito desta etiqueta"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="label-active" 
                  checked={editingLabel.active}
                  onCheckedChange={(checked) => setEditingLabel({...editingLabel, active: checked})}
                />
                <Label htmlFor="label-active">Etiqueta Ativa</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLabelDialogOpen(false);
                setEditingLabel(null);
                setLabelErrors({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveLabel}>
              {isNewLabel ? 'Adicionar Etiqueta' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação para excluir etiqueta */}
      <Dialog open={isDeleteLabelDialogOpen} onOpenChange={setIsDeleteLabelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a etiqueta "{labelToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Atenção: Impacto nos pedidos existentes
                </p>
                <p className="text-sm">
                  Itens que utilizam esta etiqueta não a exibirão mais.
                  A etiqueta será marcada como inativa, mas seus dados serão preservados.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteLabelDialogOpen(false);
                setLabelToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteLabel}
            >
              Excluir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de gerenciamento de usuários
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<(User & { password?: string }) | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState<boolean>(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [editingInlineUserId, setEditingInlineUserId] = useState<string | null>(null);
  
  // Carregar usuários ao montar o componente
  useEffect(() => {
    const loadedUsers = userService.getUsers();
    setUsers(loadedUsers);
    setCurrentUser(userService.getCurrentUser());
  }, []);
  
  // Filtrar usuários com base na pesquisa e no estado ativo/inativo
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesActiveState = showInactive || user.active;
    
    return matchesSearch && matchesActiveState;
  });
  
  // Validação de formulário
  const validateUser = (user: User & { password?: string }): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!user.name.trim()) {
      errors.name = 'O nome do usuário é obrigatório';
    }
    
    if (!user.email.trim()) {
      errors.email = 'O email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      errors.email = 'Email inválido';
    } else if (
      users.some(u => u.email.toLowerCase() === user.email.toLowerCase() && 
        (isNewUser || (editingUser && u.id !== editingUser.id)))
    ) {
      errors.email = 'Este email já está em uso';
    }
    
    if (isNewUser && !user.password) {
      errors.password = 'A senha é obrigatória';
    } else if (user.password && user.password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (user.password && user.password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    
    return errors;
  };
  
  // Manipuladores de eventos
  const handleAddUser = () => {
    const newUser: User & { password?: string } = {
      id: '',
      name: '',
      email: '',
      passwordHash: '',
      role: 'PRESTADOR',
      active: true,
      createdAt: new Date(),
      password: '',
      department: ''
    };
    
    setEditingUser(newUser);
    setIsNewUser(true);
    setConfirmPassword('');
    setErrors({});
    setIsUserDialogOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    // Verificar permissões para editar usuários Master
    if (user.role === 'MASTER' && currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para editar usuários Master');
      return;
    }
    
    setEditingUser({ ...user, password: '' });
    setIsNewUser(false);
    setConfirmPassword('');
    setErrors({});
    setIsUserDialogOpen(true);
  };
  
  const handleSaveUser = () => {
    if (!editingUser) return;
    
    const validationErrors = validateUser(editingUser);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if (isNewUser) {
      // Verificar permissões para criar usuários Master
      if (editingUser.role === 'MASTER' && currentUser?.role !== 'MASTER') {
        toast.error('Você não tem permissão para criar usuários Master');
        return;
      }
      
      const newUser = userService.createUser({
        name: editingUser.name,
        email: editingUser.email,
        password: editingUser.password || '',
        role: editingUser.role,
        active: editingUser.active,
        phone: editingUser.phone,
        department: editingUser.department,
        avatar: editingUser.avatar
      });
      
      if (newUser) {
        setUsers(userService.getUsers());
        setIsUserDialogOpen(false);
        setEditingUser(null);
      }
    } else {
      // Verificar permissões para promover usuários a Master
      if (editingUser.role === 'MASTER' && 
          users.find(u => u.id === editingUser.id)?.role !== 'MASTER' && 
          currentUser?.role !== 'MASTER') {
        toast.error('Você não tem permissão para promover usuários a Master');
        return;
      }
      
      const updatedUser = userService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        password: editingUser.password,
        role: editingUser.role,
        active: editingUser.active,
        phone: editingUser.phone,
        department: editingUser.department,
        avatar: editingUser.avatar
      });
      
      if (updatedUser) {
        setUsers(userService.getUsers());
        setIsUserDialogOpen(false);
        setEditingUser(null);
      }
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    // Verificar permissões para excluir usuários Master
    if (user.role === 'MASTER' && currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para excluir usuários Master');
      return;
    }
    
    // Não permitir excluir o próprio usuário
    if (user.id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
      const success = userService.deleteUser(userId);
      
      if (success) {
        setUsers(userService.getUsers());
      }
    }
  };
  
  const handleToggleUserActive = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    // Verificar permissões para desativar usuários Master
    if (user.role === 'MASTER' && currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para desativar usuários Master');
      return;
    }
    
    // Não permitir desativar o próprio usuário
    if (user.id === currentUser?.id) {
      toast.error('Você não pode desativar sua própria conta');
      return;
    }
    
    const updatedUser = userService.updateUser(userId, {
      active: !user.active
    });
    
    if (updatedUser) {
      setUsers(userService.getUsers());
    }
  };
  
  // Função para obter o rótulo do perfil
  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'MASTER':
        return 'Master';
      case 'GESTOR':
        return 'Gestor';
      case 'PRESTADOR':
        return 'Prestador de Serviço';
      default:
        return role;
    }
  };
  
  // Função para obter a cor do badge do perfil
  const getRoleBadgeVariant = (role: UserRole): string => {
    switch (role) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'GESTOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRESTADOR':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Verificar se o usuário atual tem permissão para gerenciar usuários
  const canManageUsers = currentUser && rolePermissions[currentUser.role].canManageUsers;
  
  // Função para resetar a senha de um usuário
  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    // Verificar permissões para resetar senha de usuários Master
    if (user.role === 'MASTER' && currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para resetar a senha de usuários Master');
      return;
    }
    
    // Confirmar a ação
    if (confirm(`Tem certeza que deseja resetar a senha de ${user.name}? Uma nova senha será gerada.`)) {
      const tempPassword = userService.resetPassword(userId);
      
      if (tempPassword) {
        setResetPasswordUser(user);
        setNewPassword(tempPassword);
        setIsResetPasswordDialogOpen(true);
      }
    }
  };
  
  // Componente de card de usuário com edição inline
  const UserCard = ({ user }: { user: User }) => {
    const isEditing = editingInlineUserId === user.id;
    const [editedUser, setEditedUser] = useState<User>(user);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    
    // Inicializar o estado do usuário editado quando o modo de edição é ativado
    useEffect(() => {
      if (isEditing) {
        setEditedUser({ ...user });
        setHasChanges(false);
      }
    }, [isEditing, user]);
    
    // Verificar se houve alterações
    const checkChanges = (updatedUser: User) => {
      const changed = 
        updatedUser.name !== user.name ||
        updatedUser.email !== user.email ||
        updatedUser.role !== user.role ||
        updatedUser.active !== user.active ||
        updatedUser.phone !== user.phone ||
        updatedUser.department !== user.department;
      
      setHasChanges(changed);
      return changed;
    };
    
    // Função para atualizar o usuário editado
    const updateEditedUser = (updates: Partial<User>) => {
      const updatedUser = { ...editedUser, ...updates };
      setEditedUser(updatedUser);
      checkChanges(updatedUser);
    };
    
    // Função para iniciar a edição inline
    const startEditing = () => {
      // Verificar permissões para editar usuários Master
      if (user.role === 'MASTER' && currentUser?.role !== 'MASTER') {
        toast.error('Você não tem permissão para editar usuários Master');
        return;
      }
      
      setEditingInlineUserId(user.id);
    };
    
    // Função para cancelar a edição inline
    const cancelEditing = () => {
      if (hasChanges) {
        if (!confirm('Você tem alterações não salvas. Deseja realmente cancelar a edição?')) {
          return;
        }
      }
      
      setEditingInlineUserId(null);
      setValidationErrors({});
      setHasChanges(false);
    };
    
    // Função para validar os campos do usuário
    const validateFields = (): boolean => {
      const errors: Record<string, string> = {};
      
      if (!editedUser.name.trim()) {
        errors.name = 'O nome do usuário é obrigatório';
      }
      
      if (!editedUser.email.trim()) {
        errors.email = 'O email é obrigatório';
      } else if (!/\S+@\S+\.\S+/.test(editedUser.email)) {
        errors.email = 'Email inválido';
      } else if (
        users.some(u => u.email.toLowerCase() === editedUser.email.toLowerCase() && u.id !== user.id)
      ) {
        errors.email = 'Este email já está em uso';
      }
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };
    
    // Função para salvar as alterações
    const saveChanges = async () => {
      if (!validateFields()) {
        return;
      }
      
      // Verificar permissões para promover usuários a Master
      if (editedUser.role === 'MASTER' && user.role !== 'MASTER' && currentUser?.role !== 'MASTER') {
        toast.error('Você não tem permissão para promover usuários a Master');
        return;
      }
      
      setIsSaving(true);
      
      try {
        const updatedUser = userService.updateUser(user.id, {
          name: editedUser.name,
          email: editedUser.email,
          role: editedUser.role,
          active: editedUser.active,
          phone: editedUser.phone,
          department: editedUser.department,
          avatar: editedUser.avatar
        });
        
        if (updatedUser) {
          setUsers(userService.getUsers());
          setEditingInlineUserId(null);
          setValidationErrors({});
          toast.success('Usuário atualizado com sucesso');
        } else {
          toast.error('Erro ao atualizar usuário. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast.error('Erro ao atualizar usuário. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    };
    
    return (
      <Card className={cn(!user.active && "opacity-70")}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {canManageUsers && !isEditing && (
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shadow-md border-2 border-background"
                    onClick={startEditing}
                  >
                    <Edit className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {isEditing ? (
                  <div className="space-y-1">
                    <Input 
                      value={editedUser.name}
                      onChange={(e) => updateEditedUser({ name: e.target.value })}
                      className={validationErrors.name ? "border-red-500" : ""}
                      placeholder="Nome do usuário"
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                ) : (
                  <CardTitle className="flex items-center">
                    {user.name}
                    {!user.active && (
                      <Badge variant="outline" className="ml-2 text-xs">Inativo</Badge>
                    )}
                  </CardTitle>
                )}
                
                {isEditing ? (
                  <div className="space-y-1">
                    <Input 
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => updateEditedUser({ email: e.target.value })}
                      className={validationErrors.email ? "border-red-500" : ""}
                      placeholder="Email do usuário"
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                ) : (
                  <CardDescription>{user.email}</CardDescription>
                )}
              </div>
            </div>
            {canManageUsers && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={startEditing}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar usuário
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                    <Key className="h-4 w-4 mr-2" />
                    Resetar senha
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleToggleUserActive(user.id)}>
                    {user.active ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Desativar usuário
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Ativar usuário
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir usuário
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isEditing && (
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={cancelEditing} title="Cancelar" disabled={isSaving}>
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  onClick={saveChanges} 
                  title="Salvar"
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`user-role-${user.id}`}>Perfil</Label>
                  <Select 
                    value={editedUser.role}
                    onValueChange={(value) => updateEditedUser({ role: value as UserRole })}
                  >
                    <SelectTrigger id={`user-role-${user.id}`}>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Mostrar opção Master apenas para usuários Master */}
                      {(currentUser?.role === 'MASTER') && (
                        <SelectItem value="MASTER">Master</SelectItem>
                      )}
                      <SelectItem value="GESTOR">Gestor</SelectItem>
                      <SelectItem value="PRESTADOR">Prestador de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`user-department-${user.id}`}>Departamento</Label>
                  <Input 
                    id={`user-department-${user.id}`} 
                    value={editedUser.department || ''}
                    onChange={(e) => updateEditedUser({ department: e.target.value })}
                    placeholder="Departamento (opcional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`user-phone-${user.id}`}>Telefone</Label>
                  <Input 
                    id={`user-phone-${user.id}`} 
                    value={editedUser.phone || ''}
                    onChange={(e) => updateEditedUser({ phone: e.target.value })}
                    placeholder="Telefone (opcional)"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`user-active-${user.id}`} 
                    checked={editedUser.active}
                    onCheckedChange={(checked) => updateEditedUser({ active: checked })}
                  />
                  <Label htmlFor={`user-active-${user.id}`}>Usuário Ativo</Label>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Perfil:</span>
                  <Badge variant="outline" className={cn("ml-2", getRoleBadgeVariant(user.role))}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                
                {user.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Departamento:</span>
                    <span className="text-sm font-medium">{user.department}</span>
                  </div>
                )}
                
                {user.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telefone:</span>
                    <span className="text-sm font-medium">{user.phone}</span>
                  </div>
                )}
                
                {user.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Último acesso:</span>
                    <span className="text-sm font-medium">
                      {new Date(user.lastLogin).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {canManageUsers && !isEditing && (
              <>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={startEditing}
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Editar Usuário
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleResetPassword(user.id)}
                  >
                    <Key className="h-3 w-3 mr-2" />
                    Resetar Senha
                  </Button>
                </div>
              </>
            )}
            
            {isEditing && (
              <>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={cancelEditing}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={saveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie contas de usuários, permissões e funções no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-inactive-users" 
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-users">Mostrar inativos</Label>
          </div>
          {canManageUsers && (
            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Buscar usuários por nome, email ou departamento..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
            <Users className="h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery 
                ? `Nenhum usuário corresponde à pesquisa "${searchQuery}"`
                : 'Nenhum usuário disponível. Adicione um novo usuário para começar.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Botão flutuante para adicionar usuário */}
      <Button 
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg"
        size="icon"
        onClick={handleAddUser}
        title="Adicionar Novo Usuário"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {/* Diálogo para adicionar/editar usuário */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isNewUser ? 'Adicionar Novo Usuário' : 'Editar Usuário'}</DialogTitle>
            <DialogDescription>
              {isNewUser 
                ? 'Preencha os detalhes para adicionar um novo usuário ao sistema' 
                : 'Modifique as informações do usuário'}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input 
                    id="user-name" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input 
                    id="user-email" 
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <Select 
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser, 
                      role: value as UserRole
                    })}
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Mostrar opção Master apenas para usuários Master */}
                      {(currentUser?.role === 'MASTER') && (
                        <SelectItem value="MASTER">Master</SelectItem>
                      )}
                      <SelectItem value="GESTOR">Gestor</SelectItem>
                      <SelectItem value="PRESTADOR">Prestador de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-department">Departamento (opcional)</Label>
                  <Input 
                    id="user-department" 
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-phone">Telefone (opcional)</Label>
                  <Input 
                    id="user-phone" 
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-active">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="user-active" 
                      checked={editingUser.active}
                      onCheckedChange={(checked) => setEditingUser({...editingUser, active: checked})}
                    />
                    <Label htmlFor="user-active">Usuário Ativo</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Credenciais de Acesso</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-password">
                      {isNewUser ? 'Senha' : 'Nova Senha (deixe em branco para manter a atual)'}
                    </Label>
                    <Input 
                      id="user-password" 
                      type="password"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-confirm-password">Confirmar Senha</Label>
                    <Input 
                      id="user-confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Permissões do Perfil</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <h5 className="font-medium mb-2">{getRoleLabel(editingUser.role)}</h5>
                  <ul className="space-y-1">
                    {editingUser.role === 'MASTER' && (
                      <>
                        <li>• Acesso completo a todas as áreas do sistema</li>
                        <li>• Gerenciamento de usuários (incluindo Masters)</li>
                        <li>• Configurações críticas do sistema</li>
                        <li>• Gerenciamento completo de pedidos e Kanban</li>
                      </>
                    )}
                    {editingUser.role === 'GESTOR' && (
                      <>
                        <li>• Gerenciamento operacional (criar, editar e mover pedidos)</li>
                        <li>• Atribuir tarefas a outros usuários</li>
                        <li>• Acesso a configurações básicas (etiquetas, Kanban)</li>
                        <li>• Visualização de relatórios e métricas</li>
                      </>
                    )}
                    {editingUser.role === 'PRESTADOR' && (
                      <>
                        <li>• Visualizar e atualizar pedidos atribuídos</li>
                        <li>• Alterar status de pedidos e adicionar comentários</li>
                        <li>• Sem acesso a configurações do sistema</li>
                        <li>• Sem permissão para criar ou remover colunas do Kanban</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUserDialogOpen(false);
                setEditingUser(null);
                setErrors({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              {isNewUser ? 'Adicionar Usuário' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para exibir a nova senha */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Senha Resetada com Sucesso</DialogTitle>
            <DialogDescription>
              Uma nova senha temporária foi gerada para {resetPasswordUser?.name}.
              Compartilhe esta senha com o usuário de forma segura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nova senha:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-lg font-mono">{newPassword}</code>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-amber-50 text-amber-800 rounded-md">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                Esta senha é temporária. Recomende ao usuário que a altere após o primeiro login.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setResetPasswordUser(null);
                setNewPassword('');
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tab Gerenciamento de Produtos
function ProductsManagement() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Carregar produtos do localStorage ou usar os padrões
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        // Verificar se todos os produtos estão ativos e visíveis para personalização
        const updatedProducts = parsedProducts.map((product: ProductType) => ({
          ...product,
          active: true,
          visibleInPersonalization: true
        }));
        setProducts(updatedProducts);
        // Salvar produtos atualizados no localStorage
        localStorage.setItem('products', JSON.stringify(updatedProducts));
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Se houver erro, usar os produtos padrão
        setProducts(defaultProductTypes);
        // Salvar produtos padrão no localStorage
        localStorage.setItem('products', JSON.stringify(defaultProductTypes));
      }
    } else {
      // Se não houver produtos salvos, usar os padrões
      setProducts(defaultProductTypes);
      // Salvar produtos padrão no localStorage
      localStorage.setItem('products', JSON.stringify(defaultProductTypes));
    }
  }, []);
  
  // Função para lidar com o upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    
    // Verificar o tamanho do arquivo (limite de 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('O arquivo é muito grande. O tamanho máximo é 5MB.');
      return;
    }
    
    // Criar um objeto URL para a imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && editingProduct) {
        // Gerar um nome de arquivo baseado no ID do produto e timestamp
        const timestamp = new Date().getTime();
        const fileName = editingProduct.id 
          ? `${editingProduct.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}` 
          : `product_${timestamp}`;
        
        // Em um ambiente real, enviaria para o servidor
        // Por enquanto, usamos a string de dados diretamente
        setEditingProduct({
          ...editingProduct,
          imageUrl: event.target.result as string
        });
        
        toast.success('Imagem carregada com sucesso!');
      }
    };
    
    reader.onerror = () => {
      toast.error('Erro ao carregar a imagem. Por favor, tente novamente.');
    };
    
    reader.readAsDataURL(file);
  };
  
  // ... existing code ...
}