// Utilitário para resetar produtos no localStorage
export const resetProducts = () => {
  const defaultProducts = [
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

  localStorage.setItem('products', JSON.stringify(defaultProducts));
  console.log('✅ Produtos resetados:', defaultProducts);
  
  // Disparar evento para atualizar componentes
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'products',
    newValue: JSON.stringify(defaultProducts)
  }));
  
  return defaultProducts;
};

// Função para verificar se produtos existem
export const checkProducts = () => {
  const products = localStorage.getItem('products');
  console.log('🔍 Produtos no localStorage:', products ? JSON.parse(products) : 'Nenhum');
  return products ? JSON.parse(products) : [];
};

// Tornar disponível globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).resetProducts = resetProducts;
  (window as any).checkProducts = checkProducts;
} 