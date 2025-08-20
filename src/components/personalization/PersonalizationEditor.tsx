import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, Image as FabricImage, Object as FabricObject, Textbox } from 'fabric';
import { toast } from 'sonner';
import { DesignElement, Design, ProductType, Product } from '@/types/personalization';
import { defaultDesignElements, invertColor, formatPhoneNumber } from '@/lib/personalization-data';
import { useProducts } from '@/hooks/useProducts';
import { ProductSelector } from './ProductSelector';
import { ToolbarEdit } from './ToolbarEdit';
import { ElementsPanel } from './ElementsPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, 
  Save,
  AlertCircle,
  Share2,
  ArrowLeft,
  Type,
  Image,
  Phone,
  AtSign,
  Instagram,
  FileImage
} from 'lucide-react';
import { v4 as uuidv4 } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface HistoryState {
  elements: DesignElement[];
  productId: ProductType;
}

// Estender a interface do FabricObject para incluir propriedades personalizadas
declare module 'fabric' {
  interface Object {
    elementId?: string;
  }
}

// URLs definitivas para os produtos ADDS
const ADDS_IMPLANT_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/adds-implant-1.png';
const ADDS_ULTRA_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/adds-ultra-2.png';
const RASPADOR_LINGUA_URL = 'https://addsbrasil.com.br/wp-content/uploads/2023/08/raspador-lingua-1.png';

// Função para obter URL segura para um produto ADDS
const getProductImageUrl = (productId: ProductType): string => {
  switch (productId) {
    case 'adds_implant':
      return ADDS_IMPLANT_URL;
    case 'adds_ultra':
      return ADDS_ULTRA_URL;
    case 'raspador_lingua':
      return RASPADOR_LINGUA_URL;
    default:
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNMTU4IDEyOEgyNDJDMjUxLjk0MSAxMjggMjYwIDEzNi4wNTkgMjYwIDE0NlYyNTRDMjYwIDI2My45NDEgMjUxLjk0MSAyNzIgMjQyIDI3MkgxNThDMTQ4LjA1OSAyNzIgMTQwIDI2My45NDEgMTQwIDI1NFYxNDZDMTQwIDEzNi4wNTkgMTQ4LjA1OSAxMjggMTU4IDEyOFoiIGZpbGw9IiNEOEQ4RDgiLz48cGF0aCBkPSJNMTgzIDE1MEMyMDIuMzMgMTUwIDIxOCAxNjUuNjcgMjE4IDE4NUMyMTggMjA0LjMzIDIwMi4zMyAyMjAgMTgzIDIyMEMxNjMuNjcgMjIwIDE0OCAyMDQuMzMgMTQ4IDE4NUMxNDggMTY1LjY3IDE2My42NyAxNTAgMTgzIDE1MFoiIGZpbGw9IiNDMkMyQzIiLz48cGF0aCBkPSJNMjM2IDIxMEwyNjAgMjM0VjI3Mkw0OCAyNzJMNjkgMjUxTDEwMCAyMjBMMTM2IDI1NkwxODQgMjA4TDIzNiAyMTBaIiBmaWxsPSIjQzJDMkMyIi8+PC9zdmc+';
  }
};

export default function PersonalizationEditor() {
  // Declaração de todos os estados primeiro
  const { products, loading, error: productsError } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<ProductType | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showPanels, setShowPanels] = useState(true);
  const [projectName, setProjectName] = useState("Projeto sem título");
  const [designSaved, setDesignSaved] = useState(false);
  const [showChangeProductModal, setShowChangeProductModal] = useState(false);
  const [newProductId, setNewProductId] = useState<ProductType | null>(null);

  // Referências
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  // Variáveis derivadas
  const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
  const selectedElement = selectedElementId 
    ? elements.find(el => el.id === selectedElementId) || null
    : null;

  // ==== TODOS OS HOOKS useEffect LOGO AQUI NO INÍCIO DO COMPONENTE ====

  // Estilos CSS para animação de destaque do canvas
  useEffect(() => {
    // Adicionar estilo CSS para animação de destaque ao canvas
    const style = document.createElement('style');
    style.innerHTML = `
      .canvas-highlight {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7);
        animation: canvas-pulse 1s ease-in-out;
      }
      
      @keyframes canvas-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Seleção do primeiro produto disponível ao carregar a lista
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const firstProductId = products[0].id;
      setSelectedProductId(firstProductId);
      
      // Adicionar texto inicial automaticamente ao selecionar o primeiro produto
      setTimeout(() => {
        if (elements.length === 0) {
          const selectedProduct = products[0];
          const defaultTextElement: DesignElement = {
            id: uuidv4(),
            type: 'text',
            content: 'Clique para editar',
            x: selectedProduct.canvasWidth / 2 - 100,
            y: selectedProduct.canvasHeight / 2 - 20,
            width: 200,
            height: 40,
            angle: 0,
            fill: '#000000',
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center',
            inverted: false
          };
          
          setElements([defaultTextElement]);
          setSelectedElementId(defaultTextElement.id);
        }
      }, 800);
    }
  }, [products, selectedProductId, elements.length]);

  // Inicialização do canvas com tratamento de erro simplificado
  useEffect(() => {
    if (canvasRef.current && selectedProductId) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) return; // Sair se o produto não for encontrado

      // Limpar canvas anterior se existir
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }

      try {
        // Criar novo canvas
        const canvas = new Canvas(canvasRef.current, {
          width: selectedProduct.canvasWidth,
          height: selectedProduct.canvasHeight,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        });

        fabricCanvasRef.current = canvas;

        // Adicionar texto de carregamento para feedback visual
        const loadingText = new Textbox('Carregando produto...', {
          left: selectedProduct.canvasWidth / 2,
          top: selectedProduct.canvasHeight / 2,
          fontSize: 16,
          fontFamily: 'Arial',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          fill: '#666666'
        });
        canvas.add(loadingText);
        canvas.renderAll();

        // Adicionar imagem de fundo do produto se disponível
        if (selectedProduct) {
          console.log(`Carregando imagem para o produto: ${selectedProduct.name} (${selectedProduct.id})`);

          // Usar a URL direta e segura para o produto ADDS
          const imageUrl = getProductImageUrl(selectedProduct.id);
          console.log(`URL da imagem a ser carregada: ${imageUrl}`);

          // Carregar a imagem com crossOrigin para evitar problemas de CORS
          // @ts-ignore - Ignorando erro de tipagem do Fabric.js
          FabricImage.fromURL(imageUrl, (img) => {
            // Remover texto de carregamento
            canvas.remove(loadingText);

            if (!img) {
              console.error(`Falha ao carregar imagem: ${imageUrl}`);
              const errorText = new Textbox('Não foi possível carregar a imagem', {
                left: selectedProduct.canvasWidth / 2,
                top: selectedProduct.canvasHeight / 2,
                fontSize: 14,
                fontFamily: 'Arial',
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                fill: '#ff0000'
              });
              canvas.add(errorText);
              canvas.renderAll();
              return;
            }

            // Configurar a imagem como fundo não selecionável
            img.set({
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              hasBorders: false,
              hasControls: false,
              absolutePositioned: true
            });

            // Dimensionar para caber no canvas mantendo proporções
            const scaleX = selectedProduct.canvasWidth / (img.width || 1);
            const scaleY = selectedProduct.canvasHeight / (img.height || 1);
            const scale = Math.min(scaleX, scaleY);

            img.scale(scale);

            // Centralizar a imagem no canvas
            const scaledWidth = (img.width || 1) * scale;
            const scaledHeight = (img.height || 1) * scale;
            img.left = (selectedProduct.canvasWidth - scaledWidth) / 2;
            img.top = (selectedProduct.canvasHeight - scaledHeight) / 2;

            // Usar um canvas limpo para adicionar a imagem primeiro
            canvas.clear();
            canvas.add(img);
            canvas.renderAll();

            console.log('Imagem carregada com sucesso!');

            // Destacar o canvas para mostrar que está pronto
            setTimeout(() => {
              const canvasContainer = document.querySelector('.canvas-container');
              if (canvasContainer) {
                canvasContainer.classList.add('canvas-highlight');
                setTimeout(() => {
                  canvasContainer.classList.remove('canvas-highlight');
                }, 1000);
              }
            }, 300);
          }, { crossOrigin: 'anonymous' });
        }

        // Configurar eventos do canvas
        canvas.on('selection:created', function(e) {
          const obj = e.selected?.[0];
          if (obj && obj.elementId) {
            setSelectedElementId(obj.elementId);
          }
        });

        canvas.on('selection:updated', function(e) {
          const obj = e.selected?.[0];
          if (obj && obj.elementId) {
            setSelectedElementId(obj.elementId);
          }
        });

        canvas.on('selection:cleared', function() {
          setSelectedElementId(null);
        });

        canvas.on('object:modified', function(e) {
          if (!e.target) return;
          const obj = e.target;
          if (!obj.elementId) return;

          const elementId = obj.elementId;
          const element = elements.find(el => el.id === elementId);
          
          if (element) {
            const updatedElement = {
              ...element,
              x: Math.round(obj.left || 0),
              y: Math.round(obj.top || 0),
              width: Math.round(obj.getScaledWidth() || element.width),
              height: Math.round(obj.getScaledHeight() || element.height),
              angle: Math.round(obj.angle || 0)
            };
            
            // Atualizar o elemento no estado
            setElements(prev => 
              prev.map(el => el.id === updatedElement.id ? updatedElement : el)
            );
          }
        });

        // Adicionar os elementos ao canvas usando a função de renderização local
        const renderCanvasElements = (canvasInstance: Canvas, elementsToRender: DesignElement[]) => {
          // Manter a imagem de fundo e remover apenas os objetos com elementId
          canvasInstance.getObjects().forEach(obj => {
            if (obj.elementId) {
              canvasInstance.remove(obj);
            }
          });
          canvasInstance.backgroundColor = '#ffffff';
          canvasInstance.renderAll();

          // Adicionar os elementos ao canvas
          elementsToRender.forEach(element => {
            let obj: FabricObject | null = null;

            if (element.type === 'text' || element.type === 'contact' || element.type === 'social' || element.type === 'email') {
              obj = new Textbox(element.content, {
                left: element.x,
                top: element.y,
                width: element.width,
                fontSize: element.fontSize || 20,
                fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textAlign: element.textAlign || 'center',
                fill: element.inverted ? invertColor(element.fill) : element.fill,
                angle: element.angle,
              });
            } else if (element.type === 'logo' || element.type === 'image') {
              // Carregar imagem de forma assíncrona
              // @ts-ignore - Ignorando erro de tipagem do Fabric.js
              FabricImage.fromURL(element.content, (img) => {
                if (!img) return;
                
                img.set({
                  left: element.x,
                  top: element.y,
                  angle: element.angle,
                });
                
                img.scaleToWidth(element.width);
                img.scaleToHeight(element.height);
                
                if (element.inverted) {
                  try {
                    const filter = new FabricImage.filters.Invert();
                    // @ts-ignore - Ignorando erro de tipagem do Fabric.js
                    img.filters = [filter];
                    img.applyFilters();
                  } catch (error) {
                    console.error("Erro ao aplicar filtro de inversão:", error);
                  }
                }
                
                img.elementId = element.id;
                canvasInstance.add(img);
                
                if (element.id === selectedElementId) {
                  canvasInstance.setActiveObject(img);
                }
                
                canvasInstance.renderAll();
              });
              
              return;
            }

            if (obj) {
              obj.elementId = element.id;
              canvasInstance.add(obj);
              
              // Definir como selecionado se necessário
              if (element.id === selectedElementId) {
                canvasInstance.setActiveObject(obj);
              }
            }
          });
          
          canvasInstance.renderAll();
        };

        // Render initial elements
        renderCanvasElements(canvas, elements);
        
        return () => {
          canvas.dispose();
        };
      } catch (error) {
        console.error("Erro ao inicializar o canvas:", error);
        toast.error("Ocorreu um erro ao inicializar a área de edição. Tente recarregar a página.");
      }
    }
  }, [selectedProductId, products, elements, selectedElementId]);

  // Renderizar elementos no canvas quando mudarem
  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Remover apenas os objetos que têm elementId (elementos do usuário)
      const existingObjects = fabricCanvasRef.current.getObjects();
      existingObjects.forEach(obj => {
        if (obj.elementId) {
          fabricCanvasRef.current?.remove(obj);
        }
      });
      
      // Adicionar os elementos ao canvas
      elements.forEach(element => {
        let obj: FabricObject | null = null;

        if (element.type === 'text' || element.type === 'contact' || element.type === 'social' || element.type === 'email') {
          obj = new Textbox(element.content, {
            left: element.x,
            top: element.y,
            width: element.width,
            fontSize: element.fontSize || 20,
            fontFamily: element.fontFamily || 'Arial',
            fontWeight: element.fontWeight || 'normal',
            fontStyle: element.fontStyle || 'normal',
            textAlign: element.textAlign || 'center',
            fill: element.inverted ? invertColor(element.fill) : element.fill,
            angle: element.angle,
          });
        } else if (element.type === 'logo' || element.type === 'image') {
          // Carregar imagem de forma assíncrona
          // @ts-ignore - Ignorando erro de tipagem do Fabric.js
          FabricImage.fromURL(element.content, (img) => {
            if (!img) return;
            
            img.set({
              left: element.x,
              top: element.y,
              angle: element.angle,
            });
            
            img.scaleToWidth(element.width);
            img.scaleToHeight(element.height);
            
            if (element.inverted) {
              try {
                const filter = new FabricImage.filters.Invert();
                // @ts-ignore - Ignorando erro de tipagem do Fabric.js
                img.filters = [filter];
                img.applyFilters();
              } catch (error) {
                console.error("Erro ao aplicar filtro de inversão:", error);
              }
            }
            
            img.elementId = element.id;
            
            if (fabricCanvasRef.current) {
              fabricCanvasRef.current.add(img);
              
              if (element.id === selectedElementId) {
                fabricCanvasRef.current.setActiveObject(img);
              }
              
              fabricCanvasRef.current.renderAll();
            }
          });
          
          return;
        }

        if (obj) {
          obj.elementId = element.id;
          fabricCanvasRef.current.add(obj);
          
          // Definir como selecionado se necessário
          if (element.id === selectedElementId) {
            fabricCanvasRef.current.setActiveObject(obj);
          }
        }
      });
      
      fabricCanvasRef.current.renderAll();
    }
  }, [elements, selectedElementId]);

  // Adicionar ao histórico quando os elementos mudarem
  useEffect(() => {
    if (elements.length > 0 && selectedProductId) {
      // Remover estados futuros se estiver no meio do histórico
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ elements: [...elements], productId: selectedProductId });
      
      // Limitar o tamanho do histórico para evitar consumo excessivo de memória
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Marcar como não salvo quando houver alterações
      setDesignSaved(false);
    }
  }, [elements, selectedProductId, history, historyIndex]);

  // Efeito para destacar o canvas após carregar elementos
  useEffect(() => {
    if (canvasRef.current && fabricCanvasRef.current && elements.length > 0) {
      // Encontrar o elemento de canvas
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer) {
        // Rolar para o canvas e destacá-lo
        setTimeout(() => {
          canvasContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Adicionar uma animação sutil para destacar o canvas
          canvasContainer.classList.add('canvas-highlight');
          setTimeout(() => {
            canvasContainer.classList.remove('canvas-highlight');
          }, 1000);
          
          // Mostrar uma notificação para guiar o usuário
          if (elements.length === 1) {
            toast.info('Clique no texto para editar', {
              position: 'bottom-center',
              duration: 3000,
            });
          }
          
          // Selecionar o primeiro elemento se houver algum
          if (elements.length > 0 && fabricCanvasRef.current) {
            const objects = fabricCanvasRef.current.getObjects();
            // Selecionar o objeto que não é a imagem de fundo (que normalmente é o primeiro)
            const elementObj = objects.find(obj => obj.elementId);
            
            if (elementObj) {
              fabricCanvasRef.current.setActiveObject(elementObj);
              fabricCanvasRef.current.renderAll();
            }
          }
        }, 500);
      }
    }
  }, [elements]);

  // Quando o produto é alterado, adicionar texto inicial se não houver elementos
  useEffect(() => {
    if (selectedProductId && elements.length === 0) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (selectedProduct) {
        console.log('Adicionando texto inicial para o produto:', selectedProduct.name);
        
        // Adicionar elemento de texto inicial para facilitar a edição
        const defaultTextElement: DesignElement = {
          id: uuidv4(),
          type: 'text',
          content: 'Clique para editar',
          x: selectedProduct.canvasWidth / 2 - 100,
          y: selectedProduct.canvasHeight / 2 - 20,
          width: 200,
          height: 40,
          angle: 0,
          fill: '#000000',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          inverted: false
        };
        
        // Definir o texto inicial com atraso para garantir que o canvas já esteja pronto
        setTimeout(() => {
          setElements([defaultTextElement]);
          setSelectedElementId(defaultTextElement.id);
        }, 500);
      }
    }
  }, [selectedProductId, products, elements.length]);

  const handleProductChange = (productId: ProductType) => {
    // Confirmar a mudança se houver elementos
    if (elements.length > 0) {
      setShowChangeProductModal(true);
      setNewProductId(productId);
    } else {
      setSelectedProductId(productId);
      
      // Dar foco ao canvas após a mudança de produto
      setTimeout(() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.setActiveObject(fabricCanvasRef.current.getObjects()[0]);
          fabricCanvasRef.current.renderAll();
          
          // Criar um elemento temporário para atrair a atenção do usuário
          const canvasEl = document.querySelector('.canvas-container');
          if (canvasEl) {
            canvasEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Adicionar uma animação sutil para destacar o canvas
            canvasEl.classList.add('canvas-highlight');
            setTimeout(() => {
              canvasEl.classList.remove('canvas-highlight');
            }, 1000);
          }
        }
      }, 300);
    }
  };

  // Confirmação ao mudar de produto finalizada
  const confirmProductChange = () => {
    if (newProductId) {
      setSelectedProductId(newProductId);
      setElements([]);
      setSelectedElementId(null);
      
      // Adicionamos um estado vazio ao histórico
      const newHistory = [...history, { elements: [], productId: newProductId }];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setShowChangeProductModal(false);
      setNewProductId(null);
      
      // Adicionar texto inicial automaticamente ao mudar de produto
      setTimeout(() => {
        const selectedProduct = products.find(p => p.id === newProductId);
        if (selectedProduct) {
          const defaultTextElement: DesignElement = {
            id: uuidv4(),
            type: 'text',
            content: 'Clique para editar',
            x: selectedProduct.canvasWidth / 2 - 100,
            y: selectedProduct.canvasHeight / 2 - 20,
            width: 200,
            height: 40,
            angle: 0,
            fill: '#000000',
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center',
            inverted: false
          };
          
          setElements([defaultTextElement]);
          setSelectedElementId(defaultTextElement.id);
        }
      }, 500);
    }
  };

  const handleAddElement = (type: 'text' | 'logo' | 'contact' | 'social' | 'email' | 'image') => {
    if (!selectedProductId) return;
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    let newElement: DesignElement;
    
    const baseElement: DesignElement = {
      id: uuidv4(),
      type: 'text',
      content: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      angle: 0,
      fill: '#000000',
      inverted: false
    };
    
    switch (type) {
      case 'text':
        newElement = {
          ...baseElement,
          type: 'text',
          content: 'Seu texto aqui',
          x: selectedProduct.canvasWidth / 2 - 100,
          y: selectedProduct.canvasHeight / 2 - 20,
          width: 200,
          height: 40,
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center'
        };
        break;
      case 'logo':
        newElement = {
          ...baseElement,
          type: 'logo',
          content: '/images/logo-sample.png',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        };
        break;
      case 'contact':
        newElement = {
          ...baseElement,
          type: 'contact',
          content: '(11) 99999-9999',
          x: 50,
          y: 200,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
        };
        break;
      case 'email':
        newElement = {
          ...baseElement,
          type: 'email',
          content: 'contato@seudominio.com.br',
          x: 50,
          y: 250,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
        };
        break;
      case 'social':
        newElement = {
          ...baseElement,
          type: 'social',
          content: '@empresa',
          x: 50,
          y: 300,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
        };
        break;
      case 'image':
        newElement = {
          ...baseElement,
          type: 'image',
          content: 'https://via.placeholder.com/300x200?text=Imagem',
          x: selectedProduct.canvasWidth / 2 - 150,
          y: selectedProduct.canvasHeight / 2 - 100,
          width: 300,
          height: 200,
        };
        break;
      default:
        return;
    }
    
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleRemoveElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const handleUpdateElement = (updatedElement: DesignElement) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );

    // Atualizar o objeto no canvas
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      const obj = objects.find(o => o.elementId === updatedElement.id);
      
      if (obj) {
        // Atualizar propriedades do objeto Fabric
        if (obj instanceof Textbox) {
          obj.set({
            fontSize: updatedElement.fontSize,
            fontFamily: updatedElement.fontFamily,
            fontWeight: updatedElement.fontWeight,
            fontStyle: updatedElement.fontStyle,
            textAlign: updatedElement.textAlign,
            fill: updatedElement.inverted ? invertColor(updatedElement.fill) : updatedElement.fill,
          });
        }
        
        obj.set({
          left: updatedElement.x,
          top: updatedElement.y,
          angle: updatedElement.angle,
        });
        
        if (obj instanceof FabricImage && updatedElement.inverted) {
          try {
            const filter = new FabricImage.filters.Invert();
            // @ts-ignore - Ignorando erro de tipagem do Fabric.js
            obj.filters = [filter];
            obj.applyFilters();
          } catch (error) {
            console.error("Erro ao aplicar filtro de inversão:", error);
          }
        } else if (obj instanceof FabricImage && !updatedElement.inverted) {
          obj.filters = [];
          obj.applyFilters();
        }
        
        fabricCanvasRef.current.renderAll();
      } else {
        // Se o objeto não for encontrado, talvez porque foi alterado o conteúdo da imagem
        // Nesse caso, remontamos o objeto usando a lógica existente no useEffect
        if (fabricCanvasRef.current) {
          // Forçar nova renderização dos elementos usando o useEffect existente
          const elementsCopy = [...elements];
          setElements(elementsCopy);
        }
      }
    }
  };

  const handleDuplicateElement = (elementId: string) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (!elementToDuplicate) return;
    
    const newElement: DesignElement = {
      ...elementToDuplicate,
      id: uuidv4(),
      x: elementToDuplicate.x + 20, // Deslocar um pouco para ser visível
      y: elementToDuplicate.y + 20
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleMoveElementUp = (elementId: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === elementId);
      if (index < prev.length - 1) {
        const newElements = [...prev];
        const temp = newElements[index];
        newElements[index] = newElements[index + 1];
        newElements[index + 1] = temp;
        return newElements;
      }
      return prev;
    });
  };

  const handleMoveElementDown = (elementId: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === elementId);
      if (index > 0) {
        const newElements = [...prev];
        const temp = newElements[index];
        newElements[index] = newElements[index - 1];
        newElements[index - 1] = temp;
        return newElements;
      }
      return prev;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(prevState.elements);
      if (prevState.productId !== selectedProductId) {
        setSelectedProductId(prevState.productId);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(nextState.elements);
      if (nextState.productId !== selectedProductId) {
        setSelectedProductId(nextState.productId);
      }
    }
  };

  const handlePrepareExport = () => {
    if (!fabricCanvasRef.current || !selectedProductId) return null;
    
    try {
      // Criar um novo canvas temporário para a exportação
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;
      
      // Tamanho do canvas atual
      const canvasWidth = fabricCanvasRef.current.getWidth();
      const canvasHeight = fabricCanvasRef.current.getHeight();
      
      // Definir tamanho do canvas de exportação (A4 em pixels @ 300dpi)
      const exportWidth = 2480;
      const exportHeight = 3508;
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      
      // Preencher com fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      
      // Desenhar borda estilizada
      ctx.strokeStyle = '#e1e1e1';
      ctx.lineWidth = 10;
      ctx.rect(30, 30, exportWidth - 60, exportHeight - 60);
      ctx.stroke();
      
      // Adicionar logo da ADDS no topo
      const logo = document.createElement('img');
      logo.src = '/images/logo-adds.png';
      
      // Retornar promise para aguardar carregamento da logo
      return new Promise((resolve) => {
        logo.onload = () => {
          // Desenhar logo centralizada no topo com espaço
          const logoWidth = 400;
          const logoHeight = (logoWidth / logo.width) * logo.height;
          ctx.drawImage(logo, (exportWidth - logoWidth) / 2, 60, logoWidth, logoHeight);
          
          // Obter dataURL do canvas atual
          const designDataURL = fabricCanvasRef.current?.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1
          });
          
          if (designDataURL) {
            const designImg = document.createElement('img');
            designImg.src = designDataURL;
            
            designImg.onload = () => {
              // Calcular posição e tamanho do design para centralizar na página
              const designWidth = Math.min(exportWidth - 200, canvasWidth * 2);
              const designHeight = (designWidth / canvasWidth) * canvasHeight;
              const designX = (exportWidth - designWidth) / 2;
              const designY = 150 + logoHeight;
              
              // Desenhar o design no canvas de exportação
              ctx.drawImage(designImg, designX, designY, designWidth, designHeight);
              
              // Adicionar linha separadora abaixo do design
              ctx.strokeStyle = '#e1e1e1';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(50, designY + designHeight + 50);
              ctx.lineTo(exportWidth - 50, designY + designHeight + 50);
              ctx.stroke();
              
              // Adicionar informações do produto
              const selectedProduct = products.find(p => p.id === selectedProductId);
              if (selectedProduct) {
                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                ctx.fillText(selectedProduct.name, exportWidth / 2, designY + designHeight + 100);
                
                ctx.font = '30px Arial';
                ctx.fillStyle = '#666666';
                ctx.fillText(selectedProduct.description, exportWidth / 2, designY + designHeight + 150);
                
                // Adicionar data atual
                const date = new Date();
                const formattedDate = date.toLocaleDateString('pt-BR');
                ctx.font = '24px Arial';
                ctx.fillStyle = '#999999';
                ctx.textAlign = 'right';
                ctx.fillText(`Data: ${formattedDate}`, exportWidth - 80, exportHeight - 80);
                
                // Adicionar nome do projeto
                ctx.font = '24px Arial';
                ctx.fillStyle = '#999999';
                ctx.textAlign = 'left';
                ctx.fillText(`Projeto: ${projectName}`, 80, exportHeight - 80);
              }
              
              // Retornar o dataURL do canvas completo
              resolve(exportCanvas.toDataURL('image/png'));
            };
          }
        };
        
        // Se houver erro ao carregar a logo, usar o canvas normal
        logo.onerror = () => {
          resolve(fabricCanvasRef.current?.toDataURL({
      format: 'png',
      quality: 1,
            multiplier: 1
          }));
        };
      });
    } catch (error) {
      console.error('Erro ao preparar exportação:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!fabricCanvasRef.current || !selectedProductId) return;
    
    try {
      const dataURL = await handlePrepareExport();
      
      if (dataURL) {
    const link = document.createElement('a');
        const fileName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        link.download = `${fileName}.png`;
        link.href = dataURL as string;
        document.body.appendChild(link);
    link.click();
        document.body.removeChild(link);
    
    toast.success('Design baixado com sucesso!');
      } else {
        toast.error('Não foi possível gerar a imagem. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao baixar design:', error);
      toast.error('Erro ao baixar o design. Tente novamente.');
    }
  };

  const handleSaveDesign = () => {
    try {
      if (!selectedProductId) return;
      
      const designToSave: Design = {
        id: uuidv4(),
        productId: selectedProductId,
        elements,
        name: projectName,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Em um sistema real, enviaríamos para o backend
      // Por enquanto, salvamos no localStorage
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      savedDesigns.push(designToSave);
      localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
      
      setDesignSaved(true);
      toast.success('Design salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar o design:', error);
      toast.error('Erro ao salvar o design. Tente novamente.');
    }
  };

  const handleShareDesign = () => {
    toast.info('Funcionalidade de compartilhamento ainda não implementada.');
  };

  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel(prev => {
        const newZoom = prev + 0.1;
        return Math.round(newZoom * 10) / 10; // Arredondar para 1 casa decimal
      });
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(prev => {
        const newZoom = prev - 0.1;
        return Math.round(newZoom * 10) / 10; // Arredondar para 1 casa decimal
      });
    }
  };

  const handleTogglePanels = () => {
    setShowPanels(prev => !prev);
  };

  // Renderização de estado de loading ou erro
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Escolha o Produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="aspect-square w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-2/3 mx-auto mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {productsError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum produto disponível para personalização. Por favor, adicione produtos nas Configurações e certifique-se de que estão marcados como "Visível na Personalização".
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior compacta com ações principais */}
      <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg font-medium bg-transparent border-0 border-b border-transparent focus:border-brand-blue focus:ring-0 px-0 py-1 w-40 md:w-auto"
            placeholder="Nome do projeto"
          />
          {!designSaved && (
            <span className="text-xs text-muted-foreground">(Não salvo)</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Design</DialogTitle>
                <DialogDescription>
                  Escolha um nome para seu design antes de salvar.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="projectName" className="text-sm font-medium">
                  Nome do Projeto
                </Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleSaveDesign}>Salvar Design</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={handleShareDesign}>
            <Share2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
          
          <Button variant="default" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Baixar</span>
          </Button>
        </div>
      </div>
      
      {/* Seletor de produtos em formato compacto */}
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium">Escolha o Produto</h2>
          <Badge variant="outline" className="text-xs font-normal">
            {products.length} {products.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
          </Badge>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {products.map((product) => (
            <div
              key={product.id}
              className={`flex-shrink-0 w-28 border rounded-lg cursor-pointer transition-all ${
                product.id === selectedProductId 
                  ? 'ring-2 ring-brand-blue border-brand-blue' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleProductChange(product.id)}
            >
              <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    let fallbackUrl = '';
                    
                    if (product.id === 'adds_implant') {
                      fallbackUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png';
                    } else if (product.id === 'adds_ultra') {
                      fallbackUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png';
                    } else if (product.id === 'raspador_lingua') {
                      fallbackUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png';
                    } else {
                      fallbackUrl = 'https://via.placeholder.com/200x200?text=Produto';
                    }
                    
                    target.src = fallbackUrl;
                    target.onerror = null;
                  }}
                />
                {product.id === selectedProductId && (
                  <div className="absolute inset-0 bg-brand-blue/10 flex items-center justify-center">
                    <div className="bg-brand-blue rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 text-center">
                <h3 className="text-xs font-medium text-gray-900 truncate">{product.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {selectedProduct && (
          <>
            {/* Barra horizontal de elementos no topo da área de edição */}
            <div className="border-b border-gray-200 px-3 py-2 bg-white rounded-t-lg shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                {/* Botões para adicionar elementos */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-md border border-gray-100">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('text')}
                  >
                    <Type className="h-4 w-4 mr-1.5 text-blue-500" />
                    Texto
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('logo')}
                  >
                    <Image className="h-4 w-4 mr-1.5 text-purple-500" />
                    Logo
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('contact')}
                  >
                    <Phone className="h-4 w-4 mr-1.5 text-green-500" />
                    Telefone
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('email')}
                  >
                    <AtSign className="h-4 w-4 mr-1.5 text-orange-500" />
                    Email
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('social')}
                  >
                    <Instagram className="h-4 w-4 mr-1.5 text-pink-500" />
                    Rede Social
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="whitespace-nowrap hover:bg-white hover:shadow-sm transition-all h-8"
                    onClick={() => handleAddElement('image')}
                  >
                    <FileImage className="h-4 w-4 mr-1.5 text-teal-500" />
                    Imagem
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8 mx-2" />
                
                {/* Elementos adicionados */}
                <div className="flex items-center gap-1">
                  {elements.length > 0 ? (
                    <>
                      <span className="text-xs text-muted-foreground whitespace-nowrap px-2">Elementos:</span>
                      <div className="flex gap-1 flex-wrap">
                        {elements.map((element) => (
                          <Button
                            key={element.id}
                            variant={element.id === selectedElementId ? "default" : "outline"}
                            size="sm"
                            className={`h-8 px-2 text-xs whitespace-nowrap transition-all ${
                              element.id === selectedElementId ? 'ring ring-blue-200' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedElementId(element.id)}
                          >
                            {element.type === 'text' && <Type className="h-3 w-3 mr-1" />}
                            {element.type === 'logo' && <Image className="h-3 w-3 mr-1" />}
                            {element.type === 'contact' && <Phone className="h-3 w-3 mr-1" />}
                            {element.type === 'email' && <AtSign className="h-3 w-3 mr-1" />}
                            {element.type === 'social' && <Instagram className="h-3 w-3 mr-1" />}
                            {element.type === 'image' && <FileImage className="h-3 w-3 mr-1" />}
                            {element.type === 'text' ? element.content.substring(0, 12) : element.type}
                            {element.type === 'text' && element.content.length > 12 && '...'}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic px-2">
                      Nenhum elemento adicionado. Clique em um dos botões para adicionar.
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Área principal dividida entre canvas e propriedades */}
            <div className="flex-1 flex overflow-hidden">
              {/* Área do Canvas (ocupa mais espaço) */}
              <div className="flex-1 bg-gray-50 p-2 flex flex-col min-w-0">
                <ToolbarEdit 
                  canvas={fabricCanvasRef.current}
                  selectedElement={selectedElement}
                  onUpdateElement={handleUpdateElement}
                  onRemoveElement={handleRemoveElement}
                  zoomLevel={zoomLevel}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onDuplicateElement={handleDuplicateElement}
                />
                
                <div className="flex-1 overflow-auto flex items-center justify-center bg-white rounded border mt-3 relative">
                  <div 
                    className="canvas-area relative"
                    style={{
                      position: 'relative',
                      padding: '30px',
                      background: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5) 0 0, linear-gradient(45deg, #f5f5f5 25%, #ffffff 25%, #ffffff 75%, #f5f5f5 75%, #f5f5f5) 10px 10px',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px',
                      borderRadius: '8px',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '400px'
                    }}
                  >
                    <div 
                      style={{ 
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        width: selectedProduct?.canvasWidth,
                        height: selectedProduct?.canvasHeight,
                        transition: 'transform 0.2s ease-in-out',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)',
                        background: '#ffffff',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <canvas ref={canvasRef} />
                      {/* Overlay com instrução quando não há elementos */}
                      {elements.length === 0 && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(1px)',
                            zIndex: 1000
                          }}
                        >
                          <div 
                            className="text-center p-4 rounded-lg bg-white bg-opacity-80 shadow-md border border-gray-100"
                            style={{ maxWidth: '80%' }}
                          >
                            <p className="text-gray-600 mb-2">Clique em um dos elementos acima para começar</p>
                            <div className="flex justify-center gap-2 text-xs text-gray-500">
                              <span><Type className="h-3 w-3 inline mr-1" />Texto</span>
                              <span><Image className="h-3 w-3 inline mr-1" />Logo</span>
                              <span><Phone className="h-3 w-3 inline mr-1" />Telefone</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Painel de Propriedades (fixa à direita, mais estreito) */}
            <div className="w-64 border-l border-gray-200 flex-shrink-0 overflow-auto">
              <PropertiesPanel 
                selectedElement={selectedElement}
                onUpdateElement={handleUpdateElement} 
              />
            </div>
          </>
        )}
      </div>
      
      {/* Modal de confirmação para troca de produto */}
      {showChangeProductModal && (
        <Dialog open={showChangeProductModal} onOpenChange={setShowChangeProductModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trocar de produto?</DialogTitle>
              <DialogDescription>
                Trocar de produto irá remover todos os elementos adicionados ao design atual. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowChangeProductModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmProductChange}>
                Trocar e remover elementos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Barra de zoom e ajuda na parte inferior */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-md border border-gray-100">
        <button 
          onClick={handleZoomOut} 
          disabled={zoomLevel <= 0.5}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-xs font-medium text-gray-500 min-w-[40px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button 
          onClick={handleZoomIn} 
          disabled={zoomLevel >= 3}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
