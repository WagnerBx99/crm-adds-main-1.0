import { useCallback, useRef } from 'react';

interface AutoScrollOptions {
  threshold?: number;
  speed?: number;
  acceleration?: number;
}

interface ScrollDirection {
  x: number;
  y: number;
}

export function useAutoScroll(options: AutoScrollOptions = {}) {
  const {
    threshold = 50,
    speed = 8,
    acceleration = 1.2
  } = options;

  const scrollIntervalRef = useRef<NodeJS.Timeout>();
  const velocityRef = useRef<ScrollDirection>({ x: 0, y: 0 });

  const clearAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = undefined;
    }
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  const startAutoScroll = useCallback(
    (
      container: HTMLElement,
      clientX: number,
      clientY: number
    ) => {
      clearAutoScroll();

      const containerRect = container.getBoundingClientRect();
      const scrollDirection: ScrollDirection = { x: 0, y: 0 };

      // Calcular direção horizontal
      if (clientX < containerRect.left + threshold) {
        scrollDirection.x = -1;
      } else if (clientX > containerRect.right - threshold) {
        scrollDirection.x = 1;
      }

      // Calcular direção vertical
      if (clientY < containerRect.top + threshold) {
        scrollDirection.y = -1;
      } else if (clientY > containerRect.bottom - threshold) {
        scrollDirection.y = 1;
      }

      // Se não há direção, não inicia scroll
      if (scrollDirection.x === 0 && scrollDirection.y === 0) {
        return;
      }

      velocityRef.current = { x: scrollDirection.x, y: scrollDirection.y };

      scrollIntervalRef.current = setInterval(() => {
        const currentVelocity = velocityRef.current;
        
        // Calcular velocidade com aceleração suave
        const scrollX = currentVelocity.x * speed;
        const scrollY = currentVelocity.y * speed;

        // Aplicar scroll
        if (scrollX !== 0) {
          container.scrollLeft += scrollX;
        }
        if (scrollY !== 0) {
          container.scrollTop += scrollY;
        }

        // Aplicar aceleração gradual
        velocityRef.current = {
          x: currentVelocity.x * acceleration,
          y: currentVelocity.y * acceleration
        };

        // Limitar velocidade máxima
        const maxVelocity = speed * 3;
        velocityRef.current.x = Math.max(-maxVelocity, Math.min(maxVelocity, velocityRef.current.x));
        velocityRef.current.y = Math.max(-maxVelocity, Math.min(maxVelocity, velocityRef.current.y));
      }, 16); // ~60fps
    },
    [threshold, speed, acceleration, clearAutoScroll]
  );

  const handleAutoScroll = useCallback(
    (event: MouseEvent | TouchEvent, container?: HTMLElement) => {
      const targetContainer = container || document.documentElement;
      
      let clientX: number;
      let clientY: number;

      if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        return;
      }

      startAutoScroll(targetContainer, clientX, clientY);
    },
    [startAutoScroll]
  );

  return {
    handleAutoScroll,
    clearAutoScroll,
    startAutoScroll
  };
} 