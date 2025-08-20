import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Package, AlertCircle, Check } from 'lucide-react';
import { Product } from '@/types/personalization';
import { toast } from 'sonner';

interface SelectedProduct {
  product_id: string;
  quantity: number;
}

interface MultipleProductSelectorProps {
  products: Product[];
  onSelectionChange: (selectedProducts: SelectedProduct[]) => void;
  className?: string;
}

interface ProductSelection {
  product: Product;
  selected: boolean;
  quantity: number;
  error?: string;
}

export default function MultipleProductSelector({ 
  products, 
  onSelectionChange, 
  className = '' 
}: MultipleProductSelectorProps) {
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);

  // Inicializar seleções quando produtos mudarem
  useEffect(() => {
    const initialSelections = products.map(product => ({
      product,
      selected: false,
      quantity: 3, // Quantidade mínima
      error: undefined
    }));
    setProductSelections(initialSelections);
  }, [products]);

  // Validar se a quantidade é múltiplo de 3
  const validateQuantity = (quantity: number): string | undefined => {
    if (quantity < 3) {
      return 'Quantidade mínima é 3 unidades';
    }
    if (quantity % 3 !== 0) {
      return 'Quantidade deve ser um múltiplo de 3';
    }
    return undefined;
  };

  // Atualizar seleção de produto
  const handleProductToggle = (productId: string, checked: boolean) => {
    setProductSelections(prev => {
      const updated = prev.map(selection => {
        if (selection.product.id === productId) {
          const newSelection = { ...selection, selected: checked };
          
          // Se selecionado, focar no campo de quantidade
          if (checked) {
            setTimeout(() => {
              setFocusedProductId(productId);
              const quantityInput = document.getElementById(`quantity-${productId}`);
              if (quantityInput) {
                quantityInput.focus();
              }
            }, 100);
          }
          
          return newSelection;
        }
        return selection;
      });
      
      // Notificar mudança
      notifySelectionChange(updated);
      return updated;
    });
  };

  // Atualizar quantidade
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setProductSelections(prev => {
      const updated = prev.map(selection => {
        if (selection.product.id === productId) {
          const error = validateQuantity(newQuantity);
          return {
            ...selection,
            quantity: newQuantity,
            error
          };
        }
        return selection;
      });
      
      // Notificar mudança apenas se não houver erros
      const hasErrors = updated.some(s => s.selected && s.error);
      if (!hasErrors) {
        notifySelectionChange(updated);
      }
      
      return updated;
    });
  };

  // Incrementar quantidade
  const handleIncrement = (productId: string) => {
    const selection = productSelections.find(s => s.product.id === productId);
    if (selection) {
      handleQuantityChange(productId, selection.quantity + 3);
    }
  };

  // Decrementar quantidade
  const handleDecrement = (productId: string) => {
    const selection = productSelections.find(s => s.product.id === productId);
    if (selection && selection.quantity > 3) {
      handleQuantityChange(productId, selection.quantity - 3);
    }
  };

  // Notificar mudanças para o componente pai
  const notifySelectionChange = (selections: ProductSelection[]) => {
    const selectedProducts: SelectedProduct[] = selections
      .filter(s => s.selected && !s.error)
      .map(s => ({
        product_id: s.product.id,
        quantity: s.quantity
      }));
    
    onSelectionChange(selectedProducts);
  };

  // Calcular totais
  const selectedCount = productSelections.filter(s => s.selected).length;
  const totalUnits = productSelections
    .filter(s => s.selected && !s.error)
    .reduce((sum, s) => sum + s.quantity, 0);

  // Manipular teclas de atalho
  const handleKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleIncrement(productId);
    } else if (e.key === '-') {
      e.preventDefault();
      handleDecrement(productId);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const selection = productSelections.find(s => s.product.id === productId);
      if (selection) {
        handleProductToggle(productId, !selection.selected);
      }
    }
  };

  if (!products || products.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto disponível
            </h3>
            <p className="text-gray-500">
              Configure produtos nas Configurações para começar a personalização.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seleção de Produtos
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Badge variant="default" className="bg-green-600">
                {selectedCount} {selectedCount === 1 ? 'produto' : 'produtos'}
              </Badge>
            )}
            {totalUnits > 0 && (
              <Badge variant="outline">
                {totalUnits} unidades
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Selecione os produtos e defina as quantidades (múltiplos de 3)
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {productSelections.map((selection) => (
          <motion.div
            key={selection.product.id}
            layout
            className={`border rounded-lg p-6 transition-all ${
              selection.selected 
                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0 pt-2 sm:pt-0">
                <Checkbox
                  id={`product-${selection.product.id}`}
                  checked={selection.selected}
                  onCheckedChange={(checked) => 
                    handleProductToggle(selection.product.id, checked as boolean)
                  }
                  className="h-6 w-6"
                  aria-label={`Selecionar ${selection.product.name}`}
                />
              </div>

              <div className="flex-shrink-0">
                <div className="w-32 h-32 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={selection.product.imageUrl || '/placeholder-product.png'}
                    alt={selection.product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.png';
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selection.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {selection.product.description}
                  </p>
                </div>

                <AnimatePresence>
                  {selection.selected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                    >
                      <div className="flex items-center gap-3">
                        <label 
                          htmlFor={`quantity-${selection.product.id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Quantidade:
                        </label>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecrement(selection.product.id)}
                            disabled={selection.quantity <= 3}
                            className="h-8 w-8 p-0"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Input
                                  id={`quantity-${selection.product.id}`}
                                  type="number"
                                  min="3"
                                  step="3"
                                  value={selection.quantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 3;
                                    handleQuantityChange(selection.product.id, value);
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, selection.product.id)}
                                  className={`w-20 text-center ${
                                    selection.error ? 'border-red-500' : ''
                                  }`}
                                  aria-label={`Quantidade de ${selection.product.name}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Use +/- para ajustar ou digite diretamente</p>
                                <p>Mínimo: 3 | Múltiplos de 3</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleIncrement(selection.product.id)}
                            className="h-8 w-8 p-0"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {selection.error ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">{selection.error}</span>
                          </div>
                        ) : selection.selected && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">Válido</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}

        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {selectedCount} {selectedCount === 1 ? 'produto selecionado' : 'produtos selecionados'}
                </span>
              </div>
              <Badge variant="default" className="bg-green-600">
                Total: {totalUnits} unidades
              </Badge>
            </div>
          </motion.div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            💡 Como usar:
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Marque os produtos que deseja personalizar</li>
            <li>• Use os botões +/- ou digite a quantidade diretamente</li>
            <li>• Quantidades devem ser múltiplos de 3 (mínimo: 3)</li>
            <li>• Atalhos: Espaço/Enter para selecionar, +/- para ajustar quantidade</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 