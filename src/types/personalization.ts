export type ProductType = 
  | 'camiseta' 
  | 'bone' 
  | 'caneca' 
  | 'adesivo' 
  | 'mousepad'
  | 'adds_implant'
  | 'adds_ultra'
  | 'raspador_lingua'
  | 'estojo_viagem';

export interface Product {
  id: ProductType;
  name: string;
  description: string;
  imageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  customizationAreas?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export interface DesignElement {
  id: string;
  type: 'text' | 'logo' | 'contact' | 'social' | 'email' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  fill: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  inverted: boolean;
}

export interface Design {
  id: string;
  productId: ProductType;
  elements: DesignElement[];
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
