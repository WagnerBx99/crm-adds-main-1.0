import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Plus, User, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Customer } from '@/types';
import { apiService } from '@/lib/services/apiService';
import { syncContactsWithTiny } from '@/lib/services/contactService';
import { searchTinyContactByCriteria } from '@/lib/services/tinyService';
import { toast } from 'sonner';

interface CustomerSearchProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customer: Customer) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface SearchResult extends Customer {
  source: 'local' | 'tiny';
  matchType: 'name' | 'email' | 'document' | 'phone' | 'company';
}

export default function CustomerSearch({ 
  selectedCustomerId, 
  onCustomerSelect, 
  onError,
  className = ""
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: Date | null;
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({
    lastSync: null,
    status: 'idle'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Carregar cliente selecionado ao inicializar
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = localCustomers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        setSearchQuery(customer.name);
      }
    }
  }, [selectedCustomerId, localCustomers]);

  // Carregar contatos da API do backend
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        console.log('🌐 [API] Carregando clientes do backend...');
        const response = await apiService.getCustomers();
        if (response && response.data) {
          const customers = response.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            document: c.document || '',
            personType: c.personType || '',
            zipCode: c.zipCode || '',
            city: c.city || '',
            state: c.state || '',
            address: c.address || '',
            neighborhood: c.neighborhood || '',
            number: c.number || '',
            complement: c.complement || '',
            createdAt: new Date(c.createdAt)
          }));
          setLocalCustomers(customers);
          console.log(`✅ [API] ${customers.length} clientes carregados`);
        }
      } catch (error) {
        console.error('❌ [API] Erro ao carregar clientes:', error);
      }
    };
    
    if (apiService.isAuthenticated()) {
      loadCustomers();
    }
  }, []);

  // Debounce para pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // 1. Buscar nos contatos locais
      const localResults = searchLocalCustomers(query);
      results.push(...localResults);

      // 2. Buscar na API da Tiny se não encontrou muitos resultados locais
      if (localResults.length < 3) {
        const tinyResults = await searchTinyCustomers(query);
        results.push(...tinyResults);
      }

      // Remover duplicatas baseado no documento ou email
      const uniqueResults = removeDuplicates(results);
      
      setSearchResults(uniqueResults);
      setShowResults(true);
    } catch (error) {
      console.error('Erro durante a busca:', error);
      onError?.('Erro ao buscar clientes. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocalCustomers = (query: string): SearchResult[] => {
    const queryLower = query.toLowerCase();
    
    return localCustomers
      .filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(queryLower);
        const emailMatch = customer.email.toLowerCase().includes(queryLower);
        const phoneMatch = customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        const companyMatch = customer.company.toLowerCase().includes(queryLower);
        const documentMatch = customer.document?.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        
        return nameMatch || emailMatch || phoneMatch || companyMatch || documentMatch;
      })
      .map(customer => ({
        ...customer,
        source: 'local' as const,
        matchType: getMatchType(customer, queryLower)
      }))
      .slice(0, 10); // Limitar resultados locais
  };

  const searchTinyCustomers = async (query: string): Promise<SearchResult[]> => {
    try {
      // Buscar por diferentes critérios
      const searchCriteria = [
        { nome: query },
        { email: query },
        { cpf_cnpj: query.replace(/\D/g, '') },
        { telefone: query.replace(/\D/g, '') }
      ];

      const results: SearchResult[] = [];

      for (const criteria of searchCriteria) {
        try {
          const tinyContact = await searchTinyContactByCriteria(criteria);
          if (tinyContact) {
            // Converter formato da Tiny para formato interno
            const customer: Customer = {
              id: tinyContact.id,
              name: tinyContact.name,
              email: tinyContact.email,
              phone: tinyContact.phone,
              company: tinyContact.company,
              personType: tinyContact.personType,
              document: tinyContact.document,
              zipCode: tinyContact.zipCode,
              city: tinyContact.city,
              state: tinyContact.state,
              address: tinyContact.address,
              neighborhood: tinyContact.neighborhood,
              number: tinyContact.number,
              createdAt: tinyContact.createdAt,
              updatedAt: tinyContact.updatedAt
            };

            results.push({
              ...customer,
              source: 'tiny',
              matchType: getMatchTypeFromCriteria(criteria)
            });
          }
        } catch (error) {
          console.warn('Erro em busca específica na Tiny:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao buscar na API da Tiny:', error);
      return [];
    }
  };

  const getMatchType = (customer: Customer, query: string): SearchResult['matchType'] => {
    if (customer.name.toLowerCase().includes(query)) return 'name';
    if (customer.email.toLowerCase().includes(query)) return 'email';
    if (customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) return 'phone';
    if (customer.company.toLowerCase().includes(query)) return 'company';
    if (customer.document?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) return 'document';
    return 'name';
  };

  const getMatchTypeFromCriteria = (criteria: any): SearchResult['matchType'] => {
    if (criteria.nome) return 'name';
    if (criteria.email) return 'email';
    if (criteria.cpf_cnpj) return 'document';
    if (criteria.telefone) return 'phone';
    return 'name';
  };

  const removeDuplicates = (results: SearchResult[]): SearchResult[] => {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.document || result.email || result.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const handleCustomerSelect = (customer: SearchResult) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setShowResults(false);
    onCustomerSelect(customer);

    // Se for um cliente da Tiny, salvar localmente para futuras buscas
    if (customer.source === 'tiny') {
      saveCustomerLocally(customer);
    }
  };

  const saveCustomerLocally = async (customer: Customer) => {
    try {
      // Verificar se já existe localmente
      const exists = localCustomers.some((c: Customer) => 
        c.id === customer.id || c.document === customer.document || c.email === customer.email
      );

      if (!exists) {
        // Salvar no backend via API
        console.log('🌐 [API] Salvando cliente no backend...');
        const savedCustomer = await apiService.createCustomer({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          document: customer.document,
          personType: customer.personType,
          zipCode: customer.zipCode,
          city: customer.city,
          state: customer.state,
          address: customer.address,
          neighborhood: customer.neighborhood,
          number: customer.number,
          complement: customer.complement
        });
        
        setLocalCustomers(prev => [...prev, { ...customer, id: savedCustomer.id }]);
        toast.success('Cliente adicionado ao cadastro');
        console.log('✅ [API] Cliente salvo com sucesso');
      }
    } catch (error) {
      console.error('❌ [API] Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleSyncWithTiny = async () => {
    setIsSyncing(true);
    setSyncStatus({ ...syncStatus, status: 'idle' });

    try {
      const result = await syncContactsWithTiny();
      
      setSyncStatus({
        lastSync: new Date(),
        status: 'success',
        message: `Sincronização concluída: ${result.added} adicionados, ${result.updated} atualizados, ${result.failed} falhas`
      });

      // Recarregar contatos do backend
      try {
        const response = await apiService.getCustomers();
        if (response && response.data) {
          const customers = response.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            document: c.document || '',
            personType: c.personType || '',
            zipCode: c.zipCode || '',
            city: c.city || '',
            state: c.state || '',
            address: c.address || '',
            neighborhood: c.neighborhood || '',
            number: c.number || '',
            complement: c.complement || '',
            createdAt: new Date(c.createdAt)
          }));
          setLocalCustomers(customers);
        }
      } catch (err) {
        console.error('Erro ao recarregar clientes:', err);
      }

      toast.success(`Sincronização concluída! ${result.added} novos contatos adicionados.`);
      
      // Refazer busca se havia uma query
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim());
      }
    } catch (error) {
      setSyncStatus({
        lastSync: new Date(),
        status: 'error',
        message: 'Erro ao sincronizar com a Tiny ERP'
      });

      toast.error('Erro ao sincronizar contatos. Tente novamente.');
      onError?.('Erro ao sincronizar contatos com a Tiny ERP');
    } finally {
      setIsSyncing(false);
    }
  };

  const getMatchTypeLabel = (matchType: SearchResult['matchType']): string => {
    const labels = {
      name: 'Nome',
      email: 'E-mail',
      document: 'CPF/CNPJ',
      phone: 'Telefone',
      company: 'Empresa'
    };
    return labels[matchType];
  };

  const formatDocument = (document?: string): string => {
    if (!document) return '';
    const cleaned = document.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      // CPF
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    } else if (cleaned.length === 14) {
      // CNPJ
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/$4-$5');
    }
    
    return document;
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="customer-search">Cliente *</Label>
      
      <div className="flex gap-2 mt-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={searchInputRef}
            id="customer-search"
            type="text"
            placeholder="Busque por nome, e-mail, CPF/CNPJ, telefone ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
            className="pl-10"
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSyncWithTiny}
          disabled={isSyncing}
          title="Sincronizar contatos da Tiny ERP"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Resultados da busca */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80"
        >
          {searchResults.length > 0 ? (
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {searchResults.map((customer, index) => (
                  <div key={`${customer.id}-${customer.source}-${index}`}>
                    <button
                      type="button"
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {customer.personType === 'legal' ? (
                              <Building className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <span className="font-medium text-gray-900 truncate">
                              {customer.name}
                            </span>
                          </div>
                          
                          {customer.company && (
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {customer.company}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span>{customer.email}</span>
                            <span>•</span>
                            <span>{customer.phone}</span>
                            {customer.document && (
                              <>
                                <span>•</span>
                                <span>{formatDocument(customer.document)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <Badge 
                            variant={customer.source === 'tiny' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {customer.source === 'tiny' ? 'Tiny ERP' : 'Local'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {getMatchTypeLabel(customer.matchType)}
                          </span>
                        </div>
                      </div>
                    </button>
                    
                    {index < searchResults.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500 mb-3">
                Nenhum cliente encontrado para "{searchQuery}"
              </p>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncWithTiny}
                disabled={isSyncing}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar com Tiny ERP
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 mt-2">
                Busque contatos diretamente na Tiny ERP
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status da sincronização */}
      {syncStatus.status !== 'idle' && (
        <Alert className={`mt-2 ${syncStatus.status === 'error' ? 'border-red-200' : 'border-green-200'}`}>
          {syncStatus.status === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className="text-sm">
            {syncStatus.message}
            {syncStatus.lastSync && (
              <span className="block text-xs text-gray-500 mt-1">
                {syncStatus.lastSync.toLocaleString('pt-BR')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cliente selecionado */}
      {selectedCustomer && !showResults && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            {selectedCustomer.personType === 'legal' ? (
              <Building className="w-4 h-4 text-blue-600" />
            ) : (
              <User className="w-4 h-4 text-green-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}