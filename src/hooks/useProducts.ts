import { useState, useEffect } from 'react';
import { Product, ProductType } from '@/types/personalization';

// Função para converter um produto configurado para o formato de personalização
const convertConfigProductToPersonalizationProduct = (configProduct: any): Product => {
  // Determinar o tipo de produto com base no nome ou categoria
  let productType: ProductType = 'camiseta'; // Padrão
  
  const nameLower = configProduct.name.toLowerCase();
  if (nameLower.includes('camiseta')) {
    productType = 'camiseta';
  } else if (nameLower.includes('boné') || nameLower.includes('bone')) {
    productType = 'bone';
  } else if (nameLower.includes('caneca')) {
    productType = 'caneca';
  } else if (nameLower.includes('adesivo')) {
    productType = 'adesivo';
  } else if (nameLower.includes('mousepad')) {
    productType = 'mousepad';
  } else if (nameLower.includes('adds implant') || nameLower.includes('implant')) {
    productType = 'adds_implant';
  } else if (nameLower.includes('adds ultra')) {
    productType = 'adds_ultra';
  } else if (nameLower.includes('raspador de língua') || nameLower.includes('raspador')) {
    productType = 'raspador_lingua';
  } else if (nameLower.includes('estojo de viagem') || nameLower.includes('estojo')) {
    productType = 'estojo_viagem';
  }
  
  // Obter configurações de canvas com base no tipo
  const defaultConfig = getDefaultCanvasConfig(productType);
  
  // Definir URLs de imagens padrão caso não estejam definidas
  let imageUrl = configProduct.imageUrl || '';
  
  // Verificar se o produto não tem URL de imagem e definir uma padrão com base no ID
  if (!imageUrl) {
    if (configProduct.id === 'ADDS_IMPLANT') {
      imageUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png';
    } else if (configProduct.id === 'ADDS_ULTRA') {
      imageUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png';
    } else if (configProduct.id === 'RASPADOR_LINGUA') {
      imageUrl = 'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png';
    }
  }
  
  console.log(`Produto ${configProduct.name} (${configProduct.id}) usando imagem: ${imageUrl}`);
  
  return {
    id: configProduct.id, // Usar o ID original do produto configurado
    name: configProduct.name,
    description: configProduct.description || '',
    imageUrl, // Usando a imagem configurada diretamente do produto ou a padrão
    canvasWidth: defaultConfig.width,
    canvasHeight: defaultConfig.height,
    customizationAreas: [
      { 
        x: 50, 
        y: 50, 
        width: defaultConfig.width - 100, 
        height: defaultConfig.height - 100 
      }
    ]
  };
};

// Obter configurações padrão de canvas com base no tipo de produto
const getDefaultCanvasConfig = (productType: ProductType): { width: number, height: number } => {
  switch (productType) {
    case 'camiseta':
      return { width: 400, height: 500 };
    case 'bone':
      return { width: 300, height: 200 };
    case 'caneca':
      return { width: 350, height: 300 };
    case 'adesivo':
      return { width: 200, height: 200 };
    case 'mousepad':
      return { width: 400, height: 300 };
    case 'adds_implant':
      return { width: 600, height: 200 }; // Dimensões otimizadas para o formato do ADDS Implant
    case 'adds_ultra':
      return { width: 600, height: 200 }; // Dimensões similares para ADDS Ultra
    case 'raspador_lingua':
      return { width: 500, height: 200 }; // Dimensões para o raspador
    case 'estojo_viagem':
      return { width: 450, height: 300 }; // Dimensões para o estojo
    default:
      return { width: 400, height: 400 };
  }
};

// Produtos padrão para demonstração
const getDefaultProductsData = () => [
  {
    id: 'ADDS_IMPLANT',
    name: 'ADDS Implant',
    description: 'Fio dental especial para implantes dentários',
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png',
    active: true,
    visibleInPersonalization: true
  },
  {
    id: 'ADDS_ULTRA',
    name: 'ADDS Ultra',
    description: 'Fio dental ultra resistente para uso diário',
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Ultra-verso.png',
    active: true,
    visibleInPersonalization: true
  },
  {
    id: 'RASPADOR_LINGUA',
    name: 'Raspador de Língua ADDS',
    description: 'Raspador de língua para higiene bucal completa',
    imageUrl: 'https://addsbrasil.com.br/wp-content/uploads/2025/03/Raspador-de-Lingua-adds.png',
    active: true,
    visibleInPersonalization: true
  }
];

// Função para inicializar produtos padrão se não existirem
const initializeDefaultProducts = () => {
  const storedProducts = localStorage.getItem('products');
  if (!storedProducts) {
    const defaultProducts = getDefaultProductsData();
    localStorage.setItem('products', JSON.stringify(defaultProducts));
    console.log('✅ Produtos padrão inicializados:', defaultProducts);
    return defaultProducts;
  }
  return JSON.parse(storedProducts);
};

// Função para obter produtos estáticos para componentes que não podem usar hooks
export const getDefaultProducts = (): Product[] => {
  // Inicializar produtos padrão se necessário
  const configProducts = initializeDefaultProducts();
  
  try {
    // Filtrar apenas produtos ativos e visíveis na personalização
    const activeProducts = configProducts.filter(
      (p: any) => p.active && p.visibleInPersonalization
    );
    // Converter para o formato de personalização
    return activeProducts.map(convertConfigProductToPersonalizationProduct);
  } catch (error) {
    console.error('Erro ao processar produtos armazenados:', error);
    return [];
  }
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      try {
        // Inicializar produtos padrão se necessário e buscar do localStorage
        const configProducts = initializeDefaultProducts();
        
        // Filtrar apenas produtos ativos e visíveis na personalização
        const activeProducts = configProducts.filter(
          (p: any) => p.active && p.visibleInPersonalization
        );
        
        // Converter para o formato de personalização
        const personalizationProducts = activeProducts.map(convertConfigProductToPersonalizationProduct);
        setProducts(personalizationProducts);
        
        console.log('✅ Produtos carregados:', personalizationProducts);
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Não foi possível carregar os produtos configurados.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Adicionar listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'products') {
        fetchProducts();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { products, loading, error };
}; 