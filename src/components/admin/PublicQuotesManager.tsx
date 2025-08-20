import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  Trash2, 
  User, 
  Package, 
  Calendar,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  MessageCircle,
  ExternalLink,
  Download,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  CheckCircle2,
  XCircle,
  History,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKanban } from '@/contexts/KanbanContext';
import { userService } from '@/lib/services/userService';
import { Label } from '@/types';

interface QuoteAction {
  id: string;
  action: 'approved' | 'rejected' | 'contacted' | 'commented';
  user: string;
  timestamp: Date;
  comment?: string;
}

interface QuoteData {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    company: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: string;
  };
  customization: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'contacted' | 'completed' | 'approved' | 'rejected';
  notes?: string;
  assignedTo?: string;
  estimatedValue?: number;
  lastContactDate?: Date;
  actions?: QuoteAction[];
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
}

export function PublicQuotesManager() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [filter, setFilter] = useState('all'); // all, pending, contacted, completed, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteData | null>(null);
  const [notes, setNotes] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  const { addPublicOrder, refreshFromStorage } = useKanban();
  const currentUser = userService.getCurrentUser();

  useEffect(() => {
    loadQuotes();
    
    // 🧪 Função de debug disponível no console
    (window as any).debugKanbanSync = () => {
      console.log('🧪 DEBUG: Testando sincronização do Kanban...');
      const quotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      console.log('📊 Estado atual:', {
        totalQuotes: quotes.length,
        approvedQuotes: quotes.filter((q: any) => q.status === 'approved').length,
        totalOrders: orders.length,
        ordersFromPublicQuotes: orders.filter((o: any) => o.labels?.includes('ORCAMENTO_PUBLICO')).length
      });
      
      // Forçar sincronização
      refreshFromStorage();
    };
  }, []);

  const loadQuotes = () => {
    try {
      const storedQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
      // Converter strings de data para objetos Date
      const parsedQuotes = storedQuotes.map((quote: any) => ({
        ...quote,
        timestamp: new Date(quote.timestamp),
        lastContactDate: quote.lastContactDate ? new Date(quote.lastContactDate) : undefined,
        approvedAt: quote.approvedAt ? new Date(quote.approvedAt) : undefined,
        rejectedAt: quote.rejectedAt ? new Date(quote.rejectedAt) : undefined,
        actions: quote.actions?.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        })) || []
      }));
      setQuotes(parsedQuotes.reverse()); // Mais recentes primeiro
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações de orçamento');
    }
  };

  const addQuoteAction = (quoteId: string, action: Omit<QuoteAction, 'id'>) => {
    const newAction: QuoteAction = {
      id: `action-${Date.now()}`,
      ...action
    };

    const updatedQuotes = quotes.map(quote => 
      quote.id === quoteId 
        ? { 
            ...quote, 
            actions: [...(quote.actions || []), newAction]
          } 
        : quote
    );
    
    setQuotes(updatedQuotes);
    localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
    
    return updatedQuotes.find(q => q.id === quoteId);
  };

  const approveQuote = async (quote: QuoteData) => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsApproving(true);
    
    try {
      console.log('🚀 INICIANDO APROVAÇÃO SIMPLIFICADA - Quote ID:', quote.id);
      console.log('📋 Dados da solicitação:', {
        customer: quote.customer,
        product: quote.product,
        products: (quote as any).products, // Nova estrutura com múltiplos produtos
        customization: quote.customization
      });
      
      // ETAPA 1: Atualizar status no localStorage (UMA única vez)
      const updatedQuotes = quotes.map(q => 
        q.id === quote.id 
          ? { 
              ...q, 
              status: 'approved' as const,
              approvedBy: currentUser.name,
              approvedAt: new Date()
            } 
          : q
      );
      
      setQuotes(updatedQuotes);
      localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
      console.log('✅ Status atualizado para approved no localStorage');
      
      // ETAPA 2: DETECÇÃO INTELIGENTE DE MÚLTIPLAS ESTRUTURAS DE CUSTOMER
      const customerData = quote.customer as any;
      
      // 🔍 Detectar todas as possíveis estruturas de nome
      const customerName = customerData?.name || customerData?.nome || 'Cliente não informado';
      
      // 🔍 Detectar todas as possíveis estruturas de telefone
      const customerPhone = customerData?.phone || customerData?.fone || customerData?.telefone || '';
      
      // 🔍 Detectar email (padronizado)
      const customerEmail = customerData?.email || '';
      
      // 🔍 Detectar empresa/razão social
      const customerCompany = customerData?.company || customerData?.nome_fantasia || customerData?.empresa || '';
      
      // 🔍 NOVOS CAMPOS - Dados adicionais para sincronização completa
      const customerCpfCnpj = customerData?.cpf_cnpj || customerData?.document || '';
      const customerTipoPessoa = customerData?.tipo_pessoa || customerData?.personType || '';
      const customerCep = customerData?.cep || customerData?.zipCode || '';
      const customerEndereco = customerData?.endereco || customerData?.address || '';
      const customerNumero = customerData?.numero || customerData?.number || '';
      const customerBairro = customerData?.bairro || customerData?.neighborhood || '';
      const customerCidade = customerData?.cidade || customerData?.city || '';
      const customerUf = customerData?.uf || customerData?.state || '';
      const customerComplemento = customerData?.complemento || '';
      
      console.log('🔍 DETECÇÃO DE ESTRUTURAS:', {
        estruturaDetectada: {
          temName: !!customerData?.name,
          temNome: !!customerData?.nome,
          temPhone: !!customerData?.phone,
          temFone: !!customerData?.fone,
          temCompany: !!customerData?.company,
          temNomeFantasia: !!customerData?.nome_fantasia,
          temCpfCnpj: !!customerData?.cpf_cnpj,
          temDocument: !!customerData?.document
        },
        dadosExtraidos: {
          customerName,
          customerPhone,
          customerEmail,
          customerCompany,
          customerCpfCnpj,
          customerTipoPessoa
        }
      });
      
      // ETAPA 3: Detectar estrutura dos produtos (antiga vs nova)
      let productsForCard: Array<{id: string, name: string, quantity: number}> = [];
      let cardTitle = '';
      
      const quoteWithProducts = quote as any; // Para acessar a propriedade products
      
      if (quoteWithProducts.products && Array.isArray(quoteWithProducts.products)) {
        // ESTRUTURA NOVA: Múltiplos produtos
        console.log('🔍 Detectada estrutura NOVA com múltiplos produtos:', quoteWithProducts.products);
        
        // Buscar dados completos dos produtos no localStorage
        const storedProducts = localStorage.getItem('products');
        const configProducts = storedProducts ? JSON.parse(storedProducts) : [];
        
        productsForCard = quoteWithProducts.products.map((selectedProduct: any) => {
          // Encontrar dados completos do produto
          const fullProduct = configProducts.find((p: any) => p.id === selectedProduct.product_id);
          
          return {
            id: selectedProduct.product_id,
            name: fullProduct?.name || selectedProduct.product_id,
            quantity: selectedProduct.quantity || 1
          };
        });
        
        // Criar título com múltiplos produtos
        const productNames = productsForCard.map(p => `${p.name} (${p.quantity})`).join(', ');
        cardTitle = `${productNames} - ${customerName}`;
        
        console.log('📦 Produtos processados:', productsForCard);
        
      } else if (quote.product) {
        // ESTRUTURA ANTIGA: Um produto
        console.log('🔍 Detectada estrutura ANTIGA com um produto:', quote.product);
        
        productsForCard = [{
          id: quote.product.id || `product-${Date.now()}`,
          name: quote.product.name || 'Produto não informado',
          quantity: parseInt(quote.customization?.quantity?.toString() || '1')
        }];
        
        cardTitle = `${productsForCard[0].name} - ${customerName}`;
        
      } else {
        // Fallback se não encontrar nenhuma estrutura
        console.log('⚠️ Nenhuma estrutura de produto reconhecida, usando fallback');
        productsForCard = [{
          id: `product-${Date.now()}`,
          name: 'Produto não especificado',
          quantity: 1
        }];
        cardTitle = `Produto não especificado - ${customerName}`;
      }
      
      console.log('🔍 Dados extraídos COMPLETOS:', {
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        customerCpfCnpj,
        customerTipoPessoa,
        customerEndereco,
        customerCidade,
        customerUf,
        productsForCard,
        cardTitle
      });
      
      // ETAPA 4: Criar card DIRETAMENTE no Kanban (com dados COMPLETOS)
      const orderData = {
        title: cardTitle,
        description: `📋 Orçamento público autorizado em ${new Date().toLocaleDateString('pt-BR')}\n✅ Autorizado por: ${currentUser.name}\n\n👤 Cliente: ${customerName}\n🏢 Empresa: ${customerCompany || 'Não informado'}\n📄 Documento: ${customerCpfCnpj || 'Não informado'}\n📍 Cidade: ${customerCidade || 'Não informado'} - ${customerUf || 'Não informado'}\n\n🛍️ Produtos:\n${productsForCard.map(p => `• ${p.name} (${p.quantity} unidades)`).join('\n')}\n\n🎨 Personalização:\n${quote.customization ? Object.entries(quote.customization).map(([key, value]) => `• ${key}: ${value}`).join('\n') : '• Nenhuma personalização especificada'}`,
        customer: {
          id: `customer-${Date.now()}`,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          company: customerCompany,
          createdAt: new Date(),
          // 🆕 NOVOS CAMPOS SINCRONIZADOS
          document: customerCpfCnpj,
          personType: customerTipoPessoa === '1' ? 'Física' as const : customerTipoPessoa === '2' ? 'Jurídica' as const : undefined,
          zipCode: customerCep,
          address: customerEndereco,
          number: customerNumero,
          neighborhood: customerBairro,
          city: customerCidade,
          state: customerUf
        },
        status: 'FAZER' as const,
        priority: 'normal' as const,
        labels: ['ORCAMENTO_PUBLICO'] as Label[],
        personalizationDetails: quote.customization ? Object.entries(quote.customization)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') : 'Nenhuma personalização especificada',
        customerDetails: `Nome: ${customerName}\nEmpresa: ${customerCompany || 'Não informado'}\nDocumento: ${customerCpfCnpj || 'Não informado'}\nTelefone: ${customerPhone || 'Não informado'}\nE-mail: ${customerEmail || 'Não informado'}\nEndereço: ${customerEndereco || 'Não informado'}, ${customerNumero || 'S/N'}\nBairro: ${customerBairro || 'Não informado'}\nCidade: ${customerCidade || 'Não informado'} - ${customerUf || 'Não informado'}\nCEP: ${customerCep || 'Não informado'}`,
        products: productsForCard,
        comments: [],
        attachments: [],
        artworkImages: [],
        artworkComments: []
      };
      
      console.log('📝 Dados do card preparados COMPLETOS:', {
        title: orderData.title,
        customerName: orderData.customer.name,
        customerDocument: orderData.customer.document,
        customerCity: orderData.customer.city,
        products: orderData.products
      });
      
      // Criar card diretamente
      await addPublicOrder(orderData);
      console.log('✅ Card criado diretamente no Kanban via addPublicOrder');
      
      // ETAPA 5: Adicionar ação ao histórico (após tudo dar certo)
      addQuoteAction(quote.id, {
        action: 'approved',
        user: currentUser.name,
        timestamp: new Date(),
        comment: 'Solicitação autorizada e enviada para o Kanban com dados completos'
      });
      
      // ETAPA 6: Notificar sucesso
      toast.success('✅ Solicitação autorizada!', {
        description: `Card criado automaticamente na coluna "A Fazer" do Kanban com dados completos`,
        duration: 4000
      });

      // ETAPA 7: Atualizar interface se necessário
      if (selectedQuote?.id === quote.id) {
        const updatedQuote = updatedQuotes.find(q => q.id === quote.id);
        if (updatedQuote) setSelectedQuote(updatedQuote);
      }

      console.log('🎉 AUTORIZAÇÃO CONCLUÍDA COM SINCRONIZAÇÃO COMPLETA!');

    } catch (error) {
      console.error('❌ ERRO na autorização:', error);
      toast.error('Erro ao autorizar solicitação: ' + (error as Error).message);
    } finally {
      setIsApproving(false);
    }
  };

  const rejectQuote = async (quote: QuoteData) => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsRejecting(true);
    
    try {
      // Atualizar status da solicitação para "rejected"
      const updatedQuotes = quotes.map(q => 
        q.id === quote.id 
          ? { 
              ...q, 
              status: 'rejected' as const,
              rejectedBy: currentUser.name,
              rejectedAt: new Date()
            } 
          : q
      );
      
      setQuotes(updatedQuotes);
      localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
      
      // Adicionar ação ao histórico
      addQuoteAction(quote.id, {
        action: 'rejected',
        user: currentUser.name,
        timestamp: new Date(),
        comment: 'Solicitação rejeitada'
      });

      toast.success('❌ Solicitação rejeitada', {
        description: 'A solicitação foi marcada como rejeitada',
        duration: 3000
      });

      // Atualizar a solicitação selecionada se for a mesma
      if (selectedQuote?.id === quote.id) {
        const updatedQuote = updatedQuotes.find(q => q.id === quote.id);
        if (updatedQuote) setSelectedQuote(updatedQuote);
      }

    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setIsRejecting(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: 'pending' | 'contacted' | 'completed' | 'approved' | 'rejected') => {
    setIsSaving(true);
    try {
      const updatedQuotes = quotes.map(quote => 
        quote.id === quoteId 
          ? { 
              ...quote, 
              status: newStatus,
              lastContactDate: newStatus === 'contacted' ? new Date() : quote.lastContactDate
            } 
          : quote
      );
      
      setQuotes(updatedQuotes);
      localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
      
      const statusMessages = {
        pending: 'Solicitação marcada como pendente',
        contacted: 'Cliente marcado como contatado',
        completed: 'Solicitação marcada como finalizada',
        approved: 'Solicitação autorizada',
        rejected: 'Solicitação rejeitada'
      };
      
      toast.success(statusMessages[newStatus]);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da solicitação');
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuoteNotes = async (quoteId: string, newNotes: string, newEstimatedValue?: number) => {
    setIsSaving(true);
    try {
      const updatedQuotes = quotes.map(quote => 
        quote.id === quoteId 
          ? { 
              ...quote, 
              notes: newNotes,
              estimatedValue: newEstimatedValue
            } 
          : quote
      );
      
      setQuotes(updatedQuotes);
      localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
      
      toast.success('Informações atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuote = (quote: QuoteData) => {
    setQuoteToDelete(quote);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteQuote = () => {
    if (!quoteToDelete) return;
    
    try {
      const updatedQuotes = quotes.filter(quote => quote.id !== quoteToDelete.id);
      setQuotes(updatedQuotes);
      localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
      
      toast.success('Solicitação excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setQuoteToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast.error('Erro ao excluir solicitação');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'contacted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'approved': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'contacted': return 'Contatado';
      case 'completed': return 'Finalizado';
      case 'approved': return 'Autorizado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'contacted': return <MessageCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'approved': return <ThumbsUp className="h-3 w-3" />;
      case 'rejected': return <ThumbsDown className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesFilter = filter === 'all' || quote.status === filter;
    const matchesSearch = searchQuery === '' || 
      (quote.customer?.name && quote.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quote.customer?.email && quote.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quote.customer?.company && quote.customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quote.product?.name && quote.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const exportQuotes = () => {
    try {
      const dataStr = JSON.stringify(filteredQuotes, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `solicitacoes_orcamento_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const openQuoteDetail = (quote: QuoteData) => {
    setSelectedQuote(quote);
    setNotes(quote.notes || '');
    setEstimatedValue(quote.estimatedValue?.toString() || '');
    setIsDetailDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getQuoteStats = () => {
    const total = quotes.length;
    const pending = quotes.filter(q => q.status === 'pending').length;
    const contacted = quotes.filter(q => q.status === 'contacted').length;
    const completed = quotes.filter(q => q.status === 'completed').length;
    const approved = quotes.filter(q => q.status === 'approved').length;
    const rejected = quotes.filter(q => q.status === 'rejected').length;
    
    return { total, pending, contacted, completed, approved, rejected };
  };

  const stats = getQuoteStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Solicitações de Orçamento</h2>
          <p className="text-muted-foreground">
            Gerencie as solicitações recebidas através da interface pública
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportQuotes}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={loadQuotes}>
            <Eye className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Únicas - Mais Completas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700 font-medium">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700 font-medium">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
            <div className="text-sm text-blue-700 font-medium">Contatados</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-700 font-medium">Finalizados</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.approved}</div>
            <div className="text-sm text-purple-700 font-medium">Autorizados</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-red-700 font-medium">Rejeitados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por nome, email, empresa ou produto..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="contacted">Contatados</SelectItem>
            <SelectItem value="completed">Finalizados</SelectItem>
            <SelectItem value="approved">Autorizados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Solicitações - Design Modernizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQuotes.map((quote) => (
          <Card key={quote.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 backdrop-blur-sm">
            <CardHeader className="pb-4 relative">
              {/* Badge de Status no Canto Superior */}
              <div className="absolute top-4 right-4">
                <Badge className={`${getStatusColor(quote.status)} shadow-sm`} variant="outline">
                  {getStatusIcon(quote.status)}
                  <span className="ml-1 font-medium">{getStatusLabel(quote.status)}</span>
                </Badge>
              </div>
              
              <div className="space-y-3 pr-24">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 truncate">
                      {quote.customer?.name || 'Cliente não especificado'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 truncate">
                      {quote.customer?.company || 'Pessoa Física'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/60 rounded-md px-2 py-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(quote.timestamp).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(quote.timestamp).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-0">
              {/* Informações de Contato */}
              <div className="bg-white/70 rounded-lg p-3 space-y-2 border border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1 bg-green-100 rounded">
                    <Phone className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="flex-1 text-gray-700">{quote.customer?.phone || 'Telefone não informado'}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-green-100"
                    onClick={() => {
                      if (quote.customer?.phone) {
                        window.open(`https://wa.me/${quote.customer.phone.replace(/\D/g, '')}`, '_blank')
                      }
                    }}
                    disabled={!quote.customer?.phone}
                  >
                    <ExternalLink className="h-3 w-3 text-green-600" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1 bg-blue-100 rounded">
                    <Mail className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="flex-1 text-gray-700 truncate">{quote.customer?.email || 'Email não informado'}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-blue-100"
                    onClick={() => {
                      if (quote.customer?.email) {
                        window.open(`mailto:${quote.customer.email}`, '_blank')
                      }
                    }}
                    disabled={!quote.customer?.email}
                  >
                    <ExternalLink className="h-3 w-3 text-blue-600" />
                  </Button>
                </div>
              </div>

              {/* Produto Solicitado */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-purple-100 rounded">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-purple-900">{quote.product?.name || 'Produto não especificado'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {quote.customization && Object.entries(quote.customization).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-white/60 rounded px-2 py-1">
                      <span className="text-gray-600 capitalize truncate">{key}:</span>
                      <span className="font-medium text-gray-800 truncate ml-1">{value}</span>
                    </div>
                  ))}
                  {quote.customization && Object.keys(quote.customization).length > 4 && (
                    <div className="col-span-2 text-center text-gray-500 text-xs py-1">
                      +{Object.keys(quote.customization).length - 4} itens...
                    </div>
                  )}
                  {(!quote.customization || Object.keys(quote.customization).length === 0) && (
                    <div className="col-span-2 text-center text-gray-500 text-xs py-1">
                      Nenhuma personalização especificada
                    </div>
                  )}
                </div>
              </div>

              {/* Valor Estimado (se existir) */}
              {quote.estimatedValue && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
                  <p className="text-xs text-green-700 mb-1">Valor Estimado</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(quote.estimatedValue)}
                  </p>
                </div>
              )}

              {/* Observações (se existir) */}
              {quote.notes && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Observações:</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{quote.notes}</p>
                </div>
              )}

              {/* Ações Rápidas */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => openQuoteDetail(quote)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Detalhes
                </Button>
                
                {quote.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => approveQuote(quote)}
                      disabled={isApproving || isRejecting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-sm"
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Autorizando...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Autorizar
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => rejectQuote(quote)}
                      disabled={isApproving || isRejecting}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-sm"
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Rejeitando...
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Rejeitar
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {quote.status === 'contacted' && (
                  <Button 
                    size="sm" 
                    onClick={() => updateQuoteStatus(quote.id, 'completed')}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Finalizar
                  </Button>
                )}

                {/* Menu de Ações */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id, 'contacted')}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Marcar como contatado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id, 'completed')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como finalizado
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteQuote(quote)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery || filter !== 'all' 
              ? "Tente ajustar os filtros de busca para encontrar as solicitações desejadas" 
              : "As solicitações de orçamento aparecerão aqui quando forem recebidas através da interface pública"}
          </p>
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes da solicitação de orçamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <UILabel className="text-sm font-medium">Nome:</UILabel>
                      <p className="text-sm">{selectedQuote.customer?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <UILabel className="text-sm font-medium">E-mail:</UILabel>
                      <p className="text-sm">{selectedQuote.customer?.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <UILabel className="text-sm font-medium">Telefone:</UILabel>
                      <p className="text-sm">{selectedQuote.customer?.phone || 'Não informado'}</p>
                    </div>
                    {selectedQuote.customer?.company && (
                      <div>
                        <UILabel className="text-sm font-medium">Empresa:</UILabel>
                        <p className="text-sm">{selectedQuote.customer.company}</p>
                      </div>
                    )}
                    <div>
                      <UILabel className="text-sm font-medium">Data da Solicitação:</UILabel>
                      <p className="text-sm">
                        {new Date(selectedQuote.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Produto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Produto Solicitado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3">
                      <img 
                        src={selectedQuote.product?.imageUrl || '/placeholder-product.png'}
                        alt={selectedQuote.product?.name || 'Produto'}
                        className="w-16 h-16 object-contain rounded border bg-gray-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                      <div>
                        <h4 className="font-medium">{selectedQuote.product?.name || 'Produto não especificado'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedQuote.product?.description || 'Descrição não disponível'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <UILabel className="text-sm font-medium mb-2 block">Personalização:</UILabel>
                      <div className="space-y-2">
                        {selectedQuote.customization && Object.keys(selectedQuote.customization).length > 0 ? (
                          Object.entries(selectedQuote.customization).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="capitalize font-medium">{key}:</span>
                              <span>{value}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhuma personalização especificada</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gerenciamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento da Solicitação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status atual e informações de aprovação/rejeição */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Status Atual:</span>
                      <Badge className={getStatusColor(selectedQuote.status)} variant="outline">
                        {getStatusIcon(selectedQuote.status)}
                        <span className="ml-1">{getStatusLabel(selectedQuote.status)}</span>
                      </Badge>
                    </div>
                    
                    {selectedQuote.status === 'approved' && selectedQuote.approvedBy && (
                      <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                        ✅ Autorizado por {selectedQuote.approvedBy} em {selectedQuote.approvedAt?.toLocaleString('pt-BR')}
                      </div>
                    )}
                    
                    {selectedQuote.status === 'rejected' && selectedQuote.rejectedBy && (
                      <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                        ❌ Rejeitado por {selectedQuote.rejectedBy} em {selectedQuote.rejectedAt?.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Ações principais - Autorizar/Rejeitar */}
                  {selectedQuote.status === 'pending' && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium mb-3 text-blue-900">Ações da Solicitação</h4>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => approveQuote(selectedQuote)}
                          disabled={isApproving || isRejecting}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          {isApproving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Autorizando...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Autorizar
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => rejectQuote(selectedQuote)}
                          disabled={isApproving || isRejecting}
                          variant="destructive"
                          className="flex-1"
                        >
                          {isRejecting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 mr-2" />
                          )}
                          Rejeitar
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        💡 Autorizar irá criar automaticamente um card no Kanban na coluna "A Fazer"
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <UILabel htmlFor="status">Status:</UILabel>
                      <Select 
                        value={selectedQuote.status} 
                        onValueChange={(value) => updateQuoteStatus(selectedQuote.id, value as any)}
                        disabled={selectedQuote.status === 'approved' || selectedQuote.status === 'rejected'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="completed">Finalizado</SelectItem>
                          <SelectItem value="approved">Autorizados</SelectItem>
                          <SelectItem value="rejected">Rejeitados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <UILabel htmlFor="estimated-value">Valor Estimado (R$):</UILabel>
                      <Input
                        id="estimated-value"
                        type="number"
                        step="0.01"
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <UILabel htmlFor="notes">Observações:</UILabel>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione observações sobre esta solicitação..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        updateQuoteNotes(
                          selectedQuote.id, 
                          notes, 
                          estimatedValue ? parseFloat(estimatedValue) : undefined
                        );
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Histórico de Ações */}
              {selectedQuote.actions && selectedQuote.actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Histórico de Ações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedQuote.actions.slice().reverse().map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            {action.action === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {action.action === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                            {action.action === 'contacted' && <MessageCircle className="h-4 w-4 text-blue-600" />}
                            {action.action === 'commented' && <MessageSquare className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {action.action === 'approved' && 'Solicitação Autorizada'}
                                {action.action === 'rejected' && 'Solicitação Rejeitada'}
                                {action.action === 'contacted' && 'Cliente Contatado'}
                                {action.action === 'commented' && 'Comentário Adicionado'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {action.timestamp.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Por: {action.user}
                            </div>
                            {action.comment && (
                              <div className="text-xs text-gray-700 mt-2 p-2 bg-white rounded border">
                                {action.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta solicitação de orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {quoteToDelete && (
            <div className="py-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{quoteToDelete.customer?.name || 'Cliente não especificado'}</p>
                <p className="text-sm text-muted-foreground">{quoteToDelete.product?.name || 'Produto não especificado'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(quoteToDelete.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteQuote}>
              Excluir Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 