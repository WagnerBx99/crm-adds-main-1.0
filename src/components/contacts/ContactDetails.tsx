import { Customer } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Edit, 
  Trash,
  UserCheck
} from 'lucide-react';

interface ContactDetailsProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function ContactDetails({ customer, onEdit, onDelete }: ContactDetailsProps) {
  // Função para formatar a data
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-[#0b4269]">{customer.name}</CardTitle>
            <CardDescription>{customer.company}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(customer)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(customer)}
              className="gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2 text-[#0b4269]">
              <User className="h-5 w-5" />
              Informações Básicas
            </h3>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p>{customer.company}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <UserCheck className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo de Pessoa</p>
                  <p>{customer.personType || 'Não informado'}</p>
                </div>
              </div>
              
              {customer.document && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {customer.personType === 'Física' ? 'CPF' : 'CNPJ'}
                    </p>
                    <p>{customer.document}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <a 
                    href={`mailto:${customer.email}`} 
                    className="text-[#21add6] hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <a 
                    href={`tel:${customer.phone}`} 
                    className="text-[#21add6] hover:underline"
                  >
                    {customer.phone}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Cadastrado em</p>
                  <p>{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2 text-[#0b4269]">
              <MapPin className="h-5 w-5" />
              Endereço
            </h3>
            <Separator />
            
            {customer.address || customer.city ? (
              <div className="space-y-3">
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Logradouro</p>
                      <p>
                        {customer.address}
                        {customer.number && `, ${customer.number}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {customer.neighborhood && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 opacity-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Bairro</p>
                      <p>{customer.neighborhood}</p>
                    </div>
                  </div>
                )}
                
                {(customer.city || customer.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 opacity-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cidade/Estado</p>
                      <p>
                        {customer.city}
                        {customer.city && customer.state && ' - '}
                        {customer.state}
                      </p>
                    </div>
                  </div>
                )}
                
                {customer.zipCode && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 opacity-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">CEP</p>
                      <p>{customer.zipCode}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                <p>Nenhum endereço cadastrado.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 