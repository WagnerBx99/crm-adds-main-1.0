import React from 'react';
import { ProductType, Product } from '@/types/personalization';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// URLs definitivas para os produtos ADDS (garantia que sempre terão uma imagem)
const ADDS_IMPLANT_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/adds-implant-1.png';
const ADDS_ULTRA_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/adds-ultra-2.png';
const RASPADOR_LINGUA_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/raspador-lingua-1.png';

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: ProductType | null;
  onChange: (productId: ProductType) => void;
}

export function ProductSelector({ products, selectedProduct, onChange }: ProductSelectorProps) {
  if (!products || products.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4">Escolha o Produto</h2>
          <div className="border rounded-lg p-6 text-center bg-gray-50 border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum produto disponível para personalização.</p>
            <p className="text-sm text-gray-400 mt-2">Adicione produtos nas Configurações e ative a opção "Visível na Personalização".</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Escolha o Produto</h2>
          <Badge variant="outline" className="text-xs font-normal">
            {products.length} {products.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="cursor-pointer"
              onClick={() => {
                onChange(product.id);
                
                setTimeout(() => {
                  const canvasEl = document.querySelector('.canvas-container');
                  if (canvasEl) {
                    canvasEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    canvasEl.classList.add('canvas-highlight');
                    setTimeout(() => {
                      canvasEl.classList.remove('canvas-highlight');
                    }, 1000);
                  }
                }, 300);
              }}
            >
              <Card 
                className={`transition-all overflow-hidden h-full ${
                  product.id === selectedProduct 
                    ? 'ring-2 ring-brand-blue border-brand-blue' 
                    : 'hover:border-gray-300'
                }`}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  <img 
                    src={
                      product.id === 'adds_implant' 
                        ? ADDS_IMPLANT_URL 
                        : product.id === 'adds_ultra' 
                          ? ADDS_ULTRA_URL 
                          : product.id === 'raspador_lingua' 
                            ? RASPADOR_LINGUA_URL 
                            : product.imageUrl
                    }
                    alt={product.name} 
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem para ${product.name}`);
                      
                      // Usar URL de fallback específica para cada produto
                      let fallbackUrl = '';
                      
                      if (product.id === 'adds_implant') {
                        fallbackUrl = ADDS_IMPLANT_URL;
                      } else if (product.id === 'adds_ultra') {
                        fallbackUrl = ADDS_ULTRA_URL;
                      } else if (product.id === 'raspador_lingua') {
                        fallbackUrl = RASPADOR_LINGUA_URL;
                      } else {
                        // Usar SVG embutido para garantir que sempre tenha uma imagem
                        fallbackUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNMTU4IDEyOEgyNDJDMjUxLjk0MSAxMjggMjYwIDEzNi4wNTkgMjYwIDE0NlYyNTRDMjYwIDI2My45NDEgMjUxLjk0MSAyNzIgMjQyIDI3MkgxNThDMTQ4LjA1OSAyNzIgMTQwIDI2My45NDEgMTQwIDI1NFYxNDZDMTQwIDEzNi4wNTkgMTQ4LjA1OSAxMjggMTU4IDEyOFoiIGZpbGw9IiNEOEQ4RDgiLz48cGF0aCBkPSJNMTgzIDE1MEMyMDIuMzMgMTUwIDIxOCAxNjUuNjcgMjE4IDE4NUMyMTggMjA0LjMzIDIwMi4zMyAyMjAgMTgzIDIyMEMxNjMuNjcgMjIwIDE0OCAyMDQuMzMgMTQ4IDE4NUMxNDggMTY1LjY3IDE2My42NyAxNTAgMTgzIDE1MFoiIGZpbGw9IiNDMkMyQzIiLz48cGF0aCBkPSJNMjM2IDIxMEwyNjAgMjM0VjI3Mkw0OCAyNzJMNjkgMjUxTDEwMCAyMjBMMTM2IDI1NkwxODQgMjA4TDIzNiAyMTBaIiBmaWxsPSIjQzJDMkMyIi8+PC9zdmc+';
                      }
                      
                      const target = e.target as HTMLImageElement;
                      target.src = fallbackUrl;
                      target.onerror = null; // Evitar loop infinito se a fallback também falhar
                    }}
                  />
                  {product.id === selectedProduct && (
                    <div className="absolute inset-0 bg-brand-blue/10 flex items-center justify-center">
                      <div className="bg-brand-blue rounded-full p-1">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dimensões: {product.canvasWidth}x{product.canvasHeight}px</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
