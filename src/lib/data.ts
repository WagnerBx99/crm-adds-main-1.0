import { Customer, Order, Status, KanbanColumn, Metric, Priority, Checklist, ChecklistItem, Comment, Attachment, Label } from '@/types';

// Status color mapping
export const statusColors: Record<Status, string> = {
  FAZER: 'bg-yellow-500',
  AJUSTE: 'bg-orange-500',
  APROVACAO: 'bg-blue-500',
  AGUARDANDO_APROVACAO: 'bg-purple-500',
  APROVADO: 'bg-green-500',
  ARTE_APROVADA: 'bg-emerald-500',
  PRODUCAO: 'bg-indigo-500',
  EXPEDICAO: 'bg-slate-500',
  FINALIZADO: 'bg-gray-600',
  ENTREGUE: 'bg-teal-500',
  FATURADO: 'bg-cyan-500',
  ARQUIVADO: 'bg-gray-400',
};

// Status display names
export const statusNames: Record<Status, string> = {
  FAZER: 'Fazer',
  AJUSTE: 'Ajuste',
  APROVACAO: 'Aprovação',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  APROVADO: 'Aprovado',
  ARTE_APROVADA: 'Arte Aprovada',
  PRODUCAO: 'Produção',
  EXPEDICAO: 'Expedição',
  FINALIZADO: 'Finalizado',
  ENTREGUE: 'Entregue',
  FATURADO: 'Faturado',
  ARQUIVADO: 'Arquivado',
};

// Label color mapping
export const labelColors: Record<Label, string> = {
  BOLETO: 'bg-[#f07d00] text-white',
  AGUARDANDO_PAGAMENTO: 'bg-yellow-500 text-white',
  PEDIDO_CANCELADO: 'bg-red-500 text-white',
  APROV_AGUARDANDO_PAGAMENTO: 'bg-purple-500 text-white',
  AMOSTRAS: 'bg-blue-500 text-white',
  PAGO: 'bg-green-500 text-white',
  ORCAMENTO_PUBLICO: 'bg-purple-50 text-purple-700 border-purple-200',
};

// Label display names
export const labelNames: Record<Label, string> = {
  BOLETO: 'Boleto',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PEDIDO_CANCELADO: 'Pedido cancelado',
  APROV_AGUARDANDO_PAGAMENTO: 'Aprov. Aguardando pagamento',
  AMOSTRAS: 'Amostras',
  PAGO: 'Pago',
  ORCAMENTO_PUBLICO: 'Orçamento Público',
};

// Sample customers
export const customers: Customer[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com.br',
    phone: '(11) 98765-4321',
    company: 'Empresa ABC',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria.oliveira@xyztech.com.br',
    phone: '(21) 91234-5678',
    company: 'XYZ Tech',
    createdAt: new Date('2023-02-20'),
  },
  {
    id: '3',
    name: 'Carlos Santos',
    email: 'carlos.santos@inovacomp.com.br',
    phone: '(31) 99876-5432',
    company: 'Inova Computação',
    createdAt: new Date('2023-03-10'),
  },
  {
    id: '4',
    name: 'Reability Odontologia',
    email: 'contato@reabilityodontologia.com.br',
    phone: '(84) 3422-1234',
    company: 'Reability Odontologia',
    createdAt: new Date('2023-04-05'),
    personType: 'Jurídica',
    document: '08.242.327/0001-81',
    zipCode: '59.612-012',
    city: 'Mossoró',
    state: 'RN',
    address: 'Rua Doutor João Marcelino',
    neighborhood: 'Nova Betânia',
    number: '710',
  },
  {
    id: '5',
    name: 'Pedro Costa',
    email: 'pedro.costa@digitalware.com.br',
    phone: '(51) 96543-2109',
    company: 'DigitalWare',
    createdAt: new Date('2023-05-25'),
  },
];

// Sample orders
export const orders: Order[] = [
  {
    id: '1',
    title: 'Personalização de Canecas - Evento Anual',
    description: '200 canecas personalizadas com logo da empresa para evento corporativo',
    customer: customers[0],
    status: 'FAZER',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    dueDate: new Date('2023-06-20'),
    assignedTo: 'Designer 1',
    orderType: 'CORPORATIVO',
    products: [
      { id: '1-1', name: 'Caneca Personalizada 325ml', quantity: 200 }
    ],
    comments: [
      {
        id: 'c1-1',
        text: 'Cliente solicitou urgência no prazo de entrega',
        createdAt: new Date('2023-06-01'),
        user: 'Atendimento'
      }
    ],
    attachments: [
      {
        id: 'a1-1',
        name: 'logo-empresa.png',
        url: 'https://placehold.co/800x600',
        type: 'image',
        createdAt: new Date('2023-06-01'),
        uploadedBy: 'Cliente'
      }
    ],
    history: [
      {
        id: '1-1',
        date: new Date('2023-06-01'),
        status: 'FAZER',
        user: 'Sistema',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    priority: 'normal',
  },
  {
    id: '2',
    title: 'Camisetas Equipe Desenvolvimento',
    description: '50 camisetas com estampa personalizada para time de desenvolvimento',
    customer: customers[1],
    status: 'AJUSTE',
    createdAt: new Date('2023-05-28'),
    updatedAt: new Date('2023-06-02'),
    dueDate: new Date('2023-06-15'),
    assignedTo: 'Designer 2',
    orderType: 'INTERNO',
    products: [
      { id: '2-1', name: 'Camiseta Baby Look', quantity: 15 },
      { id: '2-2', name: 'Camiseta Tradicional', quantity: 35 }
    ],
    comments: [
      {
        id: 'c2-1',
        text: 'Cliente solicitou ajuste nas cores da logo',
        createdAt: new Date('2023-06-02'),
        user: 'Atendimento'
      },
      {
        id: 'c2-2',
        text: 'Nova versão da arte será enviada em 24h',
        createdAt: new Date('2023-06-02'),
        user: 'Designer 2'
      }
    ],
    attachments: [
      {
        id: 'a2-1',
        name: 'briefing-camisetas.pdf',
        url: 'https://placehold.co/600x800',
        type: 'pdf',
        createdAt: new Date('2023-05-28'),
        uploadedBy: 'Cliente'
      }
    ],
    artworkImages: [
      {
        id: 'art2-1',
        name: 'arte-camiseta-v1.jpg',
        url: 'https://placehold.co/800x600',
        status: 'adjustment_requested',
        createdAt: new Date('2023-06-01'),
        uploadedBy: 'Designer 2'
      }
    ],
    history: [
      {
        id: '2-1',
        date: new Date('2023-05-28'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '2-2',
        date: new Date('2023-06-01'),
        status: 'APROVACAO',
        user: 'Designer 2',
      },
      {
        id: '2-3',
        date: new Date('2023-06-02'),
        status: 'AJUSTE',
        comment: 'Cliente solicitou ajuste nas cores da logo',
        user: 'Atendimento',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    priority: 'normal',
  },
  {
    id: '3',
    title: 'Brindes Corporativos - Copos Térmicos',
    description: '100 copos térmicos com gravação a laser do logo',
    customer: customers[2],
    status: 'APROVACAO',
    createdAt: new Date('2023-05-25'),
    updatedAt: new Date('2023-06-03'),
    dueDate: new Date('2023-06-18'),
    assignedTo: 'Designer 1',
    orderType: 'PROMOCIONAL',
    products: [
      { id: '3-1', name: 'Copo Térmico Inox 450ml', quantity: 100 }
    ],
    comments: [
      {
        id: 'c3-1',
        text: 'Arte pronta para aprovação do cliente',
        createdAt: new Date('2023-06-03'),
        user: 'Designer 1'
      }
    ],
    attachments: [
      {
        id: 'a3-1',
        name: 'especificacoes-copos.pdf',
        url: 'https://placehold.co/600x800',
        type: 'pdf',
        createdAt: new Date('2023-05-25'),
        uploadedBy: 'Cliente'
      },
      {
        id: 'a3-2',
        name: 'referencias-gravacao.jpg',
        url: 'https://placehold.co/800x600',
        type: 'image',
        createdAt: new Date('2023-05-26'),
        uploadedBy: 'Designer 1'
      }
    ],
    artworkImages: [
      {
        id: 'art3-1',
        name: 'arte-gravacao-laser.ai',
        url: 'https://placehold.co/800x600',
        status: 'pending',
        createdAt: new Date('2023-06-03'),
        uploadedBy: 'Designer 1'
      }
    ],
    history: [
      {
        id: '3-1',
        date: new Date('2023-05-25'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '3-2',
        date: new Date('2023-05-30'),
        status: 'APROVACAO',
        user: 'Designer 1',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    priority: 'normal',
  },
  {
    id: '4',
    title: 'Calendários Personalizados 2024',
    description: '500 calendários de mesa personalizados para fim de ano',
    customer: customers[3],
    status: 'AGUARDANDO_APROVACAO',
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2023-06-04'),
    dueDate: new Date('2023-07-15'),
    assignedTo: 'Designer 3',
    orderType: 'ORCAMENTO_PUBLICO',
    products: [
      { id: '4-1', name: 'Calendário de Mesa 2024', quantity: 500 }
    ],
    comments: [
      {
        id: 'c4-1',
        text: 'Link de aprovação enviado ao cliente',
        createdAt: new Date('2023-06-04'),
        user: 'Atendimento'
      }
    ],
    attachments: [
      {
        id: 'a4-1',
        name: 'edital-licitacao.pdf',
        url: 'https://placehold.co/600x800',
        type: 'pdf',
        createdAt: new Date('2023-05-20'),
        uploadedBy: 'Cliente'
      }
    ],
    artworkImages: [
      {
        id: 'art4-1',
        name: 'calendario-2024-layout.pdf',
        url: 'https://placehold.co/800x600',
        status: 'pending',
        createdAt: new Date('2023-06-02'),
        uploadedBy: 'Designer 3'
      }
    ],
    history: [
      {
        id: '4-1',
        date: new Date('2023-05-20'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '4-2',
        date: new Date('2023-05-26'),
        status: 'APROVACAO',
        user: 'Designer 3',
      },
      {
        id: '4-3',
        date: new Date('2023-06-04'),
        status: 'AGUARDANDO_APROVACAO',
        user: 'Atendimento',
        comment: 'Link de aprovação enviado ao cliente',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    approvalLink: 'https://approval.addscrm.com/pedido/4',
    priority: 'normal',
  },
  {
    id: '5',
    title: 'Canetas Executivas Personalizadas',
    description: '50 canetas executivas personalizadas para diretoria',
    customer: customers[4],
    status: 'APROVADO',
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-06-05'),
    dueDate: new Date('2023-06-10'),
    assignedTo: 'Designer 2',
    orderType: 'RUSH',
    products: [
      { id: '5-1', name: 'Caneta Executiva Metal', quantity: 50 }
    ],
    comments: [
      {
        id: 'c5-1',
        text: 'Arte aprovada sem alterações',
        createdAt: new Date('2023-06-05'),
        user: 'Cliente'
      }
    ],
    attachments: [
      {
        id: 'a5-1',
        name: 'logo-diretoria.svg',
        url: 'https://placehold.co/400x400',
        type: 'image',
        createdAt: new Date('2023-05-15'),
        uploadedBy: 'Cliente'
      }
    ],
    artworkImages: [
      {
        id: 'art5-1',
        name: 'gravacao-caneta.ai',
        url: 'https://placehold.co/800x600',
        status: 'approved',
        createdAt: new Date('2023-05-20'),
        uploadedBy: 'Designer 2'
      }
    ],
    history: [
      {
        id: '5-1',
        date: new Date('2023-05-15'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '5-2',
        date: new Date('2023-05-18'),
        status: 'APROVACAO',
        user: 'Designer 2',
      },
      {
        id: '5-3',
        date: new Date('2023-05-25'),
        status: 'AGUARDANDO_APROVACAO',
        user: 'Atendimento',
        comment: 'Link de aprovação enviado ao cliente',
      },
      {
        id: '5-4',
        date: new Date('2023-06-05'),
        status: 'APROVADO',
        user: 'Cliente',
        comment: 'Arte aprovada sem alterações',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    approvalLink: 'https://approval.addscrm.com/pedido/5',
    priority: 'normal',
  },
  {
    id: '6',
    title: 'Cadernos Corporativos Personalizados',
    description: '150 cadernos com capa personalizada para convenção',
    customer: customers[0],
    status: 'PRODUCAO',
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-06-06'),
    dueDate: new Date('2023-06-12'),
    assignedTo: 'Designer 1',
    orderType: 'PERSONALIZADO',
    products: [
      { id: '6-1', name: 'Caderno Capa Dura A5', quantity: 150 }
    ],
    comments: [
      {
        id: 'c6-1',
        text: 'Iniciada produção dos itens',
        createdAt: new Date('2023-06-06'),
        user: 'Produção'
      },
      {
        id: 'c6-2',
        text: 'Prazo de entrega mantido conforme cronograma',
        createdAt: new Date('2023-06-06'),
        user: 'Gerente de Produção'
      }
    ],
    attachments: [
      {
        id: 'a6-1',
        name: 'briefing-cadernos.pdf',
        url: 'https://placehold.co/600x800',
        type: 'pdf',
        createdAt: new Date('2023-05-10'),
        uploadedBy: 'Cliente'
      },
      {
        id: 'a6-2',
        name: 'mockup-aprovado.jpg',
        url: 'https://placehold.co/800x600',
        type: 'image',
        createdAt: new Date('2023-05-22'),
        uploadedBy: 'Designer 1'
      }
    ],
    artworkImages: [
      {
        id: 'art6-1',
        name: 'capa-caderno-final.pdf',
        url: 'https://placehold.co/800x600',
        status: 'approved',
        createdAt: new Date('2023-05-20'),
        uploadedBy: 'Designer 1'
      }
    ],
    history: [
      {
        id: '6-1',
        date: new Date('2023-05-10'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '6-2',
        date: new Date('2023-05-13'),
        status: 'APROVACAO',
        user: 'Designer 1',
      },
      {
        id: '6-3',
        date: new Date('2023-05-20'),
        status: 'AGUARDANDO_APROVACAO',
        user: 'Atendimento',
        comment: 'Link de aprovação enviado ao cliente',
      },
      {
        id: '6-4',
        date: new Date('2023-05-22'),
        status: 'APROVADO',
        user: 'Cliente',
        comment: 'Arte aprovada sem alterações',
      },
      {
        id: '6-5',
        date: new Date('2023-06-06'),
        status: 'PRODUCAO',
        user: 'Produção',
        comment: 'Iniciada produção dos itens',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    approvalLink: 'https://approval.addscrm.com/pedido/6',
    priority: 'normal',
  },
  {
    id: '7',
    title: 'Chaveiros Personalizados',
    description: '300 chaveiros com logo em baixo relevo',
    customer: customers[2],
    status: 'EXPEDICAO',
    createdAt: new Date('2023-05-05'),
    updatedAt: new Date('2023-06-07'),
    dueDate: new Date('2023-06-08'),
    assignedTo: 'Designer 3',
    history: [
      {
        id: '7-1',
        date: new Date('2023-05-05'),
        status: 'FAZER',
        user: 'Sistema',
      },
      {
        id: '7-2',
        date: new Date('2023-05-07'),
        status: 'APROVACAO',
        user: 'Designer 3',
      },
      {
        id: '7-3',
        date: new Date('2023-05-10'),
        status: 'AGUARDANDO_APROVACAO',
        user: 'Atendimento',
        comment: 'Link de aprovação enviado ao cliente',
      },
      {
        id: '7-4',
        date: new Date('2023-05-11'),
        status: 'APROVADO',
        user: 'Cliente',
        comment: 'Arte aprovada sem alterações',
      },
      {
        id: '7-5',
        date: new Date('2023-05-15'),
        status: 'PRODUCAO',
        user: 'Produção',
        comment: 'Iniciada produção dos itens',
      },
      {
        id: '7-6',
        date: new Date('2023-06-07'),
        status: 'EXPEDICAO',
        user: 'Produção',
        comment: 'Produção finalizada, pedido enviado para expedição',
      },
    ],
    artworkUrl: 'https://placehold.co/600x400',
    approvalLink: 'https://approval.addscrm.com/pedido/7',
    priority: 'normal',
  },
];

// Format orders into kanban columns
export const kanbanColumns: KanbanColumn[] = [
  {
    id: 'FAZER',
    title: 'Fazer',
    orders: orders.filter(order => order.status === 'FAZER'),
  },
  {
    id: 'AJUSTE',
    title: 'Ajuste',
    orders: orders.filter(order => order.status === 'AJUSTE'),
  },
  {
    id: 'APROVACAO',
    title: 'Aprovação',
    orders: orders.filter(order => order.status === 'APROVACAO'),
  },
  {
    id: 'AGUARDANDO_APROVACAO',
    title: 'Aguardando Aprovação',
    orders: orders.filter(order => order.status === 'AGUARDANDO_APROVACAO'),
  },
  {
    id: 'APROVADO',
    title: 'Aprovado',
    orders: orders.filter(order => order.status === 'APROVADO'),
  },
  {
    id: 'ARTE_APROVADA',
    title: 'Arte Aprovada',
    orders: orders.filter(order => order.status === 'ARTE_APROVADA'),
  },
  {
    id: 'PRODUCAO',
    title: 'Produção',
    orders: orders.filter(order => order.status === 'PRODUCAO'),
  },
  {
    id: 'EXPEDICAO',
    title: 'Expedição',
    orders: orders.filter(order => order.status === 'EXPEDICAO'),
  },
  // Colunas adicionais para garantir overflow horizontal em telas menores
  {
    id: 'FINALIZADO',
    title: 'Finalizado',
    orders: orders.filter(order => order.status === 'FINALIZADO'),
  },
  {
    id: 'ENTREGUE',
    title: 'Entregue',
    orders: orders.filter(order => order.status === 'ENTREGUE'),
  },
  {
    id: 'FATURADO',
    title: 'Faturado',
    orders: orders.filter(order => order.status === 'FATURADO'),
  },
  {
    id: 'ARQUIVADO',
    title: 'Arquivado',
    orders: orders.filter(order => order.status === 'ARQUIVADO'),
  },
];

// Dashboard metrics
export const metrics: Metric[] = [
  {
    id: '1',
    title: 'Total de Pedidos',
    value: orders.length,
    change: 12,
    changeType: 'positive',
    icon: 'package',
  },
  {
    id: '2',
    title: 'Aprovação na Primeira Tentativa',
    value: '68%',
    change: 5,
    changeType: 'positive',
    icon: 'check-circle',
  },
  {
    id: '3',
    title: 'Pedidos em Produção',
    value: orders.filter(order => order.status === 'PRODUCAO').length,
    change: 2,
    changeType: 'positive',
    icon: 'settings',
  },
  {
    id: '4',
    title: 'Tempo Médio de Aprovação',
    value: '2.5 dias',
    change: -0.5,
    changeType: 'positive',
    icon: 'clock',
  },
];

// Function to update an order's status
export const updateOrderStatus = (orderId: string, newStatus: Status): Order[] => {
  return orders.map(order => {
    if (order.id === orderId) {
      const updatedOrder = {
        ...order,
        status: newStatus,
        updatedAt: new Date(),
        history: [
          ...order.history,
          {
            id: `${order.id}-${order.history.length + 1}`,
            date: new Date(),
            status: newStatus,
            user: 'Usuário atual', // In a real app, this would come from the authenticated user
          },
        ],
      };
      return updatedOrder;
    }
    return order;
  });
};

// Function to add a comment to an order
export const addOrderComment = (orderId: string, comment: string): Order[] => {
  return orders.map(order => {
    if (order.id === orderId) {
      const updatedOrder = {
        ...order,
        updatedAt: new Date(),
        comments: [
          ...(order.comments || []),
          {
            id: `comment-${Date.now()}`,
            text: comment,
            createdAt: new Date(),
            user: 'Usuário atual', // In a real app, this would come from the authenticated user
          }
        ],
        history: [
          ...order.history,
          {
            id: `${order.id}-${order.history.length + 1}`,
            date: new Date(),
            status: order.status,
            comment,
            user: 'Usuário atual', // In a real app, this would come from the authenticated user
          },
        ],
      };
      return updatedOrder;
    }
    return order;
  });
};

// Function to update an order
export const updateOrder = (orderId: string, updatedData: Partial<Order>): Order[] => {
  return orders.map(order => {
    if (order.id === orderId) {
      // Criar uma entrada de histórico para a atualização
      let historyEntry = null;
      
      // Verificar quais campos foram atualizados para criar uma entrada de histórico adequada
      if (updatedData.status) {
        // Se o status foi alterado, já é tratado pela função updateOrderStatus
        // Não precisamos criar uma entrada de histórico aqui
      } else if (updatedData.priority) {
        // Alteração de prioridade
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Prioridade alterada para ${
            updatedData.priority === 'high' ? 'Alta' : 'Normal'
          }`,
          user: 'Usuário atual', // Em uma aplicação real, viria do usuário autenticado
        };
      } else if (updatedData.title) {
        // Alteração de título
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Título atualizado para "${updatedData.title}"`,
          user: 'Usuário atual',
        };
      } else if (updatedData.dueDate) {
        // Alteração de data de entrega
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Data de entrega atualizada para ${new Date(updatedData.dueDate).toLocaleDateString('pt-BR')}`,
          user: 'Usuário atual',
        };
      } else if (updatedData.products) {
        // Alteração de produtos
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Lista de produtos atualizada`,
          user: 'Usuário atual',
        };
      } else if (updatedData.labels) {
        // Alteração de etiquetas
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Etiquetas do pedido atualizadas`,
          user: 'Usuário atual',
        };
      } else if (updatedData.personalizationDetails) {
        // Alteração de detalhes de personalização
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Detalhes de personalização atualizados`,
          user: 'Usuário atual',
        };
      } else if (updatedData.customerDetails) {
        // Alteração de detalhes do cliente
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Detalhes do cliente atualizados`,
          user: 'Usuário atual',
        };
      } else if (updatedData.artworkImages) {
        // Adição ou remoção de imagens de arte
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: `Imagens de arte atualizadas`,
          user: 'Usuário atual',
        };
      } else if (updatedData.artworkComments) {
        // Adição ou atualização de comentários de arte
        const lastComment = updatedData.artworkComments[updatedData.artworkComments.length - 1];
        const isApproval = lastComment.approved;
        
        historyEntry = {
          id: `${order.id}-${order.history.length + 1}`,
          date: new Date(),
          status: order.status,
          comment: isApproval 
            ? `Comentário de arte aprovado` 
            : `Novo comentário de arte adicionado`,
          user: 'Usuário atual',
        };
      }
      
      const updatedOrder = {
        ...order,
        ...updatedData,
        updatedAt: new Date(),
        // Adicionar a nova entrada ao histórico, se existir
        history: historyEntry 
          ? [...order.history, historyEntry] 
          : order.history
      };
      
      return updatedOrder;
    }
    return order;
  });
};

// Add a new order
export const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Order => {
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    history: [
      {
        id: `history-${Date.now()}`,
        date: new Date(),
        status: orderData.status,
        user: 'Sistema',
        comment: 'Pedido criado via interface pública'
      }
    ],
    ...orderData
  };
  
  // Add to orders array for persistence
  orders.push(newOrder);
  
  // Add to appropriate kanban column
  const columnIndex = kanbanColumns.findIndex(column => column.id === orderData.status);
  if (columnIndex !== -1) {
    kanbanColumns[columnIndex].orders.unshift(newOrder);
  }
  
  // Return the new order so components can update their state
  return newOrder;
};

// Sistema de eventos para notificar mudanças no kanban
type KanbanEventCallback = (order: Order) => void;
const kanbanEventListeners: KanbanEventCallback[] = [];

export const onKanbanOrderAdded = (callback: KanbanEventCallback) => {
  kanbanEventListeners.push(callback);
  
  // Retorna função para remover o listener
  return () => {
    const index = kanbanEventListeners.indexOf(callback);
    if (index > -1) {
      kanbanEventListeners.splice(index, 1);
    }
  };
};

const notifyKanbanOrderAdded = (order: Order) => {
  kanbanEventListeners.forEach(callback => callback(order));
};

// Função específica para adicionar orçamentos públicos
export const addPublicQuoteOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Order => {
  const newOrder = addOrder(orderData);
  
  // Notificar ouvintes sobre novo pedido
  notifyKanbanOrderAdded(newOrder);
  
  return newOrder;
};

export const orderTypeColors = {
  'ORCAMENTO_PUBLICO': 'bg-purple-50 text-purple-700 border-purple-200',
  'INTERNO': 'bg-blue-50 text-blue-700 border-blue-200',
  'PERSONALIZADO': 'bg-orange-50 text-orange-700 border-orange-200',
  'RUSH': 'bg-red-50 text-red-700 border-red-200',
  'PROMOCIONAL': 'bg-green-50 text-green-700 border-green-200',
  'CORPORATIVO': 'bg-gray-50 text-gray-700 border-gray-200'
} as const;

export const orderTypeNames = {
  'ORCAMENTO_PUBLICO': 'Orçamento Público',
  'INTERNO': 'Interno',
  'PERSONALIZADO': 'Personalizado',
  'RUSH': 'Rush',
  'PROMOCIONAL': 'Promocional',
  'CORPORATIVO': 'Corporativo'
} as const;

// Define prioridade aleatória baseada na urgência
const priority: Priority = Math.random() > 0.7 ? 'high' : 'normal';

// Dados mockados para teste
export const mockOrders: Order[] = [
  {
    id: '1',
    title: 'Pedido Site E-commerce',
    customer: { 
      id: '1',
      name: 'João Silva', 
      email: 'joao@email.com',
      phone: '(11) 99999-1111',
      company: 'Silva Tech',
      createdAt: new Date('2024-01-01')
    },
    status: 'FAZER',
    priority: 'high',
    dueDate: new Date('2024-12-30'),
    labels: ['PAGO', 'ORCAMENTO_PUBLICO'],
    assignedTo: 'Ana Costa',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
    history: [],
    description: 'Desenvolvimento de site e-commerce completo com integração de pagamento'
  },
  {
    id: '2',
    title: 'App Mobile Delivery',
    customer: { 
      id: '2',
      name: 'Maria Santos', 
      email: 'maria@empresa.com',
      phone: '(11) 99999-2222',
      company: 'Santos Delivery',
      createdAt: new Date('2024-01-01')
    },
    status: 'AJUSTE',
    priority: 'high',
    dueDate: new Date('2024-12-28'),
    labels: ['AGUARDANDO_PAGAMENTO'],
    assignedTo: 'Carlos Lima',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-11-15'),
    history: [],
    description: 'Aplicativo mobile para delivery com GPS e notificações push'
  },
  {
    id: '3',
    title: 'Sistema CRM Vendas',
    customer: { 
      id: '3',
      name: 'Tech Corp', 
      email: 'contato@techcorp.com',
      phone: '(11) 99999-3333',
      company: 'Tech Corp Ltda',
      createdAt: new Date('2024-01-01')
    },
    status: 'APROVACAO',
    priority: 'normal',
    dueDate: new Date('2024-12-25'),
    labels: ['BOLETO'],
    assignedTo: 'Bruno Oliveira',
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-11-20'),
    history: [],
    description: 'CRM personalizado para gestão de vendas e relacionamento com clientes'
  },
  {
    id: '4',
    title: 'Landing Page Produto',
    customer: { 
      id: '4',
      name: 'StartUp XYZ', 
      email: 'hello@startupxyz.com',
      phone: '(11) 99999-4444',
      company: 'StartUp XYZ',
      createdAt: new Date('2024-01-01')
    },
    status: 'AGUARDANDO_APROVACAO',
    priority: 'normal',
    dueDate: new Date('2024-12-22'),
    labels: ['PAGO'],
    assignedTo: 'Ana Costa',
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-05'),
    history: [],
    description: 'Landing page responsiva para lançamento de novo produto'
  },
  {
    id: '5',
    title: 'Dashboard Analytics',
    customer: { 
      id: '5',
      name: 'Data Solutions', 
      email: 'admin@datasolutions.com',
      phone: '(11) 99999-5555',
      company: 'Data Solutions',
      createdAt: new Date('2024-01-01')
    },
    status: 'APROVADO',
    priority: 'normal',
    dueDate: new Date('2024-12-20'),
    labels: ['ORCAMENTO_PUBLICO'],
    assignedTo: 'Carlos Lima',
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-11-25'),
    history: [],
    description: 'Dashboard para visualização de dados e métricas em tempo real'
  },
  {
    id: '6',
    title: 'API REST Integração',
    customer: { 
      id: '6',
      name: 'Fintech ABC', 
      email: 'dev@fintechabc.com',
      phone: '(11) 99999-6666',
      company: 'Fintech ABC',
      createdAt: new Date('2024-01-01')
    },
    status: 'FAZER',
    priority: 'high',
    dueDate: new Date('2024-12-18'),
    labels: ['BOLETO', 'AGUARDANDO_PAGAMENTO'],
    assignedTo: 'Bruno Oliveira',
    createdAt: new Date('2024-12-02'),
    updatedAt: new Date('2024-12-02'),
    history: [],
    description: 'API REST para integração com sistemas bancários e financeiros'
  },
  {
    id: '7',
    title: 'Sistema Estoque',
    customer: { 
      id: '7',
      name: 'Loja Premium', 
      email: 'gestao@lojapremium.com',
      phone: '(11) 99999-7777',
      company: 'Loja Premium',
      createdAt: new Date('2024-01-01')
    },
    status: 'AJUSTE',
    priority: 'normal',
    dueDate: new Date('2024-12-16'),
    labels: ['PAGO'],
    assignedTo: 'Ana Costa',
    createdAt: new Date('2024-11-18'),
    updatedAt: new Date('2024-11-18'),
    history: [],
    description: 'Sistema de controle de estoque com relatórios automáticos'
  },
  {
    id: '8',
    title: 'Portal Colaborador',
    customer: { 
      id: '8',
      name: 'Empresa Global', 
      email: 'rh@empresaglobal.com',
      phone: '(11) 99999-8888',
      company: 'Empresa Global',
      createdAt: new Date('2024-01-01')
    },
    status: 'APROVACAO',
    priority: 'normal',
    dueDate: new Date('2024-12-14'),
    labels: ['ORCAMENTO_PUBLICO', 'AMOSTRAS'],
    assignedTo: 'Carlos Lima',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-10'),
    history: [],
    description: 'Portal interno para colaboradores com módulos de RH e benefícios'
  }
];
