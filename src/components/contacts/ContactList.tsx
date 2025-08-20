import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { Search, UserPlus, MoreHorizontal, Mail, Phone, RefreshCw, AlertTriangle, Eye, Trash, Edit, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import ContactForm from './ContactForm';
import ContactDetails from './ContactDetails';
import contactService from '@/lib/services/contactService';
import { ImportContactsButton } from './ImportContactsButton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ContactList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: Date | null;
    status: 'success' | 'error' | 'idle';
    message?: string;
  }>({
    lastSync: null,
    status: 'idle',
  });
  
  const { toast } = useToast();
  
  // Carregar contatos ao inicializar o componente
  useEffect(() => {
    loadContacts();
  }, []);
  
  // Filtrar contatos quando a busca ou a lista de contatos mudar
  useEffect(() => {
    try {
      filterContacts(searchQuery);
    } catch (err) {
      console.error('Erro ao filtrar contatos:', err);
      setError('Erro ao filtrar contatos. Por favor, tente novamente.');
    }
  }, [searchQuery, customers]);
  
  // Função para carregar contatos
  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contactService.getContacts();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      setError('Não foi possível carregar a lista de contatos. Tente novamente mais tarde.');
      toast({
        title: 'Erro ao carregar contatos',
        description: 'Não foi possível carregar a lista de contatos. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para filtrar contatos
  const filterContacts = (query: string) => {
    if (query.trim() === '') {
      setFilteredCustomers(customers);
      return;
    }
    
    const queryLower = query.toLowerCase();
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(queryLower) ||
      customer.email.toLowerCase().includes(queryLower) ||
      customer.phone.includes(query) ||
      customer.company.toLowerCase().includes(queryLower)
    );
    
    setFilteredCustomers(filtered);
  };
  
  // Função para sincronizar contatos com a Tiny ERP
  const syncContacts = async () => {
    setIsSyncing(true);
    setSyncStatus({
      ...syncStatus,
      status: 'idle',
    });
    
    try {
      const result = await contactService.syncContactsWithTiny();
      
      setSyncStatus({
        lastSync: new Date(),
        status: 'success',
        message: `Sincronização concluída: ${result.added} adicionados, ${result.updated} atualizados, ${result.failed} falhas`,
      });
      
      // Recarregar a lista de contatos
      await loadContacts();
      
      toast({
        title: 'Sincronização concluída',
        description: `${result.added} contatos adicionados, ${result.updated} atualizados, ${result.failed} falhas`,
        variant: result.failed > 0 ? 'default' : 'default',
      });
    } catch (error) {
      console.error('Erro ao sincronizar contatos:', error);
      
      setSyncStatus({
        lastSync: new Date(),
        status: 'error',
        message: 'Erro ao sincronizar contatos com a Tiny ERP',
      });
      
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os contatos com a Tiny ERP. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Função para abrir o formulário de novo contato
  const handleNewContact = () => {
    setSelectedContact(null);
    setIsContactDialogOpen(true);
  };
  
  // Função para abrir o formulário de edição de contato
  const handleEditContact = (contact: Customer) => {
    setSelectedContact(contact);
    setIsContactDialogOpen(true);
    setIsDetailsDialogOpen(false);
  };
  
  // Função para abrir a visualização de detalhes do contato
  const handleViewDetails = (contact: Customer) => {
    setSelectedContact(contact);
    setIsDetailsDialogOpen(true);
  };
  
  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteConfirmation = (contact: Customer) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
    setIsDetailsDialogOpen(false);
  };
  
  // Função para excluir um contato
  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    
    try {
      await contactService.deleteContact(selectedContact.id);
      
      toast({
        title: 'Contato excluído',
        description: 'O contato foi excluído com sucesso.',
      });
      
      // Recarregar a lista de contatos
      await loadContacts();
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      
      toast({
        title: 'Erro ao excluir contato',
        description: 'Não foi possível excluir o contato. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Função para lidar com o sucesso do formulário
  const handleFormSuccess = async (customer: Customer) => {
    setIsContactDialogOpen(false);
    
    toast({
      title: selectedContact ? 'Contato atualizado' : 'Contato criado',
      description: selectedContact 
        ? 'O contato foi atualizado com sucesso.' 
        : 'O contato foi criado com sucesso.',
    });
    
    // Recarregar a lista de contatos
    await loadContacts();
  };
  
  // Função para formatar a data
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  // Renderizar esqueletos durante o carregamento
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
        <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadContacts}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </Alert>
      )}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-[#0b4269]">Contatos</h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar contatos..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={syncContacts}
                  disabled={isSyncing}
                  className={syncStatus.status === 'error' ? 'text-red-500 border-red-200' : ''}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : syncStatus.status === 'error' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSyncing 
                  ? 'Sincronizando contatos...' 
                  : syncStatus.status === 'error' 
                    ? 'Erro na última sincronização. Clique para tentar novamente.' 
                    : syncStatus.lastSync 
                      ? `Última sincronização: ${formatDate(syncStatus.lastSync)}` 
                      : 'Sincronizar contatos com a Tiny ERP'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <ImportContactsButton />
          
          <Button 
            onClick={handleNewContact}
            className="gap-1 bg-[#21add6] hover:bg-[#1c9abf]"
          >
            <UserPlus size={16} />
            Novo Contato
          </Button>
        </div>
      </div>
      
      {syncStatus.status === 'success' && syncStatus.message && (
        <div className="bg-green-50 text-green-800 p-3 rounded-md border border-green-200">
          {syncStatus.message}
        </div>
      )}
      
      {syncStatus.status === 'error' && syncStatus.message && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md border border-red-200">
          {syncStatus.message}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderSkeletons()
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewDetails(customer)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail size={14} className="mr-1 text-gray-500" />
                      <a 
                        href={`mailto:${customer.email}`} 
                        className="text-[#21add6] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.email}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone size={14} className="mr-1 text-gray-500" />
                      <a 
                        href={`tel:${customer.phone}`}
                        className="text-[#21add6] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.phone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(customer);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditContact(customer);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirmation(customer);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="py-8 text-center text-gray-500">
                    <p>Nenhum contato encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Diálogo para adicionar/editar contato */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
            <DialogDescription>
              {selectedContact 
                ? 'Edite as informações do contato abaixo.' 
                : 'Preencha as informações para adicionar um novo contato.'}
            </DialogDescription>
          </DialogHeader>
          
          <ContactForm 
            initialData={selectedContact || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsContactDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para visualizar detalhes do contato */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Contato
            </DialogTitle>
            <DialogDescription>
              Visualize as informações detalhadas do contato.
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <ContactDetails 
              customer={selectedContact}
              onEdit={handleEditContact}
              onDelete={handleDeleteConfirmation}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{selectedContact?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
