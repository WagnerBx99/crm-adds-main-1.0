import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Package,
  Sparkles,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Importar componentes existentes
import WelcomeScreen from '@/components/auth/WelcomeScreen';
import QuickLogin from '@/components/auth/QuickLogin';
import PublicContactForm from '@/components/contact/PublicContactForm';
import MultipleProductSelector from '@/components/personalization/MultipleProductSelector';
import UltraPremiumPersonalizationForm from '@/components/personalization/UltraPremiumPersonalizationForm';
import { useProducts } from '@/hooks/useProducts';
import { PublicContact } from '@/types/contact';
import { resetProducts } from '@/utils/resetProducts';
import { searchTinyContactByCriteria, testTinyApiConnection, debugTinyApiUrls } from '@/lib/services/tinyService';

// Tipos para o fluxo
type FlowStep = 'welcome' | 'login' | 'register' | 'products' | 'customization' | 'confirmation' | 'success';

interface SelectedProduct {
  product_id: string;
  quantity: number;
}

interface CustomizationData {
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  redes: {
    instagram: string;
    facebook: string;
    tiktok: string;
    outro: string;
  };
  logo: File | null;
  logoPreview: string;
  cor_impressao: 'branco' | 'preto' | 'custom';
  cor_custom: string;
}

interface QuoteData {
  id: string;
  customer: PublicContact;
  products: SelectedProduct[];
  customization: CustomizationData;
  timestamp: Date;
  status: 'pending' | 'contacted' | 'completed';
}

export default function EnhancedPublicForm() {
  const { products, loading: productsLoading } = useProducts();
  
  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState<FlowStep>('welcome');
  const [contactData, setContactData] = useState<PublicContact | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [prefilledContactData, setPrefilledContactData] = useState<Partial<PublicContact> | null>(null);
  const [customizationData, setCustomizationData] = useState<CustomizationData>({
    telefone: '',
    whatsapp: '',
    cidade: '',
    estado: '',
    redes: {
      instagram: '',
      facebook: '',
      tiktok: '',
      outro: ''
    },
    logo: null,
    logoPreview: '',
    cor_impressao: 'branco',
    cor_custom: '#000000'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers do fluxo de autenticação
  const handleWelcomeNewUser = () => {
    setCurrentStep('register');
  };

  const handleWelcomeExistingUser = () => {
    setCurrentStep('login');
  };

  const handleLoginSuccess = (contact: PublicContact) => {
    setContactData(contact);
    setCurrentStep('products');
  };

  const handleLoginBack = () => {
    setCurrentStep('welcome');
  };

  const handleLoginSuggestRegister = (prefilledData?: Partial<PublicContact>) => {
    if (prefilledData) {
      setPrefilledContactData(prefilledData);
    }
    setCurrentStep('register');
  };

  const handleRegisterSuccess = (contact: PublicContact) => {
    setContactData(contact);
    setCurrentStep('products');
  };

  const handleRegisterBack = () => {
    setCurrentStep('welcome');
  };

  // Handlers do fluxo de produtos
  const handleProductSelectionChange = (products: SelectedProduct[]) => {
    setSelectedProducts(products);
  };

  const handleContinueToCustomization = () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para continuar');
      return;
    }
    setCurrentStep('customization');
  };

  const handleBackToProducts = () => {
    setCurrentStep('products');
  };

  // Handlers da personalização
  const handlePersonalizationSubmit = (data: CustomizationData) => {
    setCustomizationData(data);
    setCurrentStep('confirmation');
  };

  const handleBackToCustomization = () => {
    setCurrentStep('customization');
  };

  // Handler da confirmação
  const handleSubmitQuote = async () => {
    if (!contactData) return;

    setIsSubmitting(true);
    
    try {
      const quoteData: QuoteData = {
        id: `quote-${Date.now()}`,
        customer: contactData,
        products: selectedProducts,
        customization: customizationData,
        timestamp: new Date(),
        status: 'pending'
      };
      
      // Salvar no localStorage
      const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
      existingQuotes.push(quoteData);
      localStorage.setItem('publicQuotes', JSON.stringify(existingQuotes));
      
      console.log('✅ Orçamento salvo:', quoteData);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep('success');
      
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter informações do produto
  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Calcular totais
  const getTotalUnits = () => {
    return selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
  };

  // Renderizar header comum
  const renderHeader = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ADDS Brasil</h1>
              <p className="text-sm text-gray-600">Solicite seu orçamento personalizado</p>
            </div>
          </div>
          
          {/* Indicador de progresso */}
          {currentStep !== 'welcome' && currentStep !== 'success' && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {contactData ? `👋 ${contactData.nome.split(' ')[0]}` : 'Visitante'}
              </Badge>
              {selectedProducts.length > 0 && (
                <Badge variant="default" className="bg-green-600">
                  {selectedProducts.length} produto(s) • {getTotalUnits()} unidades
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar indicador de etapas
  const renderStepIndicator = () => {
    if (currentStep === 'welcome' || currentStep === 'success') return null;

    const steps = [
      { key: 'auth', label: 'Identificação', completed: !!contactData },
      { key: 'products', label: 'Produtos', completed: selectedProducts.length > 0 },
      { key: 'customization', label: 'Personalização', completed: Object.keys(customizationData).length > 0 },
      { key: 'confirmation', label: 'Confirmação', completed: false }
    ];

    const getCurrentStepIndex = () => {
      if (['login', 'register'].includes(currentStep)) return 0;
      if (currentStep === 'products') return 1;
      if (currentStep === 'customization') return 2;
      if (currentStep === 'confirmation') return 3;
      return 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : step.completed 
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed && index < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm ${
                  index <= currentStepIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-4 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar conteúdo principal
  const renderMainContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div>
            <WelcomeScreen
              onNewUser={handleWelcomeNewUser}
              onExistingUser={handleWelcomeExistingUser}
            />
            {/* Botões de teste */}
            <div className="fixed bottom-4 right-4 space-y-2">
              <div>
                <Button 
                  onClick={() => {
                    resetProducts();
                    window.location.reload();
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-100 border-red-300 text-red-800 w-full"
                >
                  🔄 Reset Produtos
                </Button>
              </div>
              <div>
                <Button 
                  onClick={async () => {
                    console.log('🧪 Testando conectividade com API do Tiny...');
                    try {
                      const result = await testTinyApiConnection();
                      console.log('📊 Resultado do teste de conectividade:', result);
                      
                      if (result.success) {
                        alert(`✅ Conectividade OK!\n\n${result.message}\n\nVerifique o console para mais detalhes.`);
                      } else {
                        alert(`❌ Problema de conectividade!\n\n${result.message}\n\nVerifique o console para mais detalhes.`);
                      }
                    } catch (error) {
                      console.error('❌ Erro no teste de conectividade:', error);
                      alert('❌ Erro no teste de conectividade: ' + error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-purple-100 border-purple-300 text-purple-800 w-full"
                >
                  🔌 Testar Conectividade
                </Button>
              </div>
              <div>
                <Button 
                  onClick={async () => {
                    console.log('🧪 Testando busca específica na API do Tiny...');
                    try {
                      const result = await searchTinyContactByCriteria({
                        email: 'contato.cabral@gmail.com',
                        cpf_cnpj: '07048665955',
                        nome: 'Júnior Cesar Alves Cabral'
                      });
                      console.log('📊 Resultado do teste de busca:', result);
                      if (result) {
                        alert(`✅ Contato encontrado: ${result.name}\nEmail: ${result.email}\nTelefone: ${result.phone}`);
                      } else {
                        alert('❌ Contato não encontrado na API do Tiny\n\nVerifique o console para logs detalhados.');
                      }
                    } catch (error) {
                      console.error('❌ Erro no teste:', error);
                      alert('❌ Erro ao testar API do Tiny: ' + error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-green-100 border-green-300 text-green-800 w-full"
                >
                  🧪 Testar Busca
                </Button>
              </div>
              <div>
                <Button 
                  onClick={() => {
                    setContactData({
                      nome: 'Teste',
                      email: 'teste@teste.com',
                      fone: '11999999999',
                      cpf_cnpj: '12345678901',
                      tipo_pessoa: '1',
                      endereco: 'Rua Teste',
                      numero: '123',
                      bairro: 'Centro',
                      cidade: 'São Paulo',
                      uf: 'SP',
                      cep: '01000-000',
                      complemento: ''
                    });
                    setCurrentStep('products');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-100 border-yellow-300 text-yellow-800 w-full"
                >
                  🧪 Teste Produtos ({products.length})
                </Button>
              </div>
              <div>
                <Button 
                  onClick={async () => {
                    console.log('🔍 Testando diferentes URLs da API do Tiny...');
                    try {
                      const result = await debugTinyApiUrls();
                      console.log('📊 Resultado do teste de URLs:', result);
                      
                      const successCount = result.results.filter(r => r.success).length;
                      const totalCount = result.results.length;
                      
                      if (successCount > 0) {
                        alert(`✅ ${successCount}/${totalCount} URLs funcionaram!\n\nVerifique o console para detalhes completos.`);
                      } else {
                        alert(`❌ Nenhuma URL funcionou (${totalCount} testadas)\n\nVerifique o console para detalhes dos erros.`);
                      }
                    } catch (error) {
                      console.error('❌ Erro no teste de URLs:', error);
                      alert('❌ Erro no teste de URLs: ' + error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-orange-100 border-orange-300 text-orange-800 w-full"
                >
                  🔍 Debug URLs
                </Button>
              </div>
            </div>
          </div>
        );

      case 'login':
        return (
          <QuickLogin
            onSuccess={handleLoginSuccess}
            onBack={handleLoginBack}
            onSuggestRegister={handleLoginSuggestRegister}
          />
        );

      case 'register':
        return (
          <PublicContactForm
            onSuccess={handleRegisterSuccess}
            onCancel={handleRegisterBack}
            prefilledData={prefilledContactData}
          />
        );

      case 'products':
        console.log('🔍 Renderizando etapa de produtos:', { 
          productsLoading, 
          productsCount: products.length,
          products: products.map(p => ({ id: p.id, name: p.name }))
        });
        
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            {renderHeader()}
            {renderStepIndicator()}
            
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Selecione os Produtos
                  </h2>
                  <p className="text-lg text-gray-600">
                    Escolha os produtos que deseja personalizar e defina as quantidades
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Debug: {products.length} produtos carregados, loading: {productsLoading ? 'sim' : 'não'}
                  </p>
                </div>

                {productsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando produtos...</p>
                  </div>
                ) : (
                  <>
                    <MultipleProductSelector
                      products={products}
                      onSelectionChange={handleProductSelectionChange}
                      className="mb-8"
                    />

                    {selectedProducts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-4 mb-4">
                              <Package className="h-6 w-6 text-blue-600" />
                              <div className="text-center">
                                <h3 className="font-semibold text-gray-900">
                                  Produtos selecionados
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {selectedProducts.length} produto(s) • {getTotalUnits()} unidades
                                </p>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={handleContinueToCustomization}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                              size="lg"
                            >
                              Continuar para Personalização
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 'customization':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            {renderHeader()}
            {renderStepIndicator()}
            
            <div className="container mx-auto px-4 py-8">
              <UltraPremiumPersonalizationForm
                onSubmit={handlePersonalizationSubmit}
                onBack={handleBackToProducts}
                className="max-w-6xl mx-auto"
              />
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            {renderHeader()}
            {renderStepIndicator()}
            
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Confirmar Solicitação
                  </h2>
                  <p className="text-lg text-gray-600">
                    Revise todos os dados antes de enviar
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Dados do cliente */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Dados de Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nome</p>
                          <p className="font-medium">{contactData?.nome}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">E-mail</p>
                          <p className="font-medium">{contactData?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telefone</p>
                          <p className="font-medium">{contactData?.fone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Documento</p>
                          <p className="font-medium">{contactData?.cpf_cnpj}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Produtos selecionados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Produtos Selecionados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedProducts.map((selectedProduct) => {
                          const productInfo = getProductInfo(selectedProduct.product_id);
                          return (
                            <div key={selectedProduct.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                                  <img 
                                    src={productInfo?.imageUrl || '/placeholder-product.png'}
                                    alt={productInfo?.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium">{productInfo?.name}</h4>
                                  <p className="text-sm text-gray-600">{productInfo?.description}</p>
                                </div>
                              </div>
                              <Badge variant="default" className="bg-blue-600">
                                {selectedProduct.quantity} unidades
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total Geral:</span>
                        <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
                          {getTotalUnits()} unidades
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados de Personalização */}
                  {(customizationData.telefone || customizationData.redes.instagram || customizationData.logo) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Dados de Personalização
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customizationData.telefone && (
                            <div>
                              <p className="text-sm text-gray-600">Telefone</p>
                              <p className="font-medium">{customizationData.telefone}</p>
                            </div>
                          )}
                          {customizationData.whatsapp && (
                            <div>
                              <p className="text-sm text-gray-600">WhatsApp</p>
                              <p className="font-medium">{customizationData.whatsapp}</p>
                            </div>
                          )}
                          {customizationData.cidade && (
                            <div>
                              <p className="text-sm text-gray-600">Localização</p>
                              <p className="font-medium">{customizationData.cidade}, {customizationData.estado}</p>
                            </div>
                          )}
                          {customizationData.cor_impressao && (
                            <div>
                              <p className="text-sm text-gray-600">Cor de Impressão</p>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded border"
                                  style={{ 
                                    backgroundColor: customizationData.cor_impressao === 'custom' 
                                      ? customizationData.cor_custom 
                                      : customizationData.cor_impressao === 'branco' ? '#ffffff' : '#000000'
                                  }}
                                ></div>
                                <span className="font-medium capitalize">
                                  {customizationData.cor_impressao === 'custom' 
                                    ? customizationData.cor_custom 
                                    : customizationData.cor_impressao
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Redes Sociais */}
                        {(customizationData.redes.instagram || customizationData.redes.facebook || customizationData.redes.tiktok || customizationData.redes.outro) && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Redes Sociais</p>
                            <div className="flex flex-wrap gap-2">
                              {customizationData.redes.instagram && (
                                <Badge variant="outline" className="text-pink-600">
                                  📷 Instagram
                                </Badge>
                              )}
                              {customizationData.redes.facebook && (
                                <Badge variant="outline" className="text-blue-600">
                                  📘 Facebook
                                </Badge>
                              )}
                              {customizationData.redes.tiktok && (
                                <Badge variant="outline" className="text-black">
                                  🎵 TikTok
                                </Badge>
                              )}
                              {customizationData.redes.outro && (
                                <Badge variant="outline" className="text-gray-600">
                                  🔗 Outra rede
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Logo */}
                        {customizationData.logo && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Logo da Empresa</p>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              {customizationData.logoPreview && (
                                <img 
                                  src={customizationData.logoPreview}
                                  alt="Logo preview"
                                  className="w-12 h-12 object-contain"
                                />
                              )}
                              <div>
                                <p className="font-medium">{customizationData.logo.name}</p>
                                <p className="text-sm text-gray-600">
                                  {(customizationData.logo.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Próximos Passos */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex gap-3 mb-6">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-lg font-semibold text-blue-800 mb-4">
                            📋 Próximos Passos
                          </p>
                          
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-white font-bold text-xs">1</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">
                                  Criação da Arte (até 3 dias úteis)
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Após a conclusão desta solicitação, criaremos sua arte personalizada em até 3 dias úteis e a enviaremos para sua revisão e aprovação.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-white font-bold text-xs">2</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">
                                  Produção e Envio (até 10 dias úteis)
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Após a aprovação, ela seguirá para a etapa de produção e será despachada em até 10 dias úteis — embora, na maioria das vezes, o envio ocorra antes desse prazo.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">
                              <strong>💡 Dica:</strong> Nosso processo é ágil e eficiente. Na maioria dos casos, conseguimos entregar antes dos prazos estimados!
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handleBackToCustomization}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmitQuote}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        Enviar Solicitação
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 relative overflow-hidden">
            {/* Confetes animados */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  initial={{ 
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), 
                    y: -20,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
                    rotate: 360,
                    scale: [0, 1, 0.8, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-12"
                >
                  <div className="relative inline-block mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🚀
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-4"
                  >
                    Uhuul! Seu pedido está a caminho da criação!
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xl text-gray-700 max-w-2xl mx-auto"
                  >
                    Muito obrigado por personalizar conosco, <strong>{contactData?.nome}</strong>! 
                    Agora nossa equipe vai dar vida à sua arte!
                  </motion.p>
                </motion.div>

                {/* Timeline Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mb-12"
                >
                  <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0">
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          ⚡
                        </motion.div>
                        Cronograma do Seu Pedido
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="px-8 pb-8">
                      <div className="relative">
                        {/* Linha de progresso */}
                        <div className="absolute left-8 top-16 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full"></div>
                        
                        <div className="space-y-12">
                          {/* Etapa 1 - Validação de Arte */}
                          <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                            className="relative flex items-start gap-6"
                          >
                            <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-2xl"
                              >
                                🎨
                              </motion.div>
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-800">Validação de Arte</h3>
                                <Badge className="bg-blue-500 text-white">📅 1-3 dias úteis</Badge>
                              </div>
                              <p className="text-gray-600 mb-3">
                                Entraremos em contato via WhatsApp para revisar a arte e ajustar caso necessário.
                              </p>
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Em andamento...</span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Etapa 2 - Início da Produção */}
                          <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.3 }}
                            className="relative flex items-start gap-6"
                          >
                            <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="text-2xl"
                              >
                                ⚙️
                              </motion.div>
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-800">Início da Produção</h3>
                                <Badge variant="outline" className="border-purple-300 text-purple-600">Após sua aprovação</Badge>
                              </div>
                              <p className="text-gray-600">
                                Sua arte seguirá para produção assim que você der o 'ok'.
                              </p>
                            </div>
                          </motion.div>

                          {/* Etapa 3 - Envio do Pedido */}
                          <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5 }}
                            className="relative flex items-start gap-6"
                          >
                            <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-2xl"
                              >
                                📦
                              </motion.div>
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-800">Envio do Pedido</h3>
                                <Badge className="bg-green-500 text-white">📅 Até 10 dias úteis</Badge>
                              </div>
                              <p className="text-gray-600">
                                Nossa equipe trabalhará para entregar no prazo combinado.
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Resumo do Pedido */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7 }}
                  className="mb-8"
                >
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Resumo do Seu Pedido
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-600">Cliente</p>
                          <p className="font-semibold text-gray-800">{contactData?.nome}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-600">Contato</p>
                          <p className="font-semibold text-gray-800">{contactData?.fone}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-600">Total de Produtos</p>
                          <p className="font-semibold text-gray-800">{getTotalUnits()} unidades</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Call-to-Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.9 }}
                  className="text-center space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Dúvidas? Estamos aqui para ajudar!
                    </h3>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                      <Button
                        onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        WhatsApp
                      </Button>
                      
                      <Button
                        onClick={() => window.open('mailto:contato@addsbrasil.com.br', '_blank')}
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                      >
                        📧 E-mail
                      </Button>
                      
                      <Button
                        onClick={() => window.open('https://addsbrasil.com.br', '_blank')}
                        variant="outline"
                        className="border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                      >
                        🌐 Ver Status do Pedido
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ← Fazer Nova Solicitação
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderMainContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 