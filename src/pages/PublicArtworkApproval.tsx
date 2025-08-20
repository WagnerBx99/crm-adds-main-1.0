import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  User,
  Building,
  Calendar,
  ImageIcon,
  ArrowLeft,
  Shield,
  FileText,
  Download,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, ArtworkImage, ArtworkApprovalToken, ArtworkActionLog, Comment } from '@/types';

interface PublicArtworkApprovalProps {}

export default function PublicArtworkApproval({}: PublicArtworkApprovalProps) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<ArtworkApprovalToken | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [artwork, setArtwork] = useState<ArtworkImage | null>(null);
  const [clientName, setClientName] = useState('');
  const [decision, setDecision] = useState<'approved' | 'adjustment_requested' | null>(null);
  const [adjustmentComment, setAdjustmentComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadApprovalData();
    }
  }, [token]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando dados de aprovação para token:', token);
      
      // Buscar token do localStorage
      const storedTokens = localStorage.getItem('artworkApprovalTokens');
      console.log('📦 Tokens armazenados:', storedTokens);
      
      let tokens: ArtworkApprovalToken[] = [];
      if (storedTokens) {
        tokens = JSON.parse(storedTokens);
        console.log('🎯 Tokens parseados:', tokens);
        console.log('🎯 Total de tokens:', tokens.length);
      }
      
      // Encontrar o token correspondente
      const foundToken = tokens.find(t => t.token === token);
      console.log('🔎 Token encontrado:', foundToken);
      
      if (!foundToken) {
        console.error('❌ Token não encontrado');
        console.log('🔍 Tokens disponíveis:', tokens.map(t => t.token));
        setError('Link de aprovação inválido ou não encontrado.');
        return;
      }

      // Verificar se o token é válido e não expirou
      const expirationDate = new Date(foundToken.expiresAt);
      const currentDate = new Date();
      console.log('⏰ Data de expiração:', expirationDate);
      console.log('⏰ Data atual:', currentDate);
      
      if (expirationDate < currentDate) {
        console.error('❌ Token expirado');
        setError('Este link de aprovação expirou. Entre em contato conosco para obter um novo link.');
        return;
      }

      if (foundToken.used) {
        console.error('❌ Token já utilizado');
        setError('Este link de aprovação já foi utilizado.');
        return;
      }

      // Buscar dados do pedido
      const storedOrders = localStorage.getItem('orders');
      console.log('📦 Pedidos armazenados:', storedOrders ? 'Encontrados' : 'Não encontrados');
      
      let orders: Order[] = [];
      if (storedOrders) {
        orders = JSON.parse(storedOrders);
        console.log('📋 Total de pedidos:', orders.length);
        console.log('📋 IDs dos pedidos:', orders.map(o => ({ id: o.id, type: typeof o.id })));
        console.log('🔍 Procurando pedido com ID:', foundToken.orderId, 'tipo:', typeof foundToken.orderId);
      }

      // Buscar pedido com comparação mais robusta
      let foundOrder = orders.find(o => o.id === foundToken.orderId);
      
      if (!foundOrder) {
        console.log('🔍 Tentativa 1 falhou, tentando comparação por string...');
        foundOrder = orders.find(o => String(o.id) === String(foundToken.orderId));
      }
      
      if (!foundOrder) {
        console.log('🔍 Tentativa 2 falhou, tentando comparação loose...');
        foundOrder = orders.find(o => o.id == foundToken.orderId);
      }
      
      if (!foundOrder) {
        console.log('🔍 Tentativa 3 falhou, listando todos os pedidos para debug...');
        orders.forEach((order, index) => {
          console.log(`📋 Pedido ${index}:`, {
            id: order.id,
            type: typeof order.id,
            title: order.title,
            customer: order.customer?.name
          });
        });
      }
      
      console.log('🎯 Pedido encontrado:', foundOrder ? 'Sim' : 'Não');
      
      if (!foundOrder) {
        console.error('❌ Pedido não encontrado');
        console.log('🔍 ID procurado:', foundToken.orderId);
        console.log('🔍 IDs disponíveis:', orders.map(o => o.id));
        setError('Pedido não encontrado.');
        return;
      }

      // Buscar a arte específica
      console.log('🎨 Procurando arte com ID:', foundToken.artworkId);
      console.log('🎨 Artes finalizadas no pedido:', foundOrder.finalizedArtworks?.length || 0);
      
      if (foundOrder.finalizedArtworks) {
        foundOrder.finalizedArtworks.forEach((artwork, index) => {
          console.log(`🎨 Arte ${index}:`, {
            id: artwork.id,
            name: artwork.name,
            type: artwork.type
          });
        });
      }
      
      const foundArtwork = foundOrder.finalizedArtworks?.find(a => a.id === foundToken.artworkId);
      console.log('🎨 Arte encontrada:', foundArtwork ? 'Sim' : 'Não');
      
      if (!foundArtwork) {
        console.error('❌ Arte não encontrada');
        console.log('🔍 ID da arte procurado:', foundToken.artworkId);
        console.log('🔍 IDs das artes disponíveis:', foundOrder.finalizedArtworks?.map(a => a.id) || []);
        setError('Arte não encontrada.');
        return;
      }

      console.log('✅ Dados carregados com sucesso');
      setTokenData(foundToken);
      setOrder(foundOrder);
      setArtwork(foundArtwork);
      
    } catch (error) {
      console.error('💥 Erro ao carregar dados de aprovação:', error);
      setError('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!clientName.trim()) {
      toast.error('Por favor, informe seu nome completo');
      return;
    }

    if (!decision) {
      toast.error('Por favor, selecione uma opção');
      return;
    }

    if (decision === 'adjustment_requested' && !adjustmentComment.trim()) {
      toast.error('Por favor, informe qual ajuste deve ser feito');
      return;
    }

    try {
      setSubmitting(true);

      // Atualizar token como usado no localStorage
      const storedTokens = localStorage.getItem('artworkApprovalTokens');
      let tokens: ArtworkApprovalToken[] = [];
      if (storedTokens) {
        tokens = JSON.parse(storedTokens);
      }
      
      const updatedTokens = tokens.map(t => 
        t.token === tokenData!.token 
          ? {
              ...t,
              used: true,
              usedAt: new Date(),
              clientName: clientName.trim(),
              clientDecision: decision,
              adjustmentComment: decision === 'adjustment_requested' ? adjustmentComment.trim() : undefined
            }
          : t
      );
      localStorage.setItem('artworkApprovalTokens', JSON.stringify(updatedTokens));

      // Criar log da ação com comentário se for ajuste
      const actionDetails = decision === 'approved' 
        ? `Cliente aprovou arte via link público`
        : `Cliente solicitou ajuste na arte via link público: "${adjustmentComment.trim()}"`;

      const actionLog: ArtworkActionLog = {
        id: `log-${Date.now()}`,
        orderId: order!.id,
        artworkId: artwork!.id,
        action: decision,
        performedBy: clientName.trim(),
        performedByType: 'client',
        details: actionDetails,
        timestamp: new Date()
      };

      // Se for solicitação de ajuste, criar também um comentário na arte
      let newArtworkComment: Comment | null = null;
      if (decision === 'adjustment_requested' && adjustmentComment.trim()) {
        newArtworkComment = {
          id: `comment-${Date.now()}`,
          text: adjustmentComment.trim(),
          createdAt: new Date(),
          user: clientName.trim(),
          approved: false,
          altered: false
        };
      }

      // Atualizar status da arte
      const updatedArtwork: ArtworkImage = {
        ...artwork!,
        status: decision === 'approved' ? 'approved' : 'adjustment_requested'
      };

      // Atualizar pedido
      const storedOrders = localStorage.getItem('orders');
      let orders: Order[] = [];
      if (storedOrders) {
        orders = JSON.parse(storedOrders);
      }

      const updatedOrders = orders.map(o => {
        if (o.id === order!.id) {
          const updatedOrder: Order = {
            ...o,
            finalizedArtworks: o.finalizedArtworks?.map(a => 
              a.id === artwork!.id ? updatedArtwork : a
            ) || [],
            artworkActionLogs: [...(o.artworkActionLogs || []), actionLog],
            // Adicionar comentário se for ajuste
            artworkComments: newArtworkComment 
              ? [...(o.artworkComments || []), newArtworkComment]
              : o.artworkComments || [],
            status: decision === 'approved' ? 'ARTE_APROVADA' : 'AJUSTE',
            updatedAt: new Date()
          };

          // Adicionar entrada no histórico
          const historyComment = decision === 'approved' 
            ? `Arte aprovada por ${clientName.trim()} via link público`
            : `Ajuste solicitado por ${clientName.trim()} via link público: "${adjustmentComment.trim()}"`;

          updatedOrder.history = [
            ...updatedOrder.history,
            {
              id: `history-${Date.now()}`,
              date: new Date(),
              status: decision === 'approved' ? 'ARTE_APROVADA' : 'AJUSTE',
              comment: historyComment,
              user: clientName.trim()
            }
          ];

          return updatedOrder;
        }
        return o;
      });

      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      setSubmitted(true);
      toast.success(`Decisão registrada com sucesso!`);

    } catch (error) {
      console.error('Erro ao enviar decisão:', error);
      toast.error('Erro ao registrar decisão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados de aprovação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Erro de Acesso</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700 mb-2">
              Obrigado, {clientName}!
            </h2>
            <p className="text-green-600 mb-2">
              Sua decisão foi registrada com sucesso.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {decision === 'approved' 
                ? 'A arte foi aprovada e seguirá para produção.'
                : 'Sua solicitação de ajuste foi registrada e nossa equipe entrará em contato.'
              }
            </p>
            
            {/* Mostrar comentário de ajuste se aplicável */}
            {decision === 'adjustment_requested' && adjustmentComment && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Sua solicitação de ajuste:</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{adjustmentComment}"</p>
              </div>
            )}
            
            <Badge 
              variant="secondary" 
              className={`${decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} mb-4`}
            >
              {decision === 'approved' ? 'Arte Aprovada' : 'Ajuste Solicitado'}
            </Badge>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                ADDS Brasil - Soluções em Personalização
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aprovação de Arte</h1>
              <p className="text-sm text-gray-600">ADDS Brasil - Soluções em Personalização</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {order?.customer.name}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Empresa</Label>
                <p className="text-gray-900">{order?.customer.company}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Pedido</Label>
                <p className="text-gray-900">{order?.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Data de Criação</Label>
                <p className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : ''}
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Link seguro e criptografado</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Expira em: {tokenData?.expiresAt ? new Date(tokenData.expiresAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Arte para Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Arte para Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {artwork && (
                <div className="space-y-4">
                  <div className="relative">
                    {artwork.type === 'application/pdf' ? (
                      <div className="w-full h-64 flex flex-col items-center justify-center rounded-lg border bg-gray-50 shadow-sm">
                        <FileText className="h-20 w-20 text-red-500 mb-3" />
                        <p className="text-lg font-medium text-gray-700 mb-1">Arquivo PDF</p>
                        <p className="text-sm text-gray-500 mb-4">{artwork.name}</p>
                        <Button
                          variant="outline"
                          onClick={() => window.open(artwork.url, '_blank')}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Visualizar PDF
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={artwork.url} 
                        alt={artwork.name}
                        className="w-full h-64 object-contain rounded-lg border bg-gray-50 shadow-sm"
                      />
                    )}
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-blue-100 text-blue-700"
                    >
                      Para Aprovação
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">{artwork.name}</p>
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(artwork.createdAt).toLocaleDateString('pt-BR')} por {artwork.uploadedBy}
                    </p>
                    {artwork.type && (
                      <p className="text-xs text-gray-400">
                        Tipo: {artwork.type === 'application/pdf' ? 'PDF' : 'Imagem'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Aprovação */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sua Decisão</CardTitle>
            <p className="text-sm text-gray-600">
              Por favor, analise a arte acima e informe sua decisão
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="clientName" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Qual sua decisão sobre esta arte?
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={decision === 'approved' ? 'default' : 'outline'}
                  onClick={() => {
                    setDecision('approved');
                    setAdjustmentComment(''); // Limpar comentário se mudar para aprovado
                  }}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    decision === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border-green-200 text-green-700 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-medium">Aprovar Arte</p>
                    <p className="text-xs opacity-80">
                      A arte está perfeita e pode seguir para produção
                    </p>
                  </div>
                </Button>

                <Button
                  variant={decision === 'adjustment_requested' ? 'default' : 'outline'}
                  onClick={() => setDecision('adjustment_requested')}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    decision === 'adjustment_requested' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  <XCircle className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-medium">Solicitar Ajuste</p>
                    <p className="text-xs opacity-80">
                      A arte precisa de modificações
                    </p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Campo de comentário - apenas se solicitando ajuste */}
            {decision === 'adjustment_requested' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  <Label htmlFor="adjustmentComment" className="text-sm font-medium text-orange-800">
                    Descreva os ajustes necessários *
                  </Label>
                </div>
                <Textarea
                  id="adjustmentComment"
                  value={adjustmentComment}
                  onChange={(e) => setAdjustmentComment(e.target.value)}
                  placeholder="Por favor, descreva detalhadamente quais ajustes devem ser feitos na arte..."
                  className="resize-none bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  rows={4}
                  required
                />
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Este campo é obrigatório para solicitações de ajuste
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmitDecision}
                disabled={!clientName.trim() || !decision || (decision === 'adjustment_requested' && !adjustmentComment.trim()) || submitting}
                className="w-full h-12 text-lg font-medium"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando Decisão...
                  </>
                ) : (
                  'Confirmar Decisão'
                )}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              Ao confirmar, sua decisão será registrada e nossa equipe será notificada.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 