import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, ArrowRight, CheckCircle, Info } from 'lucide-react';
import MultipleProductSelector from '@/components/personalization/MultipleProductSelector';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface SelectedProduct {
  product_id: string;
  quantity: number;
}

export default function MultipleProductSelection() {
  const { products, loading, error } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelectionChange = (newSelection: SelectedProduct[]) => {
    setSelectedProducts(newSelection);
    setShowResults(false);
  };

  const handleConfirmSelection = () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para continuar');
      return;
    }

    setShowResults(true);
    toast.success(`${selectedProducts.length} produto(s) selecionado(s) com sucesso!`);
    
    // Log para demonstração
    console.log('Produtos selecionados:', selectedProducts);
  };

  const handleNewSelection = () => {
    setSelectedProducts([]);
    setShowResults(false);
  };

  const getTotalUnits = () => {
    return selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Seleção Múltipla de Produtos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecione vários produtos simultaneamente e defina as quantidades em múltiplos de 3.
            Uma experiência otimizada para pedidos em lote.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Componente de seleção */}
            <MultipleProductSelector
              products={products}
              onSelectionChange={handleSelectionChange}
              className="mb-6"
            />

            {/* Botão de confirmação */}
            {selectedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900">
                          Pronto para continuar?
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedProducts.length} produto(s) • {getTotalUnits()} unidades
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleConfirmSelection}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                      size="lg"
                    >
                      Confirmar Seleção
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        ) : (
          /* Resultados */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Confirmação de sucesso */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-6 w-6" />
                  Seleção Confirmada com Sucesso!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">
                  Sua seleção foi processada e está pronta para a próxima etapa do processo.
                </p>
              </CardContent>
            </Card>

            {/* Resumo da seleção */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Resumo da Seleção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedProducts.map((item, index) => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{getProductName(item.product_id)}</h4>
                          <p className="text-sm text-gray-600">ID: {item.product_id}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-blue-600">
                        {item.quantity} unidades
                      </Badge>
                    </div>
                  ))}
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

            {/* Payload JSON */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Dados Gerados (JSON)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{JSON.stringify(selectedProducts, null, 2)}</pre>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Este é o payload que seria enviado para o backend para processamento.
                </p>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={handleNewSelection}
                className="px-6"
              >
                Nova Seleção
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 px-6"
                onClick={() => {
                  toast.success('Redirecionando para personalização...');
                  // Aqui seria o redirecionamento para a próxima etapa
                }}
              >
                Continuar para Personalização
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Informações adicionais */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              🎯 Funcionalidades Implementadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">✅ Seleção Múltipla</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Checkbox para cada produto</li>
                  <li>• Seleção independente</li>
                  <li>• Feedback visual imediato</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">✅ Controle de Quantidade</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Stepper com botões +/-</li>
                  <li>• Input numérico direto</li>
                  <li>• Múltiplos de 3 obrigatórios</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">✅ Validações</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Quantidade mínima: 3</li>
                  <li>• Apenas múltiplos de 3</li>
                  <li>• Feedback de erro em tempo real</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">✅ Acessibilidade</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Atalhos de teclado (+/-)</li>
                  <li>• Labels e ARIA attributes</li>
                  <li>• Foco automático</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 