import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Instagram, 
  Facebook, 
  Music, 
  Link, 
  Palette,
  Eye,
  Sparkles
} from 'lucide-react';

interface PersonalizationData {
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

interface PersonalizationOptions {
  incluirTelefone: boolean;
  incluirWhatsapp: boolean;
  incluirLocalizacao: boolean;
  incluirInstagram: boolean;
  incluirFacebook: boolean;
  incluirTiktok: boolean;
  incluirOutraRede: boolean;
  incluirLogo: boolean;
  incluirCorPersonalizada: boolean;
}

interface ProductPreviewProps {
  formData: PersonalizationData;
  options: PersonalizationOptions;
  productName?: string;
  productImage?: string;
}

export default function ProductPreview({ 
  formData, 
  options, 
  productName = "ADDS Implant",
  productImage = "https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png"
}: ProductPreviewProps) {
  
  // Calcular cor de impressão
  const getImprintColor = () => {
    if (!options.incluirCorPersonalizada) return '#000000';
    
    switch (formData.cor_impressao) {
      case 'branco': return '#ffffff';
      case 'preto': return '#000000';
      case 'custom': return formData.cor_custom;
      default: return '#000000';
    }
  };

  // Verificar se a cor é clara (para ajustar o fundo)
  const isLightColor = (color: string) => {
    if (color === '#ffffff' || color === 'branco') return true;
    
    // Converter hex para RGB e calcular luminância
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Fórmula de luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7; // Cores com luminância > 70% são consideradas claras
  };

  // Obter itens selecionados
  const getSelectedItems = () => {
    const items = [];
    
    if (options.incluirTelefone && formData.telefone) {
      items.push({ 
        type: 'telefone', 
        value: formData.telefone, 
        icon: Phone,
        color: 'text-blue-600'
      });
    }
    if (options.incluirWhatsapp && formData.whatsapp) {
      items.push({ 
        type: 'whatsapp', 
        value: formData.whatsapp, 
        icon: MessageCircle,
        color: 'text-green-600'
      });
    }
    if (options.incluirLocalizacao && formData.cidade && formData.estado) {
      items.push({ 
        type: 'localizacao', 
        value: `${formData.cidade}, ${formData.estado}`, 
        icon: MapPin,
        color: 'text-red-600'
      });
    }
    if (options.incluirInstagram && formData.redes.instagram) {
      items.push({ 
        type: 'instagram', 
        value: formData.redes.instagram.replace('https://instagram.com/', '@'), 
        icon: Instagram,
        color: 'text-pink-600'
      });
    }
    if (options.incluirFacebook && formData.redes.facebook) {
      items.push({ 
        type: 'facebook', 
        value: formData.redes.facebook.replace('https://facebook.com/', ''), 
        icon: Facebook,
        color: 'text-blue-700'
      });
    }
    if (options.incluirTiktok && formData.redes.tiktok) {
      items.push({ 
        type: 'tiktok', 
        value: formData.redes.tiktok.replace('https://tiktok.com/', ''), 
        icon: Music,
        color: 'text-black'
      });
    }
    if (options.incluirOutraRede && formData.redes.outro) {
      items.push({ 
        type: 'outro', 
        value: formData.redes.outro, 
        icon: Link,
        color: 'text-gray-600'
      });
    }
    
    return items;
  };

  const selectedItems = getSelectedItems();
  const imprintColor = getImprintColor();
  const isColorLight = isLightColor(imprintColor);

  return (
    <Card className="sticky top-4 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-600" />
          Prévisualização do Produto
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {selectedItems.length > 0 ? (
          <div className="space-y-6">
            {/* Contador de itens */}
            <div className="text-center">
              <Badge variant="default" className="bg-green-600 text-white px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                {selectedItems.length} item(s) selecionado(s)
              </Badge>
            </div>

            {/* Simulação do produto */}
            <div className="relative bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
              <div className="text-center mb-4">
                <img 
                  src={productImage}
                  alt={productName}
                  className="w-32 h-20 object-contain mx-auto mb-2"
                />
                <p className="text-sm font-medium text-gray-700">{productName}</p>
              </div>

              {/* Área de personalização simulada */}
              <div 
                className="rounded border-2 border-blue-200 p-4 min-h-[120px] relative"
                style={{ 
                  backgroundColor: isColorLight ? '#2d3748' : '#ffffff',
                  color: isColorLight ? '#ffffff' : imprintColor
                }}
              >
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    Área de Impressão
                  </Badge>
                </div>

                {/* Logo */}
                {options.incluirLogo && formData.logoPreview && (
                  <div className="flex justify-center mb-3">
                    <img 
                      src={formData.logoPreview}
                      alt="Logo"
                      className="max-w-16 max-h-12 object-contain"
                      style={{ 
                        filter: isColorLight ? 'brightness(0) invert(1)' : 'none'
                      }}
                    />
                  </div>
                )}

                {/* Informações de contato */}
                <div className="space-y-1 text-xs">
                  {selectedItems.slice(0, 4).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2"
                        style={{ color: isColorLight ? '#ffffff' : imprintColor }}
                      >
                        <Icon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {item.value.length > 20 ? `${item.value.substring(0, 20)}...` : item.value}
                        </span>
                      </motion.div>
                    );
                  })}
                  
                  {selectedItems.length > 4 && (
                    <div className="text-center pt-1">
                      <span className="text-xs opacity-70">
                        +{selectedItems.length - 4} mais...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da cor */}
              {options.incluirCorPersonalizada && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Cor de impressão:</span>
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: imprintColor }}
                  ></div>
                  <span className="text-sm font-medium">
                    {formData.cor_impressao === 'custom' 
                      ? formData.cor_custom 
                      : formData.cor_impressao === 'branco' ? 'Branco' : 'Preto'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Lista detalhada dos itens */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Informações incluídas:</h4>
              {selectedItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {item.type === 'localizacao' ? 'Localização' : 
                         item.type === 'outro' ? 'Outra rede' : item.type}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Observação sobre disposição */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    📐 Disposição dos Elementos:
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    A disposição final dos elementos será feita pela nossa equipe de design 
                    de forma que melhor se adapte ao produto a ser personalizado, garantindo 
                    o melhor resultado visual e funcional.
                  </p>
                </div>
              </div>
            </div>

            {/* Dicas de qualidade */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    💡 Dicas para melhor resultado:
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Cores sólidas têm melhor nitidez</li>
                    <li>• Logos em alta resolução (300 dpi)</li>
                    <li>• Evite textos muito pequenos</li>
                    <li>• Apenas PNG ou PDF (não aceitamos fotos)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium text-gray-700 mb-2">
              Nenhuma personalização selecionada
            </h3>
            <p className="text-sm">
              Marque as opções que deseja incluir no seu produto para ver a prévisualização
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 