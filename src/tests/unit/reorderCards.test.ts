import { 
  reorderCardsInSameColumn, 
  moveCardBetweenColumns, 
  validateMove,
  createOptimisticSnapshot,
  applyRollback
} from '@/lib/reorderCards';
import { Order, Status } from '@/types';

// Mock data para testes
const mockOrders: Order[] = [
  {
    id: 'order-1',
    title: 'Pedido 1',
    status: 'FAZER' as Status,
    priority: 'normal',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    customer: { 
      id: 'customer-1',
      name: 'Cliente 1', 
      email: 'cliente1@test.com',
      phone: '(11) 99999-9999',
      company: 'Empresa 1',
      createdAt: new Date('2024-01-01')
    },
    history: []
  },
  {
    id: 'order-2',
    title: 'Pedido 2',
    status: 'FAZER' as Status,
    priority: 'high',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    customer: { 
      id: 'customer-2',
      name: 'Cliente 2', 
      email: 'cliente2@test.com',
      phone: '(11) 99999-9998',
      company: 'Empresa 2',
      createdAt: new Date('2024-01-02')
    },
    history: []
  },
  {
    id: 'order-3',
    title: 'Pedido 3',
    status: 'FAZER' as Status,
    priority: 'normal',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    customer: { 
      id: 'customer-3',
      name: 'Cliente 3', 
      email: 'cliente3@test.com',
      phone: '(11) 99999-9997',
      company: 'Empresa 3',
      createdAt: new Date('2024-01-03')
    },
    history: []
  }
];

describe('reorderCards', () => {
  describe('reorderCardsInSameColumn', () => {
    it('deve reordenar cards corretamente na mesma coluna', () => {
      const result = reorderCardsInSameColumn(mockOrders, 0, 2);
      
      expect(result.sourceOrders).toHaveLength(3);
      expect(result.sourceOrders[0].id).toBe('order-2');
      expect(result.sourceOrders[1].id).toBe('order-3');
      expect(result.sourceOrders[2].id).toBe('order-1');
      expect(result.movedOrder.id).toBe('order-1');
    });

    it('deve manter a ordem quando índices são iguais', () => {
      const result = reorderCardsInSameColumn(mockOrders, 1, 1);
      
      expect(result.sourceOrders).toEqual(mockOrders);
      expect(result.movedOrder.id).toBe('order-2');
    });
  });

  describe('moveCardBetweenColumns', () => {
    const destinationOrders: Order[] = [
      {
        id: 'order-4',
        title: 'Pedido 4',
        status: 'APROVACAO' as Status,
        priority: 'normal',
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
        customer: { 
          id: 'customer-4',
          name: 'Cliente 4', 
          email: 'cliente4@test.com',
          phone: '(11) 99999-9996',
          company: 'Empresa 4',
          createdAt: new Date('2024-01-04')
        },
        history: []
      }
    ];

    it('deve mover card entre colunas corretamente', () => {
      const result = moveCardBetweenColumns(
        mockOrders,
        destinationOrders,
        0,
        1,
        'APROVACAO' as Status
      );

      expect(result.sourceOrders).toHaveLength(2);
      expect(result.destinationOrders).toHaveLength(2);
      expect(result.movedOrder.status).toBe('APROVACAO');
      expect(result.movedOrder.id).toBe('order-1');
      expect(result.destinationOrders![1].id).toBe('order-1');
    });

    it('deve atualizar a data de modificação do card movido', () => {
      const originalDate = mockOrders[0].updatedAt;
      const result = moveCardBetweenColumns(
        mockOrders,
        destinationOrders,
        0,
        0,
        'APROVACAO' as Status
      );

      expect(result.movedOrder.updatedAt).not.toEqual(originalDate);
      expect(result.movedOrder.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('validateMove', () => {
    it('deve validar movimento na mesma coluna', () => {
      const isValid = validateMove('FAZER', 'FAZER', 0, 2, mockOrders);
      expect(isValid).toBe(true);
    });

    it('deve invalidar movimento para a mesma posição', () => {
      const isValid = validateMove('FAZER', 'FAZER', 1, 1, mockOrders);
      expect(isValid).toBe(false);
    });

    it('deve validar movimento entre colunas diferentes', () => {
      const destinationOrders: Order[] = [];
      const isValid = validateMove('FAZER', 'APROVACAO', 0, 0, mockOrders, destinationOrders);
      expect(isValid).toBe(true);
    });

    it('deve invalidar movimento com índices inválidos', () => {
      const isValid = validateMove('FAZER', 'FAZER', -1, 2, mockOrders);
      expect(isValid).toBe(false);
    });
  });

  describe('createOptimisticSnapshot e applyRollback', () => {
    it('deve criar snapshot e aplicar rollback corretamente', () => {
      const snapshot = createOptimisticSnapshot(mockOrders);
      
      expect(snapshot.orders).toHaveLength(3);
      expect(snapshot.timestamp).toBeGreaterThan(0);
      
      // Modificar os orders originais
      const modifiedOrders = [...mockOrders];
      modifiedOrders[0].title = 'Título Modificado';
      
      // Aplicar rollback
      const rolledBackOrders = applyRollback(snapshot);
      
      expect(rolledBackOrders[0].title).toBe('Pedido 1');
      expect(rolledBackOrders).toHaveLength(3);
    });

    it('deve criar cópias independentes no snapshot', () => {
      const snapshot = createOptimisticSnapshot(mockOrders);
      
      // Modificar order original
      mockOrders[0].title = 'Título Modificado';
      
      // Snapshot deve manter valor original
      expect(snapshot.orders[0].title).toBe('Pedido 1');
    });
  });
}); 