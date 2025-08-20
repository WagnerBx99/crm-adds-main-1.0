import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
  status: 'pending';
}

export default function SimplePublicForm() {
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

  // Produtos disponíveis
  const products: ProductOption[] = [
    {
      id: 'ADDS_IMPLANT',
      name: 'ADDS Implant',
      description: 'Produto premium para implantes dentários',
      price: 'Sob consulta',
      customizationOptions: [
        { id: 'quantity', name: 'Quantidade', type: 'number', required: true, min: 1, max: 10000 },
        { id: 'color', name: 'Cor Principal', type: 'color', required: true },
        { id: 'logo', name: 'Logo da Clínica', type: 'text', required: false },
      ]
    },
    {
      id: 'ADDS_ULTRA',
      name: 'ADDS Ultra',
      description: 'Solução avançada para higiene oral',
      price: 'Sob consulta',
      customizationOptions: [
        { id: 'quantity', name: 'Quantidade', type: 'number', required: true, min: 1, max: 5000 },
        { id: 'color', name: 'Cor do Produto', type: 'color', required: true },
        { id: 'packaging', name: 'Embalagem', type: 'select', required: true, options: ['Individual', 'Kit 5 unidades', 'Kit 10 unidades'] },
      ]
    }
  ];

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
        id: `quote-${Date.now()}`,
        customer: customerInfo,
        product: selectedProduct,
        customization,
        timestamp: new Date(),
        status: 'pending'
      };
      
      // Salvar no localStorage
      const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
      existingQuotes.push(quoteData);
      localStorage.setItem('publicQuotes', JSON.stringify(existingQuotes));
      
      console.log('✅ Orçamento salvo:', quoteData);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Solicitação de orçamento enviada! Nossa equipe entrará em contato.');
      
      // Resetar formulário
      setStep(1);
      setSelectedProduct(null);
      setCustomization({});
      setCustomerInfo({ name: '', phone: '', email: '', company: '' });
      
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ADDS Brasil</h1>
                <p className="text-sm text-gray-600">Personalize seus produtos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Indicador de Progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-4 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Informações do Cliente */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Suas Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label>Empresa/Clínica</Label>
                    <Input
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <Label>Telefone/WhatsApp *</Label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!validateStep(1)}
                  >
                    Continuar <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Escolha do Produto */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Escolha o Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <Card 
                      key={product.id} 
                      className={`cursor-pointer transition-all ${
                        selectedProduct?.id === product.id ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <p className="text-blue-700 font-medium">{product.price}</p>
                        {selectedProduct?.id === product.id && (
                          <div className="mt-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!validateStep(2)}
                  >
                    Personalizar <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Personalização */}
          {step === 3 && selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Personalize seu {selectedProduct.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedProduct.customizationOptions.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <Label>
                        {option.name} {option.required && <span className="text-red-500">*</span>}
                      </Label>
                      
                      {option.type === 'number' && (
                        <Input
                          type="number"
                          min={option.min}
                          max={option.max}
                          value={customization[option.id] || ''}
                          onChange={(e) => setCustomization({
                            ...customization,
                            [option.id]: e.target.value
                          })}
                          placeholder={`Mínimo: ${option.min}`}
                        />
                      )}
                      
                      {option.type === 'color' && (
                        <Input
                          type="color"
                          value={customization[option.id] || '#0066cc'}
                          onChange={(e) => setCustomization({
                            ...customization,
                            [option.id]: e.target.value
                          })}
                          className="w-20 h-12"
                        />
                      )}
                      
                      {option.type === 'text' && (
                        <Textarea
                          value={customization[option.id] || ''}
                          onChange={(e) => setCustomization({
                            ...customization,
                            [option.id]: e.target.value
                          })}
                          placeholder={`Digite ${option.name.toLowerCase()}`}
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
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!validateStep(3)}
                  >
                    Revisar <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmação */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Solicitação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Dados de Contato</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p><strong>Nome:</strong> {customerInfo.name}</p>
                    {customerInfo.company && <p><strong>Empresa:</strong> {customerInfo.company}</p>}
                    <p><strong>Telefone:</strong> {customerInfo.phone}</p>
                    <p><strong>E-mail:</strong> {customerInfo.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Produto</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>{selectedProduct?.name}</strong></p>
                    <p className="text-sm text-gray-600">{selectedProduct?.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Personalização</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {Object.entries(customization).map(([key, value]) => {
                      const option = selectedProduct?.customizationOptions.find(opt => opt.id === key);
                      if (!value || !option) return null;
                      return (
                        <div key={key} className="flex justify-between">
                          <strong>{option.name}:</strong>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmitQuote}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 