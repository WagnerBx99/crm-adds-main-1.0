import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Zap, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { PublicContact } from '@/types/contact';

interface PublicPersonalizationEditorProps {
  isPublic?: boolean;
  contactData?: PublicContact | null;
  onBack?: () => void;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  company: string;
}

interface ProductOption {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  customizationOptions: {
    id: string;
    name: string;
    type: 'number' | 'color' | 'text' | 'select';
    required: boolean;
    min?: number;
    max?: number;
    options?: string[];
  }[];
}

interface QuoteData {
  id: string;
  customer: CustomerInfo;
  product: ProductOption;
  customization: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'contacted' | 'completed';
}

export default function PublicPersonalizationEditor({ isPublic = false }: PublicPersonalizationEditorProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    company: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [customization, setCustomization] = useState<Record<string, any>>({});
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Produtos padrão sempre disponíveis para personalização pública
  const defaultPublicProducts: ProductOption[] = [
    {
      id: 'ADDS_IMPLANT',
      name: 'ADDS Implant',
      description: 'Produto premium para implantes dentários com personalização completa',
      imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png',
      price: 'Sob consulta',
      customizationOptions: [
        { 
          id: 'quantity', 
          name: 'Quantidade', 
          type: 'number', 
          required: true, 
          min: 1, 
          max: 10000 
        },
        { 
          id: 'color', 
          name: 'Cor Principal', 
          type: 'color', 
          required: true 
        },
        { 
          id: 'logo', 
          name: 'Logo/Marca da Clínica', 
          type: 'text', 
          required: false 
        }
      ]
    },
    {
      id: 'ADDS_ULTRA',
      name: 'ADDS Ultra',
      description: 'Nossa solução avançada para higiene oral com tecnologia inovadora',
      imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png',
      price: 'Sob consulta',
      customizationOptions: [
        { 
          id: 'quantity', 
          name: 'Quantidade', 
          type: 'number', 
          required: true, 
          min: 1, 
          max: 5000 
        },
        { 
          id: 'color', 
          name: 'Cor do Produto', 
          type: 'color', 
          required: true 
        }
      ]
    }
  ];

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(customerInfo.name && customerInfo.phone && customerInfo.email);
      case 2:
        return !!selectedProduct;
      case 3:
        if (!selectedProduct) return false;
        const requiredOptions = selectedProduct.customizationOptions.filter(opt => opt.required);
        return requiredOptions.every(opt => customization[opt.id] && customization[opt.id] !== '');
      default:
        return true;
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    
    try {
      const quoteData: QuoteData = {
        customer: customerInfo,
        product: selectedProduct,
        customization,
        timestamp: new Date(),
        id: `quote-${Date.now()}`,
        status: 'pending'
      };
      
      // Salvar dados no localStorage para backup
      const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
      existingQuotes.push(quoteData);
      localStorage.setItem('publicQuotes', JSON.stringify(existingQuotes));
      
      console.log('✅ Orçamento salvo:', quoteData);
      
      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Feedback de sucesso
      toast.success('Solicitação de orçamento enviada com sucesso! Nossa equipe entrará em contato em breve.');
      
      // Reiniciar processo
      setStep(1);
      setSelectedProduct(null);
      setCustomization({});
      setCustomerInfo({ name: '', phone: '', email: '', company: '' });
      
    } catch (error) {
      console.error('❌ Erro ao enviar solicitação:', error);
      toast.error('Erro ao processar solicitação. Tente novamente ou entre em contato conosco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Suas Informações";
      case 2: return "Escolha do Produto";
      case 3: return "Personalização";
      case 4: return "Confirmar Solicitação";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return "Para entrarmos em contato";
      case 2: return "Selecione o produto desejado";
      case 3: return "Configure as opções";
      case 4: return "Revise e envie sua solicitação";
      default: return "";
    }
  };

  if (isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header Público */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ADDS Brasil</h1>
                  <p className="text-sm text-gray-600">Personalize seus produtos dentários</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Orçamento Online
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Indicador de Progresso */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-8 md:w-16 h-1 mx-2 md:mx-4 transition-all ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {getStepTitle()}
                </p>
                <p className="text-sm text-gray-600">
                  {getStepDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo dos Steps */}
          <div className="max-w-4xl mx-auto">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Empresa/Clínica</Label>
                      <Input
                        id="company"
                        value={customerInfo.company}
                        onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
                        placeholder="Nome da empresa (opcional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setCustomerInfo({...customerInfo, phone: formatted});
                        }}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={() => setStep(2)}
                      disabled={!validateStep(1)}
                      className="px-8"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Escolha o Produto para Personalizar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {defaultPublicProducts.map((product) => (
                        <Card 
                          key={product.id} 
                          className={`cursor-pointer transition-all hover:shadow-lg ${
                            selectedProduct?.id === product.id 
                              ? 'ring-2 ring-blue-600 bg-blue-50 shadow-md' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-contain hover:scale-105 transition-transform"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGMEYwRjAiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5Qcm9kdXRvPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="text-blue-700 border-blue-300">
                                {product.price}
                              </Badge>
                              {selectedProduct?.id === product.id && (
                                <Badge className="bg-blue-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!validateStep(2)}
                    className="px-8"
                  >
                    Personalizar Produto
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && selectedProduct && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalize seu {selectedProduct.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Preview */}
                      <div>
                        <h3 className="font-medium mb-4">Preview do Produto</h3>
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                          <img 
                            src={selectedProduct.imageUrl} 
                            alt={selectedProduct.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Resumo da Personalização</h4>
                          <div className="space-y-1 text-sm text-blue-700">
                            {Object.entries(customization).map(([key, value]) => {
                              const option = selectedProduct.customizationOptions.find(opt => opt.id === key);
                              if (!value || !option) return null;
                              return (
                                <div key={key} className="flex justify-between">
                                  <span>{option.name}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Opções */}
                      <div>
                        <h3 className="font-medium mb-4">Opções de Personalização</h3>
                        <div className="space-y-6">
                          {selectedProduct.customizationOptions.map((option) => (
                            <div key={option.id} className="space-y-2">
                              <Label className="flex items-center gap-2">
                                {option.name} 
                                {option.required && <span className="text-red-500">*</span>}
                              </Label>
                              
                              {option.type === 'number' && (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    min={option.min}
                                    max={option.max}
                                    value={customization[option.id] || ''}
                                    onChange={(e) => setCustomization({
                                      ...customization,
                                      [option.id]: e.target.value
                                    })}
                                    placeholder={`Mínimo: ${option.min}, Máximo: ${option.max}`}
                                  />
                                  <p className="text-xs text-gray-500">
                                    Quantidade mínima: {option.min} unidades
                                  </p>
                                </div>
                              )}
                              
                              {option.type === 'color' && (
                                <div className="flex gap-3">
                                  <Input
                                    type="color"
                                    value={customization[option.id] || '#0066cc'}
                                    onChange={(e) => setCustomization({
                                      ...customization,
                                      [option.id]: e.target.value
                                    })}
                                    className="w-16 h-12 rounded-md border cursor-pointer"
                                  />
                                  <Input
                                    value={customization[option.id] || '#0066cc'}
                                    onChange={(e) => setCustomization({
                                      ...customization,
                                      [option.id]: e.target.value
                                    })}
                                    placeholder="Código da cor (ex: #0066cc)"
                                    className="flex-1"
                                  />
                                </div>
                              )}
                              
                              {option.type === 'text' && (
                                <Textarea
                                  value={customization[option.id] || ''}
                                  onChange={(e) => setCustomization({
                                    ...customization,
                                    [option.id]: e.target.value
                                  })}
                                  placeholder={`Digite ${option.name.toLowerCase()}`}
                                  rows={3}
                                />
                              )}
                              
                              {option.type === 'select' && option.options && (
                                <Select
                                  value={customization[option.id] || ''}
                                  onValueChange={(value) => setCustomization({
                                    ...customization,
                                    [option.id]: value
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Selecione ${option.name.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {option.options.map((optValue) => (
                                      <SelectItem key={optValue} value={optValue}>
                                        {optValue}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(4)} 
                    disabled={!validateStep(3)}
                    className="px-8"
                  >
                    Revisar Solicitação
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Confirmar Solicitação de Orçamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resumo Cliente */}
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Dados de Contato
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><strong>Nome:</strong> {customerInfo.name}</p>
                        {customerInfo.company && <p><strong>Empresa:</strong> {customerInfo.company}</p>}
                        <p><strong>Telefone:</strong> {customerInfo.phone}</p>
                        <p><strong>E-mail:</strong> {customerInfo.email}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Resumo Produto */}
                    <div>
                      <h3 className="font-medium mb-3">Produto Selecionado</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex gap-4">
                          <img 
                            src={selectedProduct?.imageUrl}
                            alt={selectedProduct?.name}
                            className="w-20 h-20 object-contain rounded border bg-white"
                          />
                          <div>
                            <h4 className="font-semibold text-lg">{selectedProduct?.name}</h4>
                            <p className="text-sm text-gray-600">{selectedProduct?.description}</p>
                            <Badge variant="outline" className="mt-2">{selectedProduct?.price}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Resumo Personalização */}
                    <div>
                      <h3 className="font-medium mb-3">Personalização Solicitada</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        {Object.entries(customization).map(([key, value]) => {
                          const option = selectedProduct?.customizationOptions.find(opt => opt.id === key);
                          if (!value || !option) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <strong>{option?.name}:</strong> 
                              <span className="text-right">
                                {option?.type === 'color' ? (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded border" 
                                      style={{backgroundColor: value}}
                                    />
                                    <span>{value}</span>
                                  </div>
                                ) : value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">
                            📞 Próximos passos:
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Após enviar esta solicitação, nossa equipe entrará em contato 
                            em até 24 horas para finalizar o orçamento e discutir os detalhes técnicos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmitQuote} 
                    className="px-8 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        Enviar Solicitação de Orçamento
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Retornar o editor normal para usuários logados
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Editor de Personalização</h2>
        <p className="text-gray-600 mb-6">
          Esta é a versão interna do editor de personalização para usuários logados.
          A versão pública está disponível em uma rota separada.
        </p>
        <Button onClick={() => window.open('/orcamento', '_blank')}>
          Ver Versão Pública
        </Button>
      </div>
    </div>
  );
} 