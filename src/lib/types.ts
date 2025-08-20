/**
 * Definições de tipos para a aplicação
 */

// Interface para contatos
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  personType: "natural" | "legal"; // Pessoa física ou jurídica
  document: string; // CPF ou CNPJ
  zipCode: string;
  city: string;
  state: string;
  address: string;
  neighborhood: string;
  number: string;
  createdAt: string;
  updatedAt: string;
}

// Adicione outros tipos conforme necessário 