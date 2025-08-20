import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

// Tipo simplificado para os produtos
interface ProductType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  visibleInPersonalization?: boolean;
  imageUrl?: string;
  customizationOptions: any[];
}

// Constantes para URLs padrão
const DEFAULT_URLS = {
  ADDS_IMPLANT: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png',
  ADDS_ULTRA: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png',
  RASPADOR_LINGUA: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png'
};

export default function DebugProducts() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [testImageUrl, setTestImageUrl] = useState('');
  const [testImageStatus, setTestImageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [missingProducts, setMissingProducts] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    try {
      setLoading(true);
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        setProducts(parsedProducts);
        console.log('Produtos carregados do localStorage:', parsedProducts);
        
        // Verificar produtos que estão faltando
        const expectedIds = ['ADDS_IMPLANT', 'ADDS_ULTRA', 'RASPADOR_LINGUA'];
        const existingIds = parsedProducts.map((p: ProductType) => p.id);
        const missing = expectedIds.filter(id => !existingIds.includes(id));
        setMissingProducts(missing);
      } else {
        console.log('Nenhum produto encontrado no localStorage');
        setMissingProducts(['ADDS_IMPLANT', 'ADDS_ULTRA', 'RASPADOR_LINGUA']);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixProducts = () => {
    try {
      // Configurar os produtos novamente com as URLs corretas
      const updatedProducts = products.map(product => {
        let updatedProduct = { ...product };
        
        if (product.id === 'ADDS_IMPLANT') {
          updatedProduct.imageUrl = DEFAULT_URLS.ADDS_IMPLANT;
          console.log('Atualizando ADDS_IMPLANT para URL:', updatedProduct.imageUrl);
        } else if (product.id === 'ADDS_ULTRA') {
          updatedProduct.imageUrl = DEFAULT_URLS.ADDS_ULTRA;
          console.log('Atualizando ADDS_ULTRA para URL:', updatedProduct.imageUrl);
        } else if (product.id === 'RASPADOR_LINGUA') {
          updatedProduct.imageUrl = DEFAULT_URLS.RASPADOR_LINGUA;
          console.log('Atualizando RASPADOR_LINGUA para URL:', updatedProduct.imageUrl);
        }
        
        return updatedProduct;
      });
      
      // Salvar os produtos atualizados no localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produtos atualizados com sucesso!');
      console.log('Produtos atualizados:', updatedProducts);
    } catch (error) {
      console.error('Erro ao atualizar produtos:', error);
      toast.error('Ocorreu um erro ao atualizar os produtos');
    }
  };

  const handleResetProducts = () => {
    try {
      // Remover os produtos do localStorage
      localStorage.removeItem('products');
      setProducts([]);
      setMissingProducts(['ADDS_IMPLANT', 'ADDS_ULTRA', 'RASPADOR_LINGUA']);
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produtos resetados com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar produtos:', error);
      toast.error('Ocorreu um erro ao resetar os produtos');
    }
  };

  const handleResetToDefaults = () => {
    try {
      // Configurações padrão para os produtos
      const defaultProducts = [
        {
          id: 'ADDS_IMPLANT',
          name: 'ADDS Implant',
          description: 'Produto premium para implantes dentários',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.ADDS_IMPLANT,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'size', name: 'Tamanho', type: 'size', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false },
            { id: 'text', name: 'Texto', type: 'text', required: false }
          ]
        },
        {
          id: 'ADDS_ULTRA',
          name: 'ADDS Ultra',
          description: 'Nossa solução avançada para higiene oral',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.ADDS_ULTRA,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false }
          ]
        },
        {
          id: 'RASPADOR_LINGUA',
          name: 'Raspador de Língua',
          description: 'Higiene completa com nosso raspador de língua',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.RASPADOR_LINGUA,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false }
          ]
        }
      ];
      
      // Salvar os produtos padrão no localStorage
      localStorage.setItem('products', JSON.stringify(defaultProducts));
      setProducts(defaultProducts);
      setMissingProducts([]);
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produtos redefinidos para os padrões!');
      console.log('Produtos redefinidos para:', defaultProducts);
    } catch (error) {
      console.error('Erro ao redefinir produtos:', error);
      toast.error('Ocorreu um erro ao redefinir os produtos');
    }
  };

  const handleCreateMissingProducts = () => {
    try {
      if (missingProducts.length === 0) {
        toast.info('Não há produtos faltando para criar.');
        return;
      }
      
      const newProducts = [...products];
      
      missingProducts.forEach(id => {
        const productConfig = getDefaultProductConfig(id);
        if (productConfig) {
          newProducts.push(productConfig);
        }
      });
      
      localStorage.setItem('products', JSON.stringify(newProducts));
      setProducts(newProducts);
      setMissingProducts([]);
      
      // Forçar um evento de storage para atualizar outros componentes
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Produtos faltantes criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar produtos faltantes:', error);
      toast.error('Ocorreu um erro ao criar os produtos faltantes');
    }
  };

  const getDefaultProductConfig = (id: string): ProductType | null => {
    switch (id) {
      case 'ADDS_IMPLANT':
        return {
          id: 'ADDS_IMPLANT',
          name: 'ADDS Implant',
          description: 'Produto premium para implantes dentários',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.ADDS_IMPLANT,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false }
          ]
        };
      case 'ADDS_ULTRA':
        return {
          id: 'ADDS_ULTRA',
          name: 'ADDS Ultra',
          description: 'Nossa solução avançada para higiene oral',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.ADDS_ULTRA,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false }
          ]
        };
      case 'RASPADOR_LINGUA':
        return {
          id: 'RASPADOR_LINGUA',
          name: 'Raspador de Língua',
          description: 'Higiene completa com nosso raspador de língua',
          active: true,
          visibleInPersonalization: true,
          imageUrl: DEFAULT_URLS.RASPADOR_LINGUA,
          customizationOptions: [
            { id: 'color', name: 'Cor', type: 'color', required: true },
            { id: 'logo', name: 'Logo', type: 'image', required: false }
          ]
        };
      default:
        return null;
    }
  };

  const handleTestImageUrl = async () => {
    if (!testImageUrl) {
      toast.error('Por favor, insira uma URL de imagem para testar.');
      return;
    }
    
    setTestImageStatus('loading');
    
    try {
      // Criar um elemento de imagem para testar a URL
      const img = new Image();
      
      // Configurar handlers para sucesso e erro
      img.onload = () => {
        setTestImageStatus('success');
        toast.success('URL da imagem é válida!');
      };
      
      img.onerror = () => {
        setTestImageStatus('error');
        toast.error('URL da imagem é inválida ou a imagem não está acessível.');
      };
      
      // Iniciar o carregamento da imagem
      img.src = testImageUrl;
    } catch (error) {
      console.error('Erro ao testar URL da imagem:', error);
      setTestImageStatus('error');
      toast.error('Ocorreu um erro ao testar a URL da imagem.');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Depuração de Produtos</h1>
      
      {missingProducts.length > 0 && (
        <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription>
            <div className="font-medium text-amber-800 mb-1">
              Produtos obrigatórios não encontrados ({missingProducts.length})
            </div>
            <p className="text-amber-700 mb-2">
              Os seguintes produtos essenciais não estão configurados: <strong>{missingProducts.join(', ')}</strong>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
              onClick={handleCreateMissingProducts}
            >
              Criar Produtos Faltantes
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Instruções para corrigir as imagens dos produtos</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Clique no botão <strong>"Redefinir para Padrões"</strong> para configurar todos os produtos com as URLs de imagens corretas</li>
          <li>Acesse a página de personalização para verificar se as imagens estão aparecendo corretamente</li>
          <li>Se ainda houver problemas, use o botão <strong>"Corrigir URLs das Imagens"</strong> para tentar corrigir apenas as URLs</li>
        </ol>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button onClick={handleResetToDefaults} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
          Redefinir para Padrões (Recomendado)
        </Button>
        <Button onClick={handleFixProducts} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">
          Corrigir URLs das Imagens
        </Button>
        <Button onClick={handleResetProducts} variant="destructive" className="bg-red-500 hover:bg-red-600">
          Limpar Todos os Produtos
        </Button>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
        <p className="text-amber-800 font-medium">
          <strong>Nota:</strong> Após clicar em qualquer botão acima, você precisará recarregar a página de personalização 
          para que as alterações tenham efeito.
        </p>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Testar URL de Imagem</h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input 
              type="text" 
              placeholder="Cole a URL da imagem para testar (ex: https://addsbrasil.com.br/imagem.png)" 
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleTestImageUrl} 
            disabled={testImageStatus === 'loading' || !testImageUrl}
            variant="outline"
          >
            {testImageStatus === 'loading' ? 'Verificando...' : 'Verificar URL'}
          </Button>
        </div>
        
        {testImageStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded p-3 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">URL válida!</p>
              <p className="text-green-700 text-sm mt-1">A imagem foi carregada com sucesso e pode ser usada.</p>
              <div className="mt-2 border rounded p-2 bg-white flex items-center justify-center">
                <img 
                  src={testImageUrl} 
                  alt="Imagem de teste" 
                  className="max-h-40 max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
        
        {testImageStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">URL inválida!</p>
              <p className="text-red-700 text-sm mt-1">Não foi possível carregar a imagem. Verifique se a URL está correta e se a imagem está disponível publicamente.</p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">URLs dos produtos ADDS:</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <div className="flex items-center gap-2">
                <span className="font-medium">ADDS Implant:</span>
                <span className="text-gray-600 break-all">{DEFAULT_URLS.ADDS_IMPLANT}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setTestImageUrl(DEFAULT_URLS.ADDS_IMPLANT);
                    setTestImageStatus('idle');
                  }}
                >
                  Usar
                </Button>
              </div>
            </li>
            <li>
              <div className="flex items-center gap-2">
                <span className="font-medium">ADDS Ultra:</span>
                <span className="text-gray-600 break-all">{DEFAULT_URLS.ADDS_ULTRA}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setTestImageUrl(DEFAULT_URLS.ADDS_ULTRA);
                    setTestImageStatus('idle');
                  }}
                >
                  Usar
                </Button>
              </div>
            </li>
            <li>
              <div className="flex items-center gap-2">
                <span className="font-medium">Raspador de Língua:</span>
                <span className="text-gray-600 break-all">{DEFAULT_URLS.RASPADOR_LINGUA}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setTestImageUrl(DEFAULT_URLS.RASPADOR_LINGUA);
                    setTestImageStatus('idle');
                  }}
                >
                  Usar
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <h2 className="text-xl font-semibold mb-6">Produtos Configurados</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p>Carregando produtos...</p>
        ) : products.length > 0 ? (
          products.map((product, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted">
                <CardTitle className="flex justify-between">
                  <span>{product.name} ({product.id})</span>
                  <span className={product.active ? 'text-green-600' : 'text-red-600'}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Informações do Produto</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Descrição:</strong> {product.description}</p>
                      <p>
                        <strong>Visível na Personalização:</strong> 
                        {product.visibleInPersonalization ? ' Sim' : ' Não'}
                      </p>
                      <p className="break-all">
                        <strong>URL da Imagem:</strong> 
                        {product.imageUrl ? 
                          <span className={product.imageUrl.includes(product.id.replace('_', '-')) ? 'text-green-600' : 'text-red-500'}>
                            {' ' + product.imageUrl}
                          </span> 
                          : ' Não definida'}
                      </p>
                      {product.imageUrl && (
                        <div className="flex mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs py-1 h-7"
                            onClick={() => {
                              setTestImageUrl(product.imageUrl || '');
                              setTestImageStatus('idle');
                            }}
                          >
                            Testar URL
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs py-1 h-7 ml-2"
                            onClick={() => {
                              const productConfig = getDefaultProductConfig(product.id);
                              if (productConfig && productConfig.imageUrl) {
                                // Atualizar apenas a URL da imagem
                                const updatedProduct = { ...product, imageUrl: productConfig.imageUrl };
                                const updatedProducts = products.map(p => 
                                  p.id === product.id ? updatedProduct : p
                                );
                                
                                localStorage.setItem('products', JSON.stringify(updatedProducts));
                                setProducts(updatedProducts);
                                
                                // Forçar um evento de storage para atualizar outros componentes
                                window.dispatchEvent(new Event('storage'));
                                
                                toast.success(`URL da imagem para ${product.name} foi restaurada para o padrão.`);
                              }
                            }}
                          >
                            Restaurar URL Padrão
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {product.imageUrl ? (
                      <div className="border rounded-md overflow-hidden">
                        <h3 className="text-sm font-semibold p-2 bg-muted">Preview da Imagem</h3>
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="max-h-full max-w-full object-contain p-2"
                            onError={() => toast.error(`Erro ao carregar imagem para ${product.name}`)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-100 rounded-md">
                        <p className="text-gray-500">Sem imagem</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhum produto encontrado no localStorage</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 