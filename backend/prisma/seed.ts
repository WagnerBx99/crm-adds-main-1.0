import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário MASTER padrão
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@exemplo.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@exemplo.com',
      passwordHash: adminPassword,
      role: 'MASTER',
      active: true,
      department: 'Administração'
    }
  });
  console.log('✅ Usuário MASTER criado:', admin.email);

  // Criar usuário GESTOR
  const gestorPassword = await bcrypt.hash('gestor123', 10);
  
  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@exemplo.com' },
    update: {},
    create: {
      name: 'Gestor',
      email: 'gestor@exemplo.com',
      passwordHash: gestorPassword,
      role: 'GESTOR',
      active: true,
      department: 'Gestão',
      createdById: admin.id
    }
  });
  console.log('✅ Usuário GESTOR criado:', gestor.email);

  // Criar usuário PRESTADOR
  const prestadorPassword = await bcrypt.hash('prestador123', 10);
  
  const prestador = await prisma.user.upsert({
    where: { email: 'prestador@exemplo.com' },
    update: {},
    create: {
      name: 'Prestador',
      email: 'prestador@exemplo.com',
      passwordHash: prestadorPassword,
      role: 'PRESTADOR',
      active: true,
      department: 'Produção',
      createdById: admin.id
    }
  });
  console.log('✅ Usuário PRESTADOR criado:', prestador.email);

  // Criar alguns clientes de exemplo
  const cliente1 = await prisma.customer.upsert({
    where: { id: 'cliente-exemplo-1' },
    update: {},
    create: {
      id: 'cliente-exemplo-1',
      name: 'Empresa ABC Ltda',
      email: 'contato@empresaabc.com.br',
      phone: '(11) 99999-9999',
      company: 'Empresa ABC',
      personType: 'JURIDICA',
      document: '12.345.678/0001-90',
      city: 'São Paulo',
      state: 'SP',
      address: 'Av. Paulista, 1000',
      neighborhood: 'Bela Vista',
      zipCode: '01310-100'
    }
  });
  console.log('✅ Cliente criado:', cliente1.name);

  const cliente2 = await prisma.customer.upsert({
    where: { id: 'cliente-exemplo-2' },
    update: {},
    create: {
      id: 'cliente-exemplo-2',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      phone: '(11) 98888-8888',
      personType: 'FISICA',
      document: '123.456.789-00',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Rua das Flores, 100',
      neighborhood: 'Centro',
      zipCode: '20040-020'
    }
  });
  console.log('✅ Cliente criado:', cliente2.name);

  // Criar alguns produtos de exemplo
  const produto1 = await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      name: 'Camiseta Personalizada',
      sku: 'PROD-001',
      description: 'Camiseta 100% algodão com estampa personalizada',
      price: 49.90,
      active: true
    }
  });
  console.log('✅ Produto criado:', produto1.name);

  const produto2 = await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {},
    create: {
      name: 'Caneca Personalizada',
      sku: 'PROD-002',
      description: 'Caneca de cerâmica 300ml com impressão sublimática',
      price: 29.90,
      active: true
    }
  });
  console.log('✅ Produto criado:', produto2.name);

  const produto3 = await prisma.product.upsert({
    where: { sku: 'PROD-003' },
    update: {},
    create: {
      name: 'Banner Lona',
      sku: 'PROD-003',
      description: 'Banner em lona 440g com acabamento em ilhós',
      price: 89.90,
      active: true
    }
  });
  console.log('✅ Produto criado:', produto3.name);

  // Criar algumas etiquetas
  const labels = [
    { name: 'Urgente', color: '#ef4444', description: 'Pedidos com prazo urgente' },
    { name: 'VIP', color: '#8b5cf6', description: 'Clientes VIP' },
    { name: 'Aguardando Material', color: '#f59e0b', description: 'Aguardando material para produção' },
    { name: 'Em Revisão', color: '#3b82f6', description: 'Arte em revisão' }
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: {},
      create: label
    });
    console.log('✅ Etiqueta criada:', label.name);
  }

  // Criar um pedido de exemplo
  const pedido = await prisma.order.upsert({
    where: { id: 'pedido-exemplo-1' },
    update: {},
    create: {
      id: 'pedido-exemplo-1',
      title: 'Pedido de Camisetas - Empresa ABC',
      description: '100 camisetas personalizadas para evento corporativo',
      customerId: cliente1.id,
      status: 'FAZER',
      priority: 'normal',
      orderType: 'CORPORATIVO',
      assignedToId: prestador.id,
      history: {
        create: {
          status: 'FAZER',
          comment: 'Pedido criado',
          userId: admin.id
        }
      },
      products: {
        create: {
          productId: produto1.id,
          quantity: 100
        }
      }
    }
  });
  console.log('✅ Pedido criado:', pedido.title);

  // Criar configurações iniciais do sistema
  const configs = [
    { key: 'app_name', value: 'CRM ADDS Brasil' },
    { key: 'app_version', value: '1.0.0' },
    { key: 'notifications_enabled', value: true },
    { key: 'email_notifications', value: false },
    { key: 'default_order_status', value: 'FAZER' }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value }
    });
    console.log('✅ Configuração criada:', config.key);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('   MASTER: admin@exemplo.com / admin123');
  console.log('   GESTOR: gestor@exemplo.com / gestor123');
  console.log('   PRESTADOR: prestador@exemplo.com / prestador123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
