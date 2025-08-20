import { useState, useEffect } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

export function useViewport(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1200, height: 800 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Definir viewport inicial
    updateViewport();

    // Adicionar listener para resize
    window.addEventListener('resize', updateViewport);
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return viewport;
}

export function useColumnWidth(): number {
  const { width } = useViewport();
  
  if (width >= 1024) return 344; // Desktop: 320px + 24px gap
  if (width >= 768) return 296;  // Tablet: 280px + 16px gap  
  if (width >= 480) return 272;  // Mobile Large: 260px + 12px gap
  return 248;                    // Mobile Small: 240px + 8px gap
}

export default useViewport; 