/**
 * Schemas Zod para validação e normalização dos dados da API Tiny
 */

// Importação condicional para lidar com o caso em que o Zod não está instalado
let z: any;
try {
  z = require('zod');
} catch (error) {
  // Fallback para um objeto simples que imita a API básica do Zod
  // quando a biblioteca não está disponível
  z = {
    object: (schema: any) => ({
      parse: (data: any) => data,
      optional: () => ({ default: (val: any) => ({ parse: (data: any) => data }) }),
      nullable: () => ({ optional: () => ({ default: (val: any) => ({ parse: (data: any) => data }) }) }),
      transform: (fn: Function) => ({ parse: (data: any) => data }),
    }),
    string: () => ({
      parse: (val: any) => String(val || ''),
      nullable: () => ({ optional: () => ({ default: (val: any) => ({ parse: (data: any) => String(data || val) }) }) }),
      optional: () => ({ default: (val: any) => ({ parse: (data: any) => String(data || val) }) }),
    }),
    number: () => ({
      parse: (val: any) => Number(val || 0),
      optional: () => ({ default: (val: any) => ({ parse: (data: any) => Number(data || val) }) }),
    }),
    array: (schema: any) => ({
      parse: (data: any) => Array.isArray(data) ? data : [data],
      optional: () => ({ default: (val: any) => ({ parse: (data: any) => data ? (Array.isArray(data) ? data : [data]) : val }) }),
    }),
    union: (schemas: any[]) => ({
      parse: (data: any) => data,
    }),
    preprocess: (preprocessFn: Function, schema: any) => ({
      parse: (data: any) => {
        try {
          return preprocessFn(data);
        } catch (error) {
          return data;
        }
      },
    }),
    enum: (values: any) => ({
      parse: (val: any) => val,
      optional: () => ({ default: (val: any) => ({ parse: (data: any) => data || val }) }),
    }),
  };
}

import { Cliente, Endereco, Pedido, StatusPedido, ItemPedido } from '../../../types/tiny';

/**
 * Schema para validação e normalização de endereço
 */
export const EnderecoSchema = z.object({
  logradouro: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  complemento: z.string().nullable().optional().default(''),
  bairro: z.string().optional().default(''),
  cep: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  uf: z.string().optional().default(''),
  pais: z.string().nullable().optional().default('Brasil'),
});

/**
 * Schema para validação e normalização de cliente
 */
export const ClienteSchema = z.object({
  id: z.string().optional().default(''),
  codigo: z.string().optional().default(''),
  nome: z.string().optional().default(''),
  tipo: z.string().optional().default('F'),
  cpf_cnpj: z.string().nullable().optional().default(''),
  email: z.string().nullable().optional().default(''),
  fone: z.string().nullable().optional().default(''),
  celular: z.string().nullable().optional().default(''),
  data_cadastro: z.string().nullable().optional().default(''),
  data_alteracao: z.string().nullable().optional().default(''),
  situacao: z.string().optional().default('A'),
  observacao: z.string().nullable().optional().default(''),
  endereco: EnderecoSchema.optional().default({}),
});

/**
 * Schema para validação e normalização de item de pedido
 */
export const ItemPedidoSchema = z.object({
  id: z.string().optional().default(''),
  codigo: z.string().optional().default(''),
  descricao: z.string().optional().default(''),
  unidade: z.string().optional().default(''),
  quantidade: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
  valor_unitario: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
  valor_total: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
});

/**
 * Schema para validação e normalização de cliente dentro de pedido
 */
export const ClientePedidoSchema = z.object({
  id: z.string().optional().default(''),
  nome: z.string().optional().default('-'),
  tipo_pessoa: z.string().optional().default(''),
  cpf_cnpj: z.string().nullable().optional().default(''),
});

/**
 * Schema para validação e normalização de pedido
 */
export const PedidoSchema = z.object({
  id: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  numero_ecommerce: z.string().nullable().optional().default(''),
  data_pedido: z.string().optional().default(''),
  data_criacao: z.string().optional().default(''),
  data_modificacao: z.string().optional().default(''),
  cliente: ClientePedidoSchema.optional().default({}),
  situacao: z.string().optional().default('pendente'),
  valor_total: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
  valor_frete: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
  valor_desconto: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      return 0;
    },
    z.number().optional().default(0)
  ),
  itens: z.array(ItemPedidoSchema).optional().default([]),
  forma_pagamento: z.string().nullable().optional().default(''),
  forma_frete: z.string().nullable().optional().default(''),
  observacoes: z.string().nullable().optional().default(''),
});

/**
 * Função para normalizar a resposta de clientes
 * @param data Dados brutos da resposta da API
 * @returns Array de clientes normalizados
 */
export function normalizarRespostaClientes(data: any): Cliente[] {
  try {
    if (!data?.retorno?.contatos?.contato) {
      return [];
    }

    const rawContatos = data.retorno.contatos.contato;
    const contatos = Array.isArray(rawContatos) ? rawContatos : [rawContatos];
    
    return contatos.map(contato => ClienteSchema.parse(contato)) as Cliente[];
  } catch (error) {
    console.error('[Schemas] Erro ao normalizar resposta de clientes:', error);
    return [];
  }
}

/**
 * Função para normalizar a resposta de pedidos
 * @param data Dados brutos da resposta da API
 * @returns Array de pedidos normalizados
 */
export function normalizarRespostaPedidos(data: any): Pedido[] {
  try {
    if (!data?.retorno?.pedidos?.pedido) {
      return [];
    }

    const rawPedidos = data.retorno.pedidos.pedido;
    const pedidos = Array.isArray(rawPedidos) ? rawPedidos : [rawPedidos];
    
    return pedidos.map(pedido => {
      // Normaliza os itens de pedido, se existirem
      let itens: any[] = [];
      if (pedido.itens) {
        const rawItens = pedido.itens.item;
        itens = Array.isArray(rawItens) ? rawItens : rawItens ? [rawItens] : [];
        itens = itens.map(item => ItemPedidoSchema.parse(item)) as ItemPedido[];
      }
      
      // Normaliza o cliente, se existir
      const cliente = ClientePedidoSchema.parse(pedido.cliente || {});
      
      // Normaliza e retorna o pedido completo
      return PedidoSchema.parse({
        ...pedido,
        itens,
        cliente
      }) as Pedido;
    });
  } catch (error) {
    console.error('[Schemas] Erro ao normalizar resposta de pedidos:', error);
    return [];
  }
} 