import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Order, Status, Priority, ArtworkImage, ArtworkActionLog, ArtworkApprovalToken, Label as OrderLabel } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
  Printer, 
  Copy, 
  Plus, 
  Trash2, 
  Upload, 
  Download,
  User,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X,
  Loader2,
  Tags,
  Tag,
  Hash,
  ArrowRight,
  ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';
import { statusNames, statusColors, labelColors, labelNames } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para obter produtos configurados do localStorage
const getConfiguredProducts = () => {
  const storedProducts = localStorage.getItem('products');
  if (storedProducts) {
    const configProducts = JSON.parse(storedProducts);
    return configProducts.filter(
      (p: any) => p.active && p.visibleInPersonalization
    );
  }
  return [];
};

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (orderId: string, updatedData: Partial<Order>) => void;
  onUpdateStatus: (orderId: string, newStatus: Status) => void;
}

export default function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
  onUpdateOrder,
  onUpdateStatus
}: OrderDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [personalizationDetails, setPersonalizationDetails] = useState('');
  const [isEditingPersonalization, setIsEditingPersonalization] = useState(false);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [newArtComment, setNewArtComment] = useState('');
  
  // 🔒 Estados para controle de botões e proteção
  const [approvalButtonStates, setApprovalButtonStates] = useState<Record<string, 'idle' | 'processing' | 'approved'>>({});
  const [adjustmentButtonStates, setAdjustmentButtonStates] = useState<Record<string, 'idle' | 'processing' | 'adjustment_requested'>>({});
  
  // Estados para gestão de etiquetas
  const [isEditingLabels, setIsEditingLabels] = useState(false);

  // 🛡️ NOVO: Sistema de proteção contra fechamento automático
  const [isModalLocked, setIsModalLocked] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const configuredProducts = getConfiguredProducts();
  
  // Separar logos do orçamento das artes finalizadas
  const orderLogos = order?.artworkImages || [];
  const finalizedArtworks = order?.finalizedArtworks || [];

  // 🛡️ Função para travar o modal temporariamente
  const lockModal = useCallback((duration: number = 2000) => {
    console.log('🔒 Modal travado para prevenir fechamento automático');
    setIsModalLocked(true);
    
    // Limpar timeout anterior se existir
    if (lockTimeout) {
      clearTimeout(lockTimeout);
    }
    
    // Definir novo timeout
    const newTimeout = setTimeout(() => {
      console.log('🔓 Modal destravado');
      setIsModalLocked(false);
    }, duration);
    
    setLockTimeout(newTimeout);
  }, [lockTimeout]);

  // 🛡️ Interceptar tentativas de fechamento durante operações críticas
  const handleModalOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isModalLocked) {
      console.log('⚠️ Tentativa de fechar modal bloqueada - operação em andamento');
      return; // Bloquear fechamento
    }
    
    console.log('✅ Permitindo mudança de estado do modal:', newOpen);
    onOpenChange(newOpen);
  }, [isModalLocked, onOpenChange]);
  
  useEffect(() => {
    // 🛡️ Não reagir a mudanças do order quando modal estiver travado
    if (order && open && !isModalLocked) {
      setPersonalizationDetails(order.personalizationDetails || '');
      loadCustomerData();
      loadArtworkFromOrder();
      
      // Inicializar estados dos botões baseado no status das artes
      const approvalStates: Record<string, 'idle' | 'processing' | 'approved'> = {};
      const adjustmentStates: Record<string, 'idle' | 'processing' | 'adjustment_requested'> = {};
      
      finalizedArtworks.forEach(artwork => {
        if (artwork.status === 'approved') {
          approvalStates[artwork.id] = 'approved';
        } else {
          approvalStates[artwork.id] = 'idle';
        }
        
        if (artwork.status === 'adjustment_requested') {
          adjustmentStates[artwork.id] = 'adjustment_requested';
        } else {
          adjustmentStates[artwork.id] = 'idle';
        }
      });
      
      setApprovalButtonStates(approvalStates);
      setAdjustmentButtonStates(adjustmentStates);
    }
  }, [order, open, isModalLocked]);

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (lockTimeout) {
        clearTimeout(lockTimeout);
      }
    };
  }, [lockTimeout]);

  const loadArtworkFromOrder = () => {
    if (!order) return;
    
    // Verificar se há logos/artwork no pedido
    if (order.artworkImages && order.artworkImages.length > 0) {
      console.log('✅ Logos encontradas no pedido:', order.artworkImages);
      return;
    }
    
    // Tentar extrair logos dos dados de personalização se não estão no artworkImages
    if (order.personalizationDetails) {
      try {
        // Procurar por dados de imagem base64 nos detalhes de personalização
        const lines = order.personalizationDetails.split('\n');
        const logoLines = lines.filter(line => 
          line.includes('data:image') || 
          line.toLowerCase().includes('logo') ||
          line.toLowerCase().includes('logopreview')
        );
        
        if (logoLines.length > 0) {
          const extractedLogos: ArtworkImage[] = [];
          
          logoLines.forEach((line, index) => {
            if (line.includes('data:image')) {
              const base64Data = line.split('data:image')[1];
              if (base64Data) {
                const logoImage: ArtworkImage = {
                  id: `extracted-logo-${Date.now()}-${index}`,
                  url: `data:image${base64Data}`,
                  name: `Logo extraída ${index + 1}`,
                  createdAt: new Date(),
                  uploadedBy: 'Sistema (extraída do orçamento)'
                };
                extractedLogos.push(logoImage);
              }
            }
          });
          
          if (extractedLogos.length > 0) {
            console.log('🎨 Logos extraídas dos dados de personalização:', extractedLogos);
            // Atualizar o pedido com as logos extraídas
            onUpdateOrder(order.id, { artworkImages: extractedLogos });
          }
        }
      } catch (error) {
        console.error('Erro ao extrair logos dos dados de personalização:', error);
      }
    }
    
    console.log('ℹ️ Nenhuma logo encontrada no pedido');
  };

  const loadCustomerData = async () => {
    if (!order?.customer) return;
    
    setIsLoadingCustomer(true);
    try {
      // Buscar dados completos do cliente, incluindo informações do orçamento original
      const customerData = {
        nome: order.customer.name,
        empresa: order.customer.company || 'Não informado',
        cpf_cnpj: order.customer.document || 'Não informado',
        tipo_pessoa: order.customer.personType === 'Física' ? 'Pessoa Física' : 
                     order.customer.personType === 'Jurídica' ? 'Pessoa Jurídica' : 'Não informado',
        // Endereço de entrega completo
        endereco: order.customer.address || 'Não informado',
        numero: order.customer.number || 'S/N',
        bairro: order.customer.neighborhood || 'Não informado',
        cidade: order.customer.city || 'Não informado',
        estado: order.customer.state || 'Não informado',
        cep: order.customer.zipCode || 'Não informado'
      };
      
      setCustomerData(customerData);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      setCustomerData({
        nome: order.customer.name,
        empresa: 'Não informado',
        cpf_cnpj: 'Não informado',
        tipo_pessoa: 'Não informado',
        endereco: 'Não informado',
        numero: 'S/N',
        bairro: 'Não informado',
        cidade: 'Não informado',
        estado: 'Não informado',
        cep: 'Não informado'
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !order) return;
    
    const selectedProduct = configuredProducts.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;
    
    const newProduct = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      quantity: newProductQuantity
    };
    
    const updatedProducts = [...(order.products || []), newProduct];
    
    onUpdateOrder(order.id, { products: updatedProducts });
    setSelectedProductId('');
    setNewProductQuantity(1);
    toast.success('Produto adicionado com sucesso!');
  };

  const handleRemoveProduct = (productId: string) => {
    if (!order) return;
    
    const updatedProducts = (order.products || []).filter(p => p.id !== productId);
    onUpdateOrder(order.id, { products: updatedProducts });
    toast.success('Produto removido com sucesso!');
  };

  const handleEditProduct = (productId: string, currentQuantity: number) => {
    if (!order) return;
    
    const newQuantity = prompt('Digite a nova quantidade:', currentQuantity.toString());
    if (newQuantity === null) return; // User cancelled
    
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Por favor, digite uma quantidade válida');
      return;
    }
    
    const updatedProducts = (order.products || []).map(p => 
      p.id === productId ? { ...p, quantity } : p
    );
    
    onUpdateOrder(order.id, { products: updatedProducts });
    toast.success(`Quantidade atualizada para ${quantity} unid`);
  };

  const handleSavePersonalization = () => {
    if (!order) return;
    
    onUpdateOrder(order.id, { personalizationDetails });
    setIsEditingPersonalization(false);
    toast.success('Detalhes de personalização salvos!');
  };

  const handleArtworkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) return;

    // Validar tipo de arquivo - aceitar imagens, PDFs, PSD e AI
    const allowedTypes = [
      'image/', 
      'application/pdf',
      'application/postscript', // AI files
      'image/vnd.adobe.photoshop', // PSD files
      'image/photoshop', // PSD alternative
      'application/x-photoshop' // PSD alternative
    ];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type)) || 
                       file.name.toLowerCase().endsWith('.psd') ||
                       file.name.toLowerCase().endsWith('.ai');
    
    if (!isValidType) {
      toast.error('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.), PDF, PSD ou AI');
      return;
    }

    // Validar tamanho (20MB para PSD/AI, 10MB para PDFs, 5MB para imagens)
    let maxSize = 5 * 1024 * 1024; // 5MB para imagens
    if (file.type === 'application/pdf') {
      maxSize = 10 * 1024 * 1024; // 10MB para PDFs
    } else if (file.name.toLowerCase().endsWith('.psd') || 
               file.name.toLowerCase().endsWith('.ai') ||
               file.type.includes('photoshop') ||
               file.type.includes('postscript')) {
      maxSize = 20 * 1024 * 1024; // 20MB para PSD/AI
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast.error(`O arquivo deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newArtwork: ArtworkImage = {
        id: `finalized-artwork-${Date.now()}`,
        url: e.target?.result as string,
        name: file.name,
        type: file.type,
        createdAt: new Date(),
        uploadedBy: 'Equipe ADDS Brasil'
      };

      const updatedFinalizedArtworks = [...(order.finalizedArtworks || []), newArtwork];
      onUpdateOrder(order.id, { finalizedArtworks: updatedFinalizedArtworks });
      
      let fileTypeText = 'arquivo';
      if (file.type === 'application/pdf') fileTypeText = 'PDF';
      else if (file.name.toLowerCase().endsWith('.psd')) fileTypeText = 'PSD';
      else if (file.name.toLowerCase().endsWith('.ai')) fileTypeText = 'AI';
      else if (file.type.startsWith('image/')) fileTypeText = 'imagem';
      
      toast.success(`${fileTypeText} anexado com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !order) return;

    // Processar múltiplos arquivos
    Array.from(files).forEach(file => {
      // Validar tipo de arquivo - aceitar imagens e PDFs
      const allowedTypes = [
        'image/', 
        'application/pdf'
      ];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));

      if (!isValidType) {
        toast.error(`Arquivo "${file.name}": Por favor, selecione apenas imagens (PNG, JPG) ou PDFs`);
        return;
      }

      // Validar tamanho (10MB para PDFs, 5MB para imagens)
      let maxSize = 5 * 1024 * 1024; // 5MB para imagens
      if (file.type === 'application/pdf') {
        maxSize = 10 * 1024 * 1024; // 10MB para PDFs
      }

      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        toast.error(`Arquivo "${file.name}": Deve ter no máximo ${maxSizeMB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newArtwork: ArtworkImage = {
          id: `artwork-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: e.target?.result as string,
          name: file.name,
          type: file.type,
          createdAt: new Date(),
          uploadedBy: 'Usuário atual'
        };

        const updatedArtwork = [...(order.artworkImages || []), newArtwork];
        onUpdateOrder(order.id, { artworkImages: updatedArtwork });
        
        let fileTypeText = 'arquivo';
        if (file.type === 'application/pdf') fileTypeText = 'PDF';
        else if (file.type.startsWith('image/')) fileTypeText = 'logo';
        
        toast.success(`${fileTypeText} "${file.name}" anexado com sucesso!`);
      };
      reader.readAsDataURL(file);
    });

    // Limpar o input para permitir selecionar os mesmos arquivos novamente se necessário
    event.target.value = '';
  };

  const handleRemoveFinalizedArtwork = (artworkId: string) => {
    if (!order) return;
    
    const updatedArtworks = (order.finalizedArtworks || []).filter(img => img.id !== artworkId);
    onUpdateOrder(order.id, { finalizedArtworks: updatedArtworks });
    toast.success('Arte finalizada removida com sucesso!');
  };

  const handleRemoveArtwork = (artworkId: string) => {
    if (!order) return;
    
    const updatedArtwork = (order.artworkImages || []).filter(img => img.id !== artworkId);
    onUpdateOrder(order.id, { artworkImages: updatedArtwork });
    toast.success('Logo removida com sucesso!');
  };

  const handleAddArtComment = () => {
    if (!newArtComment.trim() || !order) return;
    
    const newComment = {
      id: `art-comment-${Date.now()}`,
      text: newArtComment,
      createdAt: new Date(),
      user: 'Usuário atual',
      approved: false
    };
    
    const updatedComments = [...(order.artworkComments || []), newComment];
    onUpdateOrder(order.id, { artworkComments: updatedComments });
    setNewArtComment('');
    toast.success('Comentário adicionado!');
  };

  const handleApproveArt = (commentId: string) => {
    if (!order) return;
    
    const updatedComments = (order.artworkComments || []).map(comment =>
      comment.id === commentId ? { ...comment, altered: true, approved: false } : comment
    );
    
    // Criar log da ação
    const actionLog: ArtworkActionLog = {
      id: `log-${Date.now()}`,
      orderId: order.id,
      action: 'comment_altered',
      performedBy: 'Usuário atual',
      performedByType: 'internal_user',
      details: 'Comentário de arte alterado',
      timestamp: new Date()
    };
    
    const updatedOrder = {
      ...order,
      artworkComments: updatedComments,
      artworkActionLogs: [...(order.artworkActionLogs || []), actionLog],
      updatedAt: new Date()
    };
    
    // Adicionar entrada no histórico
    updatedOrder.history = [
      ...updatedOrder.history,
      {
        id: `history-${Date.now()}`,
        date: new Date(),
        status: order.status,
        comment: 'Comentário de arte alterado',
        user: 'Usuário atual'
      }
    ];
    
    onUpdateOrder(order.id, updatedOrder);
    toast.success('Comentário alterado!');
  };

  const handleApproveArtwork = (artworkId: string) => {
    if (!order) return;
    
    // 🛡️ TRAVAR modal imediatamente para prevenir fechamento
    lockModal(3000); // Travar por 3 segundos
    
    // Atualizar estado do botão
    setApprovalButtonStates(prev => ({
      ...prev,
      [artworkId]: 'processing'
    }));
    
    console.log('🎯 Aprovando arte:', artworkId);
    
    // Atualizar status da arte para aprovada
    const updatedArtworks = (order.finalizedArtworks || []).map(artwork =>
      artwork.id === artworkId ? { ...artwork, status: 'approved' as const } : artwork
    );
    
    // Criar log da ação
    const actionLog: ArtworkActionLog = {
      id: `log-${Date.now()}`,
      orderId: order.id,
      artworkId,
      action: 'approved',
      performedBy: 'Equipe ADDS Brasil',
      performedByType: 'internal_user',
      details: 'Arte aprovada pela equipe',
      timestamp: new Date()
    };
    
    const updatedLogs = [...(order.artworkActionLogs || []), actionLog];
    
    // Atualizar o pedido (sem chamar onUpdateStatus - apenas dados)
    const updatedOrder = {
      finalizedArtworks: updatedArtworks,
      artworkActionLogs: updatedLogs,
      status: 'ARTE_APROVADA' as const
    };
    
    // Executar atualização sem timeout - lock já protege o modal
    onUpdateOrder(order.id, updatedOrder);
    
    // Atualizar estado do botão para aprovado
    setTimeout(() => {
      setApprovalButtonStates(prev => ({
        ...prev,
        [artworkId]: 'approved'
      }));
    }, 500);
    
    toast.success('🎨 Arte aprovada com sucesso!', {
      description: 'O status foi atualizado e o modal permanece aberto'
    });
  };

  const handleRequestArtworkAdjustment = (artworkId: string) => {
    if (!order) return;
    
    // 🛡️ TRAVAR modal imediatamente para prevenir fechamento
    lockModal(3000); // Travar por 3 segundos
    
    // Atualizar estado do botão
    setAdjustmentButtonStates(prev => ({
      ...prev,
      [artworkId]: 'processing'
    }));
    
    console.log('🔧 Solicitando ajuste para arte:', artworkId);
    
    // Atualizar status da arte para ajuste solicitado
    const updatedArtworks = (order.finalizedArtworks || []).map(artwork =>
      artwork.id === artworkId ? { ...artwork, status: 'adjustment_requested' as const } : artwork
    );
    
    // Criar log da ação
    const actionLog: ArtworkActionLog = {
      id: `log-${Date.now()}`,
      orderId: order.id,
      artworkId,
      action: 'adjustment_requested',
      performedBy: 'Equipe ADDS Brasil',
      performedByType: 'internal_user',
      details: 'Ajuste solicitado pela equipe',
      timestamp: new Date()
    };
    
    const updatedLogs = [...(order.artworkActionLogs || []), actionLog];
    
    // Atualizar o pedido (sem chamar onUpdateStatus - apenas dados)
    const updatedOrder = {
      finalizedArtworks: updatedArtworks,
      artworkActionLogs: updatedLogs,
      status: 'AJUSTE' as const
    };
    
    // Executar atualização sem timeout - lock já protege o modal
    onUpdateOrder(order.id, updatedOrder);
    
    // Atualizar estado do botão para ajuste solicitado
    setTimeout(() => {
      setAdjustmentButtonStates(prev => ({
        ...prev,
        [artworkId]: 'adjustment_requested'
      }));
    }, 500);
    
    toast.success('🔧 Ajuste solicitado com sucesso!', {
      description: 'O status foi atualizado e o modal permanece aberto'
    });
  };

  // 🔒 Função específica para o botão Fechar (sempre funciona)
  const handleCloseButtonClick = () => {
    console.log('👆 Botão "Fechar" clicado - Forçando fechamento do modal');
    
    // Limpar lock se existir
    if (lockTimeout) {
      clearTimeout(lockTimeout);
      setLockTimeout(null);
    }
    setIsModalLocked(false);
    
    // Forçar fechamento
    onOpenChange(false);
  };

  const generateApprovalLink = (artworkId: string) => {
    if (!order) return;
    
    // Gerar token único
    const token = `${order.id}-${artworkId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar token de aprovação
    const approvalToken: ArtworkApprovalToken = {
      id: `token-${Date.now()}`,
      orderId: String(order.id),
      artworkId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      used: false,
      createdAt: new Date()
    };
    
    // Salvar token no localStorage
    const storedTokens = localStorage.getItem('artworkApprovalTokens');
    let tokens: ArtworkApprovalToken[] = [];
    if (storedTokens) {
      tokens = JSON.parse(storedTokens);
    }
    tokens.push(approvalToken);
    localStorage.setItem('artworkApprovalTokens', JSON.stringify(tokens));
    
    // Atualizar pedido com o token
    const updatedOrder = {
      artworkApprovalTokens: [...(order.artworkApprovalTokens || []), approvalToken],
      updatedAt: new Date()
    };
    
    onUpdateOrder(order.id, updatedOrder);
    
    // Gerar link público
    const approvalLink = `${window.location.origin}/arte/aprovar/${token}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(approvalLink);
    toast.success('Link de aprovação copiado para a área de transferência!');
    
    return approvalLink;
  };

  const formatCpfCnpj = (cpfCnpj: string): string => {
    if (!cpfCnpj || cpfCnpj === 'Não informado') return cpfCnpj;
    
    const numbers = cpfCnpj.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cpfCnpj;
  };

  const formatHistoryDateTime = (date: Date | string) => {
    try {
      // Se for uma string, usar parseISO
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      
      // Verificar se a data é válida
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (err: unknown) {
      console.warn('Erro ao formatar data:', date, err);
      return 'Data inválida';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  if (!order) return null;

  const products = order.products || [];
  const artworkComments = order.artworkComments || [];
  const history = order.history || [];

  // Função de impressão profissional
  const handlePrint = () => {
    if (!order) return;
    
    try {
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
                    <span class="badge status">${statusNames[order.status] || order.status}</span>
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Prioridade</span>
                  <div class="field-value">
                    <span class="badge ${order.priority || 'normal'}">${order.priority === 'high' ? 'Alta' : 'Normal'}</span>
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
                  <div class="field-value">${order.createdAt ? format(
                    typeof order.createdAt === 'string' ? parseISO(order.createdAt) : new Date(order.createdAt), 
                    'dd/MM/yyyy - HH:mm', 
                    { locale: ptBR }
                  ) : 'Data não disponível'}</div>
                </div>
                <div class="field-group">
                  <span class="field-label">Última Atualização</span>
                  <div class="field-value">${order.updatedAt ? format(
                    typeof order.updatedAt === 'string' ? parseISO(order.updatedAt) : new Date(order.updatedAt), 
                    'dd/MM/yyyy - HH:mm', 
                    { locale: ptBR }
                  ) : 'Data não disponível'}</div>
                </div>
                ${order.dueDate ? `
                <div class="field-group">
                  <span class="field-label">⏰ Prazo de Entrega</span>
                  <div class="field-value" style="font-weight: bold; color: #dc2626;">${format(
                    typeof order.dueDate === 'string' ? parseISO(order.dueDate) : new Date(order.dueDate), 
                    'dd/MM/yyyy', 
                    { locale: ptBR }
                  )}</div>
                </div>
                ` : ''}
                ${order.startDate ? `
                <div class="field-group">
                  <span class="field-label">Data de Início</span>
                  <div class="field-value">${format(
                    typeof order.startDate === 'string' ? parseISO(order.startDate) : new Date(order.startDate), 
                    'dd/MM/yyyy', 
                    { locale: ptBR }
                  )}</div>
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

  // Handler para adicionar etiqueta
  const handleQuickAddLabel = (label: OrderLabel) => {
    if (!order) return;
    
    const currentLabels = order.labels || [];
    if (currentLabels.includes(label)) {
      toast.info(`Etiqueta "${labelNames[label]}" já existe`);
      return;
    }
    
    const newLabels = [...currentLabels, label];
    onUpdateOrder(order.id, { labels: newLabels });
    
    toast.success(`+ ${labelNames[label]}`, { duration: 1500 });
  };

  // Handler para remover etiqueta
  const handleQuickRemoveLabel = (label: OrderLabel) => {
    if (!order) return;
    
    const currentLabels = order.labels || [];
    const newLabels = currentLabels.filter(l => l !== label);
    
    onUpdateOrder(order.id, { labels: newLabels });
    toast.success(`- ${labelNames[label]}`, { duration: 1500 });
  };

  // Handler para alternar etiqueta
  const handleLabelToggle = (label: OrderLabel, checked: boolean) => {
    if (checked) {
      handleQuickAddLabel(label);
    } else {
      handleQuickRemoveLabel(label);
    }
  };

  // Componente para exibir campo com cópia individual
  const CopyableField = ({ label, value, isColor = false }: { 
    label: string; 
    value: string; 
    isColor?: boolean;
  }) => {
    const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
    
    const handleCopyValue = async () => {
      setCopyState('copying');
      await copyToClipboard(value);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    };

    return (
      <div className="group flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-150">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
            {label}:
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isColor && value.startsWith('#') && (
              <div 
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" 
                style={{ backgroundColor: value }}
                title={`Cor: ${value}`}
              />
            )}
            <span className="text-sm text-gray-900 truncate font-medium">
              {value}
            </span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyValue}
          className={`h-7 w-7 p-0 flex-shrink-0 transition-all duration-200 ${
            copyState === 'idle' 
              ? 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
              : copyState === 'copying'
                ? 'opacity-100 text-blue-600 bg-blue-50'
                : 'opacity-100 text-green-600 bg-green-50'
          }`}
          title={copyState === 'copied' ? 'Copiado!' : `Copiar "${value}"`}
          disabled={copyState === 'copying'}
        >
          {copyState === 'copying' ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
          ) : copyState === 'copied' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  };

  // Componente para seção de campos organizados
  const FieldSection = ({ 
    title, 
    icon: Icon, 
    fields 
  }: { 
    title: string; 
    icon: any; 
    fields: { label: string; value: string }[];
  }) => {
    if (fields.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <Badge variant="secondary" className="ml-auto text-xs bg-gray-100 text-gray-600">
            {fields.length} {fields.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
        
        <div className="space-y-1">
          {fields.map((field, index) => (
            <CopyableField
              key={index}
              label={field.label}
              value={field.value}
              isColor={field.label.toLowerCase().includes('cor')}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleModalOpenChange}>
      <DialogContent 
        className="sm:max-w-[95vw] lg:max-w-[1000px] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden gap-0"
      >
        {/* Header */}
        <DialogHeader className="px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          {/* Seção de Status/Mudança de Etapa no Topo - Simplificada */}
          <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Select
                value={order.status}
                onValueChange={(value) => onUpdateStatus(order.id, value as Status)}
              >
                <SelectTrigger className="w-auto min-w-48 h-8 text-sm border-blue-200 focus:border-blue-400 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusNames).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors[key as Status]}`} />
                        {name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Gestão de Etiquetas - Simplificada */}
            <div className="flex items-center gap-2 flex-wrap">
              {order.labels && order.labels.length > 0 ? (
                <>
                  {order.labels.slice(0, 3).map(label => (
                    <Badge
                      key={label}
                      className={`text-xs px-2 py-1 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm ${labelColors[label]}`}
                      onClick={() => handleQuickRemoveLabel(label)}
                      title={`Clique para remover: ${labelNames[label]}`}
                    >
                      {labelNames[label]}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  {order.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{order.labels.length - 3}
                    </Badge>
                  )}
                </>
              ) : null}
              
              {/* Botão Adicionar Etiqueta - Apenas Ícone */}
              <Select onValueChange={(value) => handleQuickAddLabel(value as OrderLabel)}>
                <SelectTrigger className="w-8 h-8 p-0 border border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-full">
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="relative">
                      <Tag className="h-3.5 w-3.5 text-gray-600" />
                      <Plus className="h-2 w-2 text-blue-600 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="w-56 p-0 border-0 shadow-xl rounded-lg max-h-[320px] overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      <div>
                        <h3 className="font-medium text-sm">Menu de Etiquetas</h3>
                        <p className="text-xs text-blue-100">Selecione para aplicar</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-b-lg overflow-y-auto max-h-[250px]">
                    {allLabels.filter(label => !order.labels?.includes(label)).length > 0 ? (
                      <div className="p-1">
                        {allLabels.filter(label => !order.labels?.includes(label)).map(label => (
                          <SelectItem 
                            key={label} 
                            value={label}
                            className="cursor-pointer rounded-md hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 p-2 m-1 border-0"
                          >
                            <div className="flex items-center gap-2.5 w-full">
                              <div className="relative flex-shrink-0">
                                <div 
                                  className={`w-3 h-3 rounded-full shadow-sm ${
                                    labelColors[label].includes('bg-') 
                                      ? labelColors[label].split(' ')[0] 
                                      : 'bg-gray-400'
                                  }`} 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs text-gray-900 truncate">{labelNames[label]}</div>
                                <div className="text-xs text-gray-500 capitalize truncate">
                                  {label.toLowerCase().replace(/_/g, ' ')}
                                </div>
                              </div>
                              <Plus className="h-3 w-3 text-blue-500 opacity-60 flex-shrink-0" />
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 px-3">
                        <Tags className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-xs font-medium text-gray-900 mb-1">Todas aplicadas</div>
                        <div className="text-xs text-gray-500">Nenhuma etiqueta disponível</div>
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Informações do Cliente e Ações */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3 lg:gap-0">
            <div className="flex items-center gap-3 lg:gap-4 w-full lg:w-auto">
              <Avatar className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.customer?.name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm lg:text-base">
                  {order.customer?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg lg:text-xl font-bold text-gray-900 truncate">
                  {order.customer?.name}
                </DialogTitle>
                <DialogDescription className="text-xs lg:text-sm text-gray-600 mt-1 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">ID: {order.id}</span>
                  </span>
                  <span className="hidden lg:inline text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {order.createdAt ? format(
                      typeof order.createdAt === 'string' ? parseISO(order.createdAt) : order.createdAt, 
                      'dd/MM/yyyy', 
                      { locale: ptBR }
                    ) : 'Data não disponível'}
                  </span>
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs lg:text-sm hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                onClick={handlePrint}
              >
                <Printer className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 lg:px-6 border-b bg-white flex-shrink-0">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent overflow-x-auto">
                <TabsTrigger 
                  value="pedidos" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none h-10 lg:h-12 px-3 lg:px-6 font-medium text-xs lg:text-sm whitespace-nowrap"
                >
                  <Package className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Pedidos
                  {products.length > 0 && (
                    <Badge variant="secondary" className="ml-1 lg:ml-2 h-4 lg:h-5 px-1 lg:px-2 bg-blue-100 text-blue-700 text-xs">
                      {products.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="arte" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none h-10 lg:h-12 px-3 lg:px-6 font-medium text-xs lg:text-sm whitespace-nowrap"
                >
                  <ImageIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Artes Personalizadas
                  {finalizedArtworks.length > 0 && (
                    <Badge variant="secondary" className="ml-1 lg:ml-2 h-4 lg:h-5 px-1 lg:px-2 bg-green-100 text-green-700 text-xs">
                      {finalizedArtworks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="historico" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none h-10 lg:h-12 px-3 lg:px-6 font-medium text-xs lg:text-sm whitespace-nowrap"
                >
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Histórico
                  <Badge variant="secondary" className="ml-1 lg:ml-2 h-4 lg:h-5 px-1 lg:px-2 bg-gray-100 text-gray-700 text-xs">
                    {history.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Tab Content - Agora com scroll adequado e altura completa */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-6">
              {/* Aba Pedidos */}
              <TabsContent value="pedidos" className="mt-0 p-4 lg:p-6 space-y-4 lg:space-y-6 h-full">
                {/* Logo Section - Moved to top */}
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-2 lg:pb-3">
                    <CardTitle className="text-base lg:text-lg flex items-center gap-2 text-blue-700">
                      <ImageIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      Logo do Orçamento
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">
                      Logo enviada pelo cliente no orçamento
                    </p>
                  </CardHeader>
                  <CardContent>
                    {orderLogos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {orderLogos.map((artwork) => (
                            <div key={artwork.id} className="relative group border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                              {/* Preview do arquivo */}
                              <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                {artwork.type === 'application/pdf' ? (
                                  <div className="text-center py-4">
                                    <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                    <p className="text-xs text-gray-600 font-medium">PDF</p>
                                  </div>
                                ) : (
                                  <img 
                                    src={artwork.url} 
                                    alt={artwork.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              
                              {/* Informações do arquivo */}
                              <div className="space-y-1">
                                <p className="text-xs text-gray-900 font-medium truncate" title={artwork.name}>
                                  {artwork.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {artwork.type === 'application/pdf' ? 'Documento PDF' : 'Imagem'}
                                </p>
                              </div>
                              
                              {/* Botões de ação */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {artwork.type === 'application/pdf' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => window.open(artwork.url, '_blank')}
                                    className="h-6 w-6 p-0"
                                    title="Visualizar PDF"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveArtwork(artwork.id)}
                                  className="h-6 w-6 p-0"
                                  title="Remover arquivo"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Botão "Adicionar Mais" quando há logos */}
                        <div className="pt-4 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar Mais Logos
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 mb-4">Nenhuma logo do orçamento</p>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Anexar Logo do Orçamento
                        </Button>
                      </div>
                    )}
                    
                    {/* Input de arquivo principal - sempre presente, mas oculto */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/*,application/pdf"
                      multiple
                    />
                  </CardContent>
                </Card>

                {/* Products Section */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        Produtos do Pedido
                      </CardTitle>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold">
                        {products.length} {products.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {products.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {/* Header da Lista */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          <div className="col-span-5">Produto</div>
                          <div className="col-span-2 text-center">Quantidade</div>
                          <div className="col-span-3">SKU</div>
                          <div className="col-span-2 text-center">Ações</div>
                        </div>
                        
                        {/* Lista de Produtos */}
                        {products.map((product, index) => {
                          // Buscar informações completas do produto configurado
                          const productInfo = configuredProducts.find(p => p.id === product.id) || 
                                             configuredProducts.find(p => p.name === product.name);
                          
                          const displayName = productInfo?.name || product.name || 'Produto';
                          const displaySku = product.id || productInfo?.id || `PROD-${index + 1}`;
                          
                          return (
                            <div key={`${product.id}-${index}`} className="grid grid-cols-12 gap-4 px-4 py-3 bg-white border border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all duration-200 group">
                              {/* Nome do Produto */}
                              <div className="col-span-5 flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                    {displayName}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(displayName)}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copiar nome do produto"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Quantidade */}
                              <div className="col-span-2 flex items-center justify-center">
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200 flex items-center gap-2 group">
                                  <span>{product.quantity || 1} unid</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard((product.quantity || 1).toString())}
                                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copiar quantidade"
                                  >
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* SKU */}
                              <div className="col-span-3 flex items-center">
                                <p className="font-mono text-xs text-gray-600 truncate">
                                  {displaySku}
                                </p>
                              </div>
                              
                              {/* Ações */}
                              <div className="col-span-2 flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditProduct(product.id, product.quantity || 1)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Editar quantidade"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveProduct(product.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remover produto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 mb-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum produto adicionado</p>
                        <p className="text-gray-400 text-sm mt-1">Adicione produtos para este pedido</p>
                      </div>
                    )}
                    
                    {/* Formulário de Adicionar Produto */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Adicionar Novo Produto</h4>
                          <p className="text-sm text-gray-600">Selecione um produto e defina a quantidade</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-7">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                            Produto
                          </Label>
                          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="bg-white border-gray-200 focus:border-blue-400 h-10">
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {configuredProducts.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    {product.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="md:col-span-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                            Quantidade
                          </Label>
                          <Input
                            type="number"
                            value={newProductQuantity}
                            onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                            className="bg-white border-gray-200 focus:border-blue-400 h-10"
                            min={1}
                            placeholder="1"
                          />
                        </div>
                        
                        <div className="md:col-span-2 flex items-end">
                          <Button 
                            onClick={handleAddProduct} 
                            disabled={!selectedProductId}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personalization Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dados da Personalização</CardTitle>
                      {!isEditingPersonalization ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingPersonalization(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSavePersonalization}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditingPersonalization(false);
                              setPersonalizationDetails(order.personalizationDetails || '');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditingPersonalization ? (
                      <Textarea
                        value={personalizationDetails}
                        onChange={(e) => setPersonalizationDetails(e.target.value)}
                        placeholder="Adicione detalhes sobre a personalização do pedido..."
                        rows={4}
                        className="resize-none"
                      />
                    ) : (
                      <div className="min-h-[100px] p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
                        {personalizationDetails ? (
                          <div className="space-y-4">
                            {/* Filtrar e exibir informações de personalização organizadas */}
                            {(() => {
                              // Função para traduzir e formatar campos
                              const translateField = (key: string, value: any): { label: string; value: string } | null => {
                                const translations: Record<string, string> = {
                                  'quantity': 'Quantidade',
                                  'color': 'Cor',
                                  'cor_impressao': 'Cor de Impressão',
                                  'cor_custom': 'Cor Personalizada',
                                  'finish': 'Acabamento',
                                  'details': 'Detalhes',
                                  'cidade': 'Cidade',
                                  'estado': 'Estado',
                                  'observacoes': 'Observações',
                                  'instrucoes': 'Instruções',
                                  'material': 'Material',
                                  'tamanho': 'Tamanho',
                                  'size': 'Tamanho',
                                  'telefone': 'Telefone',
                                  'whatsapp': 'WhatsApp',
                                  'instagram': 'Instagram',
                                  'insta': 'Instagram',
                                  'facebook': 'Facebook',
                                  'site': 'Site',
                                  'website': 'Website'
                                };
                                
                                // Filtrar apenas campos técnicos desnecessários
                                const excludeFields = [
                                  'data:image', 'logopreview', 'logo:', 'redes:', 'email', 'phone', 'name'
                                ];
                                
                                if (excludeFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                                  return null;
                                }
                                
                                // Filtrar valores vazios ou inválidos
                                if (!value || value === '' || value === 'undefined' || 
                                    (typeof value === 'string' && value.includes('[object Object]'))) {
                                  return null;
                                }
                                
                                const label = translations[key] || key.charAt(0).toUpperCase() + key.slice(1);
                                let formattedValue = String(value);
                                
                                // Formatação especial para cores (evitar duplicação)
                                if (key.toLowerCase().includes('cor') && formattedValue.startsWith('#')) {
                                  formattedValue = formattedValue; // Apenas o valor hex, sem duplicação
                                }
                                
                                // Formatação especial para telefones
                                if ((key.toLowerCase().includes('telefone') || key.toLowerCase().includes('whatsapp')) && 
                                    formattedValue.length >= 10) {
                                  // Formatar telefone brasileiro
                                  const numbers = formattedValue.replace(/\D/g, '');
                                  if (numbers.length === 11) {
                                    formattedValue = `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
                                  } else if (numbers.length === 10) {
                                    formattedValue = `(${numbers.slice(0,2)}) ${numbers.slice(2,6)}-${numbers.slice(6)}`;
                                  }
                                }
                                
                                // Formatação especial para Instagram
                                if (key.toLowerCase().includes('insta') && !formattedValue.startsWith('@')) {
                                  formattedValue = `@${formattedValue}`;
                                }
                                
                                return { label, value: formattedValue };
                              };
                              
                              // Se for uma string simples sem dados técnicos
                              if (typeof personalizationDetails === 'string' && 
                                  !personalizationDetails.includes(':') && 
                                  !personalizationDetails.includes('data:image')) {
                                return (
                                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start group">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Descrição Geral</p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{personalizationDetails}</p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(personalizationDetails)}
                                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 hover:bg-blue-50 ml-3 flex-shrink-0"
                                        title="Copiar texto completo"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Processar dados estruturados
                              let processedData: { label: string; value: string }[] = [];
                              const seenKeys = new Set<string>(); // Para evitar duplicatas
                              
                              if (personalizationDetails.includes(':')) {
                                // Dados em formato key:value
                                const lines = personalizationDetails.split('\n');
                                lines.forEach(line => {
                                  if (line.includes(':')) {
                                    const [key, ...valueParts] = line.split(':');
                                    const value = valueParts.join(':').trim();
                                    const keyLower = key.trim().toLowerCase();
                                    
                                    // Evitar duplicatas baseado na chave
                                    if (!seenKeys.has(keyLower)) {
                                      const translated = translateField(key.trim(), value);
                                      if (translated) {
                                        processedData.push(translated);
                                        seenKeys.add(keyLower);
                                      }
                                    }
                                  }
                                });
                              }
                              
                              // Tentar processar como JSON se não encontrou dados estruturados
                              if (processedData.length === 0) {
                                try {
                                  const jsonData = JSON.parse(personalizationDetails);
                                  Object.entries(jsonData).forEach(([key, value]) => {
                                    const keyLower = key.toLowerCase();
                                    if (!seenKeys.has(keyLower)) {
                                      const translated = translateField(key, value);
                                      if (translated) {
                                        processedData.push(translated);
                                        seenKeys.add(keyLower);
                                      }
                                    }
                                  });
                                } catch {
                                  // Se não é JSON válido, tentar extrair informações úteis
                                  const lines = personalizationDetails.split('\n');
                                  lines.forEach(line => {
                                    const trimmed = line.trim();
                                    if (trimmed && !trimmed.includes('data:image') && !trimmed.includes('[object Object]')) {
                                      processedData.push({ label: 'Informação', value: trimmed });
                                    }
                                  });
                                }
                              }
                              
                              // Organizar dados por categoria
                              const organizedData = {
                                contato: processedData.filter(item => 
                                  ['Telefone', 'WhatsApp', 'Instagram', 'Facebook', 'Site', 'Website'].includes(item.label)
                                ),
                                personalizacao: processedData.filter(item => 
                                  ['Quantidade', 'Cor', 'Cor de Impressão', 'Cor Personalizada', 'Acabamento', 'Material', 'Tamanho'].includes(item.label)
                                ),
                                outros: processedData.filter(item => 
                                  !['Telefone', 'WhatsApp', 'Instagram', 'Facebook', 'Site', 'Website', 'Quantidade', 'Cor', 'Cor de Impressão', 'Cor Personalizada', 'Acabamento', 'Material', 'Tamanho'].includes(item.label)
                                )
                              };
                              
                              if (processedData.length > 0) {
                                return (
                                  <div className="space-y-5">
                                    {/* Usar os novos componentes FieldSection */}
                                    <FieldSection
                                      title="Informações de Contato"
                                      icon={Phone}
                                      fields={organizedData.contato}
                                    />
                                    
                                    <FieldSection
                                      title="Especificações do Produto"
                                      icon={Package}
                                      fields={organizedData.personalizacao}
                                    />
                                    
                                    <FieldSection
                                      title="Outras Informações"
                                      icon={FileText}
                                      fields={organizedData.outros}
                                    />
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="text-center py-6">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-500 italic text-sm">Nenhuma informação de personalização específica disponível</p>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 italic font-medium">Nenhum detalhe de personalização adicionado</p>
                            <p className="text-gray-400 text-xs mt-1">Use o botão "Editar" para adicionar informações</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Data Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados do Cliente
                      {isLoadingCustomer && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Nome</Label>
                              <p className="font-medium">{customerData.nome}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(customerData.nome)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium text-gray-500">
                                {customerData.cpf_cnpj?.length === 14 ? 'CNPJ' : 'CPF'}
                              </Label>
                              <p className="font-mono">{formatCpfCnpj(customerData.cpf_cnpj)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(customerData.cpf_cnpj)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Tipo de Pessoa</Label>
                              <p>{customerData.tipo_pessoa === '1' ? 'Pessoa Física' : customerData.tipo_pessoa === '2' ? 'Pessoa Jurídica' : 'Não informado'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {customerData.empresa && (
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Empresa</Label>
                                <p className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  {customerData.empresa}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(customerData.empresa)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Endereço de Entrega</Label>
                            <div className="mt-2 space-y-2">
                              {/* Endereço e Número */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm">
                                    {customerData.endereco}, {customerData.numero}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`${customerData.endereco}, ${customerData.numero}`)}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  title="Copiar endereço e número"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* Bairro, Cidade e Estado */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-4 flex-shrink-0" /> {/* Espaçamento para alinhamento */}
                                  <span className="text-sm text-gray-600">
                                    {customerData.bairro} - {customerData.cidade}/{customerData.estado}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`${customerData.bairro} - ${customerData.cidade}/${customerData.estado}`)}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  title="Copiar bairro, cidade e estado"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* CEP */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-4 flex-shrink-0" /> {/* Espaçamento para alinhamento */}
                                  <span className="text-sm text-gray-600">
                                    CEP: {customerData.cep}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(customerData.cep)}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  title="Copiar CEP"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* Botão para copiar endereço completo */}
                              <div className="pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(`${customerData.endereco}, ${customerData.numero} - ${customerData.bairro}, ${customerData.cidade}/${customerData.estado} - CEP: ${customerData.cep}`)}
                                  className="w-full gap-2"
                                >
                                  <Copy className="h-3 w-3" />
                                  Copiar Endereço Completo
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Carregando dados do cliente...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Artes Personalizadas - VERSÃO UX OTIMIZADA */}
              <TabsContent value="arte" className="mt-0 p-0 h-full">
                <div className="h-full flex flex-col">
                  {/* Header Ultra-Slim com Estatísticas */}
                  <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white px-4 py-1.5 border-b border-purple-500/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-0.5 bg-white/20 rounded">
                          <ImageIcon className="h-3 w-3" />
                        </div>
                        <h2 className="text-sm font-bold">Artes Personalizadas</h2>
                      </div>
                      
                      {/* Métricas Ultra-Compactas */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded px-1.5 py-0.5">
                          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                          <span className="text-xs text-purple-100">Total:</span>
                          <span className="text-xs font-bold text-white">{finalizedArtworks.length}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm rounded px-1.5 py-0.5">
                          <div className="w-1 h-1 bg-green-300 rounded-full"></div>
                          <span className="text-xs text-green-100">Aprovadas:</span>
                          <span className="text-xs font-bold text-green-200">
                            {finalizedArtworks.filter(art => art.status === 'approved').length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-orange-500/20 backdrop-blur-sm rounded px-1.5 py-0.5">
                          <div className="w-1 h-1 bg-orange-300 rounded-full"></div>
                          <span className="text-xs text-orange-100">Revisão:</span>
                          <span className="text-xs font-bold text-orange-200">
                            {finalizedArtworks.filter(art => art.status === 'adjustment_requested').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo Principal Scrollável */}
                  <div className="flex-1 overflow-y-auto">
                    {finalizedArtworks.length > 0 ? (
                      <>
                        {/* Grid de Artes Existentes */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Artes Finalizadas</h3>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {finalizedArtworks.length} {finalizedArtworks.length === 1 ? 'arte' : 'artes'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {finalizedArtworks.map((artwork, index) => (
                              <div key={artwork.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
                                {/* Header Compacto do Card */}
                                <div className="p-4 pb-3 border-b border-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-gray-900 truncate">{artwork.name}</h4>
                                        <p className="text-xs text-gray-500">
                                          {artwork.uploadedBy} • {artwork.createdAt ? format(
                                            typeof artwork.createdAt === 'string' ? parseISO(artwork.createdAt) : artwork.createdAt, 
                                            'dd/MM/yyyy', 
                                            { locale: ptBR }
                                          ) : 'Data não disponível'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {/* Status Badge Compacto */}
                                      {artwork.status === 'approved' && (
                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                                          <CheckCircle className="h-3 w-3" />
                                          Aprovada
                                        </div>
                                      )}
                                      {artwork.status === 'adjustment_requested' && (
                                        <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-medium">
                                          <Clock className="h-3 w-3" />
                                          Em Revisão
                                        </div>
                                      )}
                                      {!artwork.status && (
                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                          <AlertCircle className="h-3 w-3" />
                                          Aguardando
                                        </div>
                                      )}
                                      
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveFinalizedArtwork(artwork.id)}
                                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Preview da Arte Compacto */}
                                <div className="p-4">
                                  <div className="relative bg-gray-50 rounded-lg overflow-hidden group">
                                    {artwork.type === 'application/pdf' ? (
                                      <div className="aspect-[4/3] flex flex-col items-center justify-center p-6">
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                                          <FileText className="h-6 w-6 text-red-600" />
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm mb-2">Arquivo PDF</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(artwork.url, '_blank')}
                                          className="text-xs"
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Visualizar
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="aspect-[4/3] relative">
                                        <img 
                                          src={artwork.url} 
                                          alt={artwork.name}
                                          className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => window.open(artwork.url, '_blank')}
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Ver
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Ações do Card */}
                                <div className="p-4 pt-0">
                                  <div className="space-y-2">
                                    {/* Botões Principais */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button 
                                        type="button"
                                        size="sm"
                                        className={`h-9 text-xs font-medium ${
                                          approvalButtonStates[artwork.id] === 'approved'
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleApproveArtwork(artwork.id);
                                        }}
                                        disabled={approvalButtonStates[artwork.id] === 'processing'}
                                      >
                                        {approvalButtonStates[artwork.id] === 'processing' ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Processando
                                          </>
                                        ) : approvalButtonStates[artwork.id] === 'approved' ? (
                                          <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Aprovada
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Aprovar
                                          </>
                                        )}
                                      </Button>

                                      <Button 
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className={`h-9 text-xs font-medium ${
                                          adjustmentButtonStates[artwork.id] === 'adjustment_requested'
                                            ? 'border-orange-300 text-orange-700 bg-orange-50'
                                            : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:text-orange-600'
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRequestArtworkAdjustment(artwork.id);
                                        }}
                                        disabled={adjustmentButtonStates[artwork.id] === 'processing'}
                                      >
                                        {adjustmentButtonStates[artwork.id] === 'processing' ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Processando
                                          </>
                                        ) : adjustmentButtonStates[artwork.id] === 'adjustment_requested' ? (
                                          <>
                                            <Clock className="h-3 w-3 mr-1" />
                                            Em Revisão
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Solicitar Ajuste
                                          </>
                                        )}
                                      </Button>
                                    </div>

                                    {/* Link Público */}
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      className="w-full h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                      onClick={() => generateApprovalLink(artwork.id)}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Link Público
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Separador */}
                        <div className="border-t border-gray-100"></div>
                      </>
                    ) : null}

                    {/* Seção de Upload */}
                    <div className="p-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        {finalizedArtworks.length === 0 ? (
                          /* Estado Vazio */
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <ImageIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma Arte Finalizada</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                              Anexe as artes finalizadas do projeto para aprovação do cliente.
                            </p>
                          </div>
                        ) : (
                          /* Header quando há artes */
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Plus className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">Adicionar Nova Arte</h3>
                                <p className="text-sm text-gray-500">Anexe uma nova arte finalizada</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          onChange={handleArtworkUpload}
                          className="hidden"
                          accept="image/*,application/pdf"
                          id="finalized-artwork-upload"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('finalized-artwork-upload')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Anexar Arte Finalizada
                        </Button>
                      </div>
                    </div>

                    {/* Seção de Comentários Otimizada */}
                    <div className="border-t bg-gray-50 p-6">
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            Comentários e Feedback
                          </h3>
                          
                          {artworkComments.length > 0 ? (
                            <div className="space-y-4 mb-6">
                              {artworkComments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-9 w-9 border border-gray-200">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                        {comment.user.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="font-medium text-gray-900 text-sm">{comment.user}</p>
                                        <p className="text-xs text-gray-500">
                                          {formatHistoryDateTime(comment.createdAt)}
                                        </p>
                                        {comment.approved && (
                                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Aprovado
                                          </Badge>
                                        )}
                                        {comment.altered && (
                                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Alterado
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                                      {!comment.approved && !comment.altered && (
                                        <Button
                                          size="sm"
                                          className="mt-3"
                                          onClick={() => handleApproveArt(comment.id)}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Marcar como Alterado
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 mb-6">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm">Nenhum comentário ainda</p>
                            </div>
                          )}
                          
                          {/* Formulário de Comentário Compacto */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex gap-3">
                              <Avatar className="h-9 w-9 border border-white shadow-sm flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-sm">
                                  EU
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-3">
                                <Textarea
                                  value={newArtComment}
                                  onChange={(e) => setNewArtComment(e.target.value)}
                                  placeholder="Adicione um comentário sobre as artes..."
                                  rows={2}
                                  className="resize-none border-0 bg-white shadow-sm text-sm"
                                />
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm"
                                    onClick={handleAddArtComment} 
                                    disabled={!newArtComment.trim()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Histórico */}
              <TabsContent value="historico" className="mt-0 p-4 lg:p-6 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Histórico Completo do Pedido
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Histórico de status e ações de arte em ordem cronológica
                    </p>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Combinar histórico de status com logs de ações de arte
                      const allEvents = [
                        ...history.map(entry => ({
                          ...entry,
                          type: 'status' as const,
                          timestamp: new Date(entry.date)
                        })),
                        ...(order?.artworkActionLogs || []).map(log => ({
                          id: log.id,
                          type: 'artwork_action' as const,
                          action: log.action,
                          performedBy: log.performedBy,
                          performedByType: log.performedByType,
                          details: log.details,
                          timestamp: new Date(log.timestamp),
                          artworkId: log.artworkId
                        }))
                      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                      return allEvents.length > 0 ? (
                        <div className="space-y-4">
                          {allEvents.map((event, index) => (
                            <div key={event.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                  event.type === 'status' 
                                    ? statusColors[(event as any).status] 
                                    : event.action === 'approved' 
                                      ? 'bg-green-500'
                                      : event.action === 'adjustment_requested'
                                        ? 'bg-orange-500'
                                        : 'bg-blue-500'
                                }`} />
                                {index < allEvents.length - 1 && (
                                  <div className="w-px h-8 bg-gray-200 mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                  {event.type === 'status' ? (
                                    <Badge variant="outline" className="text-xs">
                                      {statusNames[(event as any).status as Status]}
                                    </Badge>
                                  ) : (
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${
                                        event.action === 'approved' 
                                          ? 'bg-green-100 text-green-700'
                                          : event.action === 'adjustment_requested'
                                            ? 'bg-orange-100 text-orange-700'
                                            : event.action === 'comment_altered'
                                              ? 'bg-blue-100 text-blue-700'
                                              : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {event.action === 'approved' && 'Arte Aprovada'}
                                      {event.action === 'adjustment_requested' && 'Ajuste Solicitado'}
                                      {event.action === 'comment_altered' && 'Comentário Alterado'}
                                      {event.action === 'artwork_uploaded' && 'Arte Anexada'}
                                    </Badge>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    {formatHistoryDateTime(event.timestamp)}
                                  </p>
                                  {event.type === 'artwork_action' && (
                                    <Badge variant="outline" className="text-xs">
                                      {event.performedByType === 'client' ? 'Cliente' : 'Interno'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium">
                                  {event.type === 'status' 
                                    ? (event as any).comment || `Status alterado para ${statusNames[(event as any).status as Status]}`
                                    : event.details
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  por {event.type === 'status' ? (event as any).user : event.performedBy}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500">Nenhum histórico disponível</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 