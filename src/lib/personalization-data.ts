import { DesignElement, ProductType } from '@/types/personalization';

// Elementos de design padrão
export const defaultDesignElements: Record<string, Omit<DesignElement, 'id'>> = {
  logo: {
    type: 'logo',
    content: '/images/logo-sample.png',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    angle: 0,
    fill: '#000000',
    inverted: false
  },
  contact: {
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
    angle: 0,
    fill: '#000000',
    inverted: false
  },
  social: {
    type: 'social',
    content: '@empresa',
    x: 50,
    y: 250,
    width: 200,
    height: 30,
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    angle: 0,
    fill: '#000000',
    inverted: false
  }
};

// Formata um número de telefone adicionando separadores automaticamente
export const formatPhoneNumber = (value: string): string => {
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

// Inverte as cores de um elemento
export const invertColor = (color: string): string => {
  // Remove o # se existir
  const hex = color.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Inverte cada componente
  const rInv = (255 - r).toString(16).padStart(2, '0');
  const gInv = (255 - g).toString(16).padStart(2, '0');
  const bInv = (255 - b).toString(16).padStart(2, '0');
  
  return `#${rInv}${gInv}${bInv}`;
};

export const getDefaultCanvasConfig = (productType: ProductType) => {
  switch (productType) {
    case 'camiseta':
      return { width: 500, height: 600 };
    case 'bone':
      return { width: 400, height: 300 };
    case 'caneca':
      return { width: 300, height: 350 };
    case 'adesivo':
      return { width: 400, height: 400 };
    case 'mousepad':
      return { width: 450, height: 350 };
    case 'adds_implant':
      return { width: 600, height: 200 };
    case 'adds_ultra':
      return { width: 600, height: 200 };
    case 'raspador_lingua':
      return { width: 600, height: 200 };
    case 'estojo_viagem':
      return { width: 400, height: 300 };
    default:
      return { width: 500, height: 500 };
  }
};
