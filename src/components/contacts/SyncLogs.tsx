import { useState, useEffect } from 'react';
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  Trash,
  FileEdit,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import contactService from '@/lib/services/contactService';

// Interface para logs de sincronização
interface SyncLog {
  id: string;
  timestamp: Date;
  action: 'sync' | 'create' | 'update' | 'delete';
  status: 'success' | 'error';
  details?: string;
  entityId?: string;
}

export default function SyncLogs() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Carregar logs ao inicializar o componente
  useEffect(() => {
    loadLogs();
  }, []);
  
  // Função para carregar logs
  const loadLogs = () => {
    setIsLoading(true);
    try {
      const syncLogs = contactService.getSyncLogs();
      setLogs(syncLogs);
    } catch (error) {
      console.error('Erro ao carregar logs de sincronização:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar os logs de sincronização.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para reprocessar uma sincronização que falhou
  const handleReprocessSync = async (entityId: string) => {
    try {
      const success = await contactService.reprocessFailedSync(entityId);
      
      if (success) {
        toast({
          title: 'Sincronização reprocessada',
          description: 'A sincronização foi reprocessada com sucesso.',
        });
      } else {
        toast({
          title: 'Erro ao reprocessar',
          description: 'Não foi possível reprocessar a sincronização.',
          variant: 'destructive',
        });
      }
      
      // Recarregar logs
      loadLogs();
    } catch (error) {
      console.error('Erro ao reprocessar sincronização:', error);
      toast({
        title: 'Erro ao reprocessar',
        description: 'Ocorreu um erro ao tentar reprocessar a sincronização.',
        variant: 'destructive',
      });
    }
  };
  
  // Função para formatar a data
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };
  
  // Função para obter o ícone da ação
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'sync':
        return <RefreshCw className="h-4 w-4" />;
      case 'create':
        return <FileEdit className="h-4 w-4" />;
      case 'update':
        return <FileEdit className="h-4 w-4" />;
      case 'delete':
        return <Trash className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Função para obter o texto da ação
  const getActionText = (action: string) => {
    switch (action) {
      case 'sync':
        return 'Sincronização';
      case 'create':
        return 'Criação';
      case 'update':
        return 'Atualização';
      case 'delete':
        return 'Exclusão';
      default:
        return 'Desconhecido';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#0b4269]">Logs de Sincronização</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadLogs}
          className="gap-1"
        >
          <RotateCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Carregando logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getActionIcon(log.action)}
                      <span>{getActionText(log.action)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sucesso
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.details || '-'}
                  </TableCell>
                  <TableCell>
                    {log.status === 'error' && log.entityId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleReprocessSync(log.entityId!)}
                        className="h-8 gap-1 text-[#21add6] hover:text-[#1c9abf] hover:bg-[#e6f7fb]"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reprocessar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="py-8 text-center text-gray-500">
                    <p>Nenhum log de sincronização encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 