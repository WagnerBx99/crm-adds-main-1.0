import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { 
  Download, HardDrive, Database, Upload, Clock, Calendar, UploadCloud, 
  Server, Shield, FileText, AlertTriangle, CheckCircle, RefreshCw, 
  Filter, Search, Plus, Trash, Key, Settings, Bell, ArrowUpCircle, 
  CloudOff, Info, Loader2, Lock, Share2, ExternalLink, History
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

// Tipos
type BackupType = 'completo' | 'incremental';
type BackupFrequency = 'diario' | 'semanal' | 'mensal' | 'personalizado';
type BackupStatus = 'concluido' | 'em_andamento' | 'falhou' | 'agendado';
type StorageDestination = 'local' | 'cloud' | 'ftp';
type CloudProvider = 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'outro';

interface BackupRecord {
  id: string;
  dateTime: Date;
  type: BackupType;
  size: string;
  destination: StorageDestination;
  destinationDetails: string;
  status: BackupStatus;
  duration?: string;
  encrypted: boolean;
  notes?: string;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: BackupFrequency;
  time: string;
  day?: number; // Para backup semanal (0-6, domingo a sábado)
  dayOfMonth?: number; // Para backup mensal
  type: BackupType;
}

interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  enableAutoPurge: boolean;
}

interface StorageConfig {
  local: {
    enabled: boolean;
    path: string;
    capacityWarning: number; // Percentual para acionar aviso
  };
  cloud: {
    enabled: boolean;
    provider: CloudProvider;
    bucketName: string;
    region: string;
    accessKey: string;
    secretKey: string;
    folderPath: string;
  };
  ftp: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
    secure: boolean; // SFTP
    path: string;
  };
}

interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionKey: string;
  restrictRestoration: boolean;
  requireAdminForRestore: boolean;
  require2FAForRestore: boolean;
}

interface NotificationConfig {
  emailNotifications: boolean;
  emailRecipients: string[];
  inAppNotifications: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export function BackupSettings() {
  // Estados gerais
  const [activeTab, setActiveTab] = useState('geral');
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Estado do último backup
  const [lastBackupStatus, setLastBackupStatus] = useState<{
    date: Date | null;
    status: 'ok' | 'warning' | 'error';
    message: string;
  }>({
    date: new Date(2023, 7, 25, 3, 15), // 25/08/2023 03:15
    status: 'ok',
    message: 'Último backup concluído com sucesso.'
  });
  
  // Estados para Agendamento
  const [schedules, setSchedules] = useState<BackupSchedule[]>([
    {
      enabled: true,
      frequency: 'diario',
      time: '03:00',
      type: 'incremental'
    },
    {
      enabled: true,
      frequency: 'semanal',
      time: '02:00',
      day: 0, // Domingo
      type: 'completo'
    }
  ]);
  
  // Estado para política de retenção
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>({
    daily: 7,
    weekly: 4,
    monthly: 3,
    enableAutoPurge: true
  });
  
  // Estado para configuração de armazenamento
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    local: {
      enabled: true,
      path: '/backups',
      capacityWarning: 80
    },
    cloud: {
      enabled: false,
      provider: 'aws',
      bucketName: '',
      region: 'us-east-1',
      accessKey: '',
      secretKey: '',
      folderPath: '/crm-backup'
    },
    ftp: {
      enabled: false,
      host: '',
      port: 22,
      username: '',
      password: '',
      secure: true,
      path: '/backup'
    }
  });
  
  // Estado para o histórico de backups
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([
    {
      id: '1',
      dateTime: new Date(2023, 7, 25, 3, 15), // 25/08/2023 03:15
      type: 'completo',
      size: '1.2 GB',
      destination: 'local',
      destinationDetails: '/backups/full_20230825_031500.zip',
      status: 'concluido',
      duration: '25 min',
      encrypted: true,
      notes: 'Backup completo semanal'
    },
    {
      id: '2',
      dateTime: new Date(2023, 7, 24, 3, 15), // 24/08/2023 03:15
      type: 'incremental',
      size: '350 MB',
      destination: 'local',
      destinationDetails: '/backups/inc_20230824_031500.zip',
      status: 'concluido',
      duration: '8 min',
      encrypted: true,
      notes: 'Backup incremental diário'
    }
  ]);
  
  // Estado para filtros de busca de histórico
  const [historyFilters, setHistoryFilters] = useState({
    searchTerm: '',
    type: 'todos',
    status: 'todos',
    dateFrom: '',
    dateTo: '',
  });
  
  // Estado para configurações de segurança
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    encryptionEnabled: true,
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || '',
    restrictRestoration: true,
    requireAdminForRestore: true,
    require2FAForRestore: true
  });
  
  // Estado para configurações de notificação
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    emailNotifications: true,
    emailRecipients: ['admin@empresa.com.br'],
    inAppNotifications: true,
    notifyOnSuccess: true,
    notifyOnFailure: true
  });
  
  // Estados para modais
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupRecord | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    restoreDatabase: true,
    restoreFiles: true,
    confirmPassword: '',
    code2FA: ''
  });
  
  // Simulação de backup manual
  const handleManualBackup = (type: BackupType) => {
    setIsLoading(true);
    setProgressValue(0);
    setProgressMessage('Inicializando backup...');
    
    // Simulação de progresso
    const interval = setInterval(() => {
      setProgressValue(prev => {
        const newValue = prev + Math.floor(Math.random() * 10);
        setProgressMessage(getProgressMessage(newValue));
        
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            
            // Adicionar ao histórico
            const newBackup: BackupRecord = {
              id: Date.now().toString(),
              dateTime: new Date(),
              type: type,
              size: type === 'completo' ? '1.4 GB' : '380 MB',
              destination: 'local',
              destinationDetails: `/backups/${type === 'completo' ? 'full' : 'inc'}_${new Date().toISOString().replace(/[:.]/g, '')}.zip`,
              status: 'concluido',
              duration: type === 'completo' ? '28 min' : '10 min',
              encrypted: securityConfig.encryptionEnabled,
              notes: `Backup ${type} manual`
            };
            
            setBackupHistory(prev => [newBackup, ...prev]);
            
            // Atualizar status do último backup
            setLastBackupStatus({
              date: new Date(),
              status: 'ok',
              message: 'Backup concluído com sucesso.'
            });
            
            toast.success(`Backup ${type} concluído com sucesso!`);
          }, 500);
          
          return 100;
        }
        
        return newValue;
      });
    }, 300);
    
    return () => clearInterval(interval);
  };
  
  // Função para obter mensagem de progresso
  const getProgressMessage = (progress: number): string => {
    if (progress < 10) return 'Inicializando conexão com o banco de dados...';
    if (progress < 30) return 'Preparando arquivos para backup...';
    if (progress < 60) return 'Compactando arquivos...';
    if (progress < 80) return 'Aplicando criptografia...';
    if (progress < 95) return 'Enviando para destino de armazenamento...';
    return 'Finalizando backup...';
  };
  
  // Manipulador para restaurar backup
  const handleRestoreBackup = (backup: BackupRecord) => {
    setSelectedBackupForRestore(backup);
    setIsRestoreModalOpen(true);
  };
  
  // Manipulador para confirmar restauração
  const handleConfirmRestore = () => {
    if (!selectedBackupForRestore) return;
    
    // Verificar senha/2FA aqui
    
    setIsLoading(true);
    setProgressValue(0);
    setProgressMessage('Inicializando restauração...');
    
    // Simulação de progresso
    const interval = setInterval(() => {
      setProgressValue(prev => {
        const newValue = prev + Math.floor(Math.random() * 8);
        
        if (newValue < 20) setProgressMessage('Baixando backup...');
        else if (newValue < 40) setProgressMessage('Verificando integridade...');
        else if (newValue < 60) setProgressMessage('Descompactando arquivos...');
        else if (newValue < 80) setProgressMessage('Restaurando banco de dados...');
        else setProgressMessage('Finalizando restauração...');
        
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setIsRestoreModalOpen(false);
            toast.success('Restauração concluída com sucesso!');
          }, 500);
          
          return 100;
        }
        
        return newValue;
      });
    }, 400);
    
    return () => clearInterval(interval);
  };
  
  // Filtrar histórico de backups
  const filteredBackupHistory = backupHistory.filter(backup => {
    const matchesSearch = historyFilters.searchTerm === '' || 
      backup.destinationDetails.toLowerCase().includes(historyFilters.searchTerm.toLowerCase()) ||
      backup.notes?.toLowerCase().includes(historyFilters.searchTerm.toLowerCase());
    
    const matchesType = historyFilters.type === 'todos' || backup.type === historyFilters.type;
    
    const matchesStatus = historyFilters.status === 'todos' || backup.status === historyFilters.status;
    
    // Filtros de data
    let dateMatches = true;
    if (historyFilters.dateFrom) {
      const fromDate = new Date(historyFilters.dateFrom);
      dateMatches = dateMatches && backup.dateTime >= fromDate;
    }
    if (historyFilters.dateTo) {
      const toDate = new Date(historyFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Fim do dia
      dateMatches = dateMatches && backup.dateTime <= toDate;
    }
    
    return matchesSearch && matchesType && matchesStatus && dateMatches;
  });
  
  // Renderizar o componente
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Backup e Recuperação de Dados</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações de backup e restauração do sistema
          </p>
        </div>
        
        {/* Status rápido */}
        <div className={`px-4 py-2 rounded-md flex items-center gap-2 border ${
          lastBackupStatus.status === 'ok' ? 'bg-green-50 border-green-200 text-green-800' :
          lastBackupStatus.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          {lastBackupStatus.status === 'ok' ? (
            <CheckCircle className="h-5 w-5" />
          ) : lastBackupStatus.status === 'warning' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <div className="text-sm">
            <span className="font-medium">
              {lastBackupStatus.date ? 
                `Último backup: ${lastBackupStatus.date.toLocaleDateString('pt-BR')} às ${lastBackupStatus.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                : 'Nenhum backup realizado'}
            </span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Barra de progresso durante operações */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{progressMessage}</span>
            <span className="text-sm">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      )}
      
      {/* Abas principais */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
          <TabsTrigger value="destinos">Destinos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>
        
        {/* Aba Geral */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Manual</CardTitle>
              <CardDescription>
                Inicie um backup imediatamente com as configurações atuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-medium">Status do Último Backup</h3>
                    <Badge 
                      variant="outline" 
                      className={lastBackupStatus.status === 'ok' ? 
                        "bg-green-50 text-green-700 border-green-200" :
                        lastBackupStatus.status === 'warning' ?
                        "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {lastBackupStatus.status === 'ok' ? 'Concluído' : 
                       lastBackupStatus.status === 'warning' ? 'Atenção' : 'Falha'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lastBackupStatus.date ? 
                      `Último backup realizado em: ${lastBackupStatus.date.toLocaleDateString('pt-BR')} às ${lastBackupStatus.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                      : 'Nenhum backup realizado'}
                  </p>
                  {lastBackupStatus.message && (
                    <p className="text-sm">{lastBackupStatus.message}</p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8">
                  <Button 
                    size="lg"
                    variant="default" 
                    onClick={() => handleManualBackup('completo')}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-5 w-5" />
                    )}
                    Backup Completo
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline" 
                    onClick={() => handleManualBackup('incremental')}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="mr-2 h-5 w-5" />
                    )}
                    Backup Incremental
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Sistema de Backup</CardTitle>
              <CardDescription>
                Visão geral das configurações ativas de backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Agendamentos Ativos</h3>
                  <div className="space-y-2">
                    {schedules.filter(s => s.enabled).map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-4 border rounded-md">
                        <div className="flex items-center">
                          {schedule.frequency === 'diario' ? (
                            <Clock className="h-5 w-5 mr-3 text-blue-500" />
                          ) : schedule.frequency === 'semanal' ? (
                            <Calendar className="h-5 w-5 mr-3 text-indigo-500" />
                          ) : (
                            <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                          )}
                          <span className="font-medium">
                            Backup {schedule.type === 'completo' ? 'Completo' : 'Incremental'} 
                            {schedule.frequency === 'diario' ? ' Diário' : 
                             schedule.frequency === 'semanal' ? ' Semanal' : ' Mensal'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{schedule.time}</span>
                          <Badge>Ativo</Badge>
                        </div>
                      </div>
                    ))}
                    {schedules.filter(s => s.enabled).length === 0 && (
                      <div className="text-sm text-muted-foreground italic py-2">
                        Nenhum agendamento ativo. Configure na aba Agendamento.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Destinos Configurados</h3>
                  <div className="space-y-2">
                    {storageConfig.local.enabled && (
                      <div className="flex justify-between items-center py-2 px-4 border rounded-md">
                        <div className="flex items-center">
                          <HardDrive className="h-5 w-5 mr-3 text-slate-500" />
                          <span className="font-medium">Armazenamento Local</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      </div>
                    )}
                    
                    {storageConfig.cloud.enabled && (
                      <div className="flex justify-between items-center py-2 px-4 border rounded-md">
                        <div className="flex items-center">
                          <UploadCloud className="h-5 w-5 mr-3 text-blue-500" />
                          <span className="font-medium">Cloud Storage ({storageConfig.cloud.provider.toUpperCase()})</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      </div>
                    )}
                    
                    {storageConfig.ftp.enabled && (
                      <div className="flex justify-between items-center py-2 px-4 border rounded-md">
                        <div className="flex items-center">
                          <Server className="h-5 w-5 mr-3 text-purple-500" />
                          <span className="font-medium">{storageConfig.ftp.secure ? 'SFTP' : 'FTP'}</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      </div>
                    )}
                    
                    {!storageConfig.local.enabled && !storageConfig.cloud.enabled && !storageConfig.ftp.enabled && (
                      <div className="text-sm text-muted-foreground italic py-2">
                        Nenhum destino configurado. Configure na aba Destinos.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Segurança</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-4 border rounded-md">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-green-500" />
                        <span className="font-medium">Criptografia de Backup</span>
                      </div>
                      <Badge variant="outline" className={securityConfig.encryptionEnabled ? 
                        "bg-green-50 text-green-700 border-green-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }>
                        {securityConfig.encryptionEnabled ? 'Ativada' : 'Desativada'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 px-4 border rounded-md">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 mr-3 text-amber-500" />
                        <span className="font-medium">Autenticação para Restauração</span>
                      </div>
                      <Badge variant="outline" className={securityConfig.restrictRestoration ? 
                        "bg-green-50 text-green-700 border-green-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }>
                        {securityConfig.restrictRestoration ? 'Restrita' : 'Padrão'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba Agendamento */}
        <TabsContent value="agendamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos de Backup</CardTitle>
              <CardDescription>
                Configure quando os backups automáticos serão executados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {schedules.map((schedule, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {schedule.frequency === 'diario' ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : schedule.frequency === 'semanal' ? (
                        <Calendar className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Calendar className="h-5 w-5 text-purple-500" />
                      )}
                      <h3 className="font-medium">
                        Backup {schedule.frequency === 'diario' ? 'Diário' : 
                              schedule.frequency === 'semanal' ? 'Semanal' : 'Mensal'}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].enabled = checked;
                          setSchedules(newSchedules);
                        }}
                        id={`schedule-${index}-enabled`}
                      />
                      <Label htmlFor={`schedule-${index}-enabled`}>
                        {schedule.enabled ? 'Ativo' : 'Inativo'}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={schedule.frequency}
                        onValueChange={(value) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].frequency = value as BackupFrequency;
                          
                          // Reset specific fields based on frequency
                          if (value === 'diario') {
                            delete newSchedules[index].day;
                            delete newSchedules[index].dayOfMonth;
                          } else if (value === 'semanal') {
                            newSchedules[index].day = 0;
                            delete newSchedules[index].dayOfMonth;
                          } else if (value === 'mensal') {
                            delete newSchedules[index].day;
                            newSchedules[index].dayOfMonth = 1;
                          }
                          
                          setSchedules(newSchedules);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diario">Diário</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="personalizado">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de Backup</Label>
                      <Select
                        value={schedule.type}
                        onValueChange={(value) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].type = value as BackupType;
                          setSchedules(newSchedules);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completo">Completo</SelectItem>
                          <SelectItem value="incremental">Incremental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].time = e.target.value;
                          setSchedules(newSchedules);
                        }}
                      />
                    </div>
                    
                    {schedule.frequency === 'semanal' && (
                      <div className="space-y-2">
                        <Label>Dia da Semana</Label>
                        <Select
                          value={schedule.day?.toString() || "0"}
                          onValueChange={(value) => {
                            const newSchedules = [...schedules];
                            newSchedules[index].day = parseInt(value);
                            setSchedules(newSchedules);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o dia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Domingo</SelectItem>
                            <SelectItem value="1">Segunda-feira</SelectItem>
                            <SelectItem value="2">Terça-feira</SelectItem>
                            <SelectItem value="3">Quarta-feira</SelectItem>
                            <SelectItem value="4">Quinta-feira</SelectItem>
                            <SelectItem value="5">Sexta-feira</SelectItem>
                            <SelectItem value="6">Sábado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {schedule.frequency === 'mensal' && (
                      <div className="space-y-2">
                        <Label>Dia do Mês</Label>
                        <Select
                          value={schedule.dayOfMonth?.toString() || "1"}
                          onValueChange={(value) => {
                            const newSchedules = [...schedules];
                            newSchedules[index].dayOfMonth = parseInt(value);
                            setSchedules(newSchedules);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i} value={(i + 1).toString()}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este agendamento?')) {
                          setSchedules(prev => prev.filter((_, i) => i !== index));
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                onClick={() => {
                  setSchedules(prev => [
                    ...prev,
                    {
                      enabled: true,
                      frequency: 'diario',
                      time: '03:00',
                      type: 'incremental'
                    }
                  ]);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Agendamento
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Política de Retenção</CardTitle>
              <CardDescription>
                Configure por quanto tempo os backups serão mantidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-retention">Retenção de Backups Diários</Label>
                  <div className="flex">
                    <Input
                      id="daily-retention"
                      type="number"
                      min="1"
                      max="90"
                      value={retentionPolicy.daily}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value > 0) {
                          setRetentionPolicy(prev => ({
                            ...prev,
                            daily: value
                          }));
                        }
                      }}
                    />
                    <div className="ml-2 flex items-center text-sm text-muted-foreground">
                      dias
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weekly-retention">Retenção de Backups Semanais</Label>
                  <div className="flex">
                    <Input
                      id="weekly-retention"
                      type="number"
                      min="1"
                      max="52"
                      value={retentionPolicy.weekly}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value > 0) {
                          setRetentionPolicy(prev => ({
                            ...prev,
                            weekly: value
                          }));
                        }
                      }}
                    />
                    <div className="ml-2 flex items-center text-sm text-muted-foreground">
                      semanas
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly-retention">Retenção de Backups Mensais</Label>
                  <div className="flex">
                    <Input
                      id="monthly-retention"
                      type="number"
                      min="1"
                      max="36"
                      value={retentionPolicy.monthly}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value > 0) {
                          setRetentionPolicy(prev => ({
                            ...prev,
                            monthly: value
                          }));
                        }
                      }}
                    />
                    <div className="ml-2 flex items-center text-sm text-muted-foreground">
                      meses
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-purge"
                  checked={retentionPolicy.enableAutoPurge}
                  onCheckedChange={(checked) => {
                    setRetentionPolicy(prev => ({
                      ...prev,
                      enableAutoPurge: !!checked
                    }));
                  }}
                />
                <Label htmlFor="auto-purge">
                  Excluir automaticamente backups que excedam o período de retenção
                </Label>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  A política de retenção determina quanto tempo os backups serão mantidos antes de serem excluídos automaticamente.
                  Recomendamos manter pelo menos 3 meses de backups mensais para maior segurança.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  toast.success('Política de retenção salva com sucesso!');
                }}
              >
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba Destinos */}
        <TabsContent value="destinos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Armazenamento Local</CardTitle>
              <CardDescription>
                Configure o armazenamento de backups no servidor local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="local-storage-enabled"
                  checked={storageConfig.local.enabled}
                  onCheckedChange={(checked) => {
                    setStorageConfig(prev => ({
                      ...prev,
                      local: {
                        ...prev.local,
                        enabled: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="local-storage-enabled">
                  Habilitar armazenamento local
                </Label>
              </div>
              
              {storageConfig.local.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="local-storage-path">Diretório de Armazenamento</Label>
                    <Input
                      id="local-storage-path"
                      value={storageConfig.local.path}
                      onChange={(e) => {
                        setStorageConfig(prev => ({
                          ...prev,
                          local: {
                            ...prev.local,
                            path: e.target.value
                          }
                        }));
                      }}
                      placeholder="/caminho/para/backups"
                    />
                    <p className="text-sm text-muted-foreground">
                      O diretório deve ter permissões de escrita para o usuário do sistema
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capacity-warning">Alerta de Capacidade (%)</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="capacity-warning"
                        type="number"
                        min="50"
                        max="95"
                        value={storageConfig.local.capacityWarning}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 50 && value <= 95) {
                            setStorageConfig(prev => ({
                              ...prev,
                              local: {
                                ...prev.local,
                                capacityWarning: value
                              }
                            }));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: "58%" }}  // Simulação de uso
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0%</span>
                          <span>58% usado (aproximadamente)</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Você receberá notificações quando o uso do espaço exceder este limite
                    </p>
                  </div>
                  
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Recomendação</AlertTitle>
                    <AlertDescription>
                      O armazenamento local não é suficiente para garantir a segurança dos seus dados.
                      Recomendamos configurar pelo menos um destino externo (Cloud ou SFTP).
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cloud Storage</CardTitle>
              <CardDescription>
                Configure o armazenamento em nuvem para seus backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="cloud-storage-enabled"
                  checked={storageConfig.cloud.enabled}
                  onCheckedChange={(checked) => {
                    setStorageConfig(prev => ({
                      ...prev,
                      cloud: {
                        ...prev.cloud,
                        enabled: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="cloud-storage-enabled">
                  Habilitar armazenamento em nuvem
                </Label>
              </div>
              
              {storageConfig.cloud.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cloud-provider">Provedor de Nuvem</Label>
                    <Select
                      value={storageConfig.cloud.provider}
                      onValueChange={(value) => {
                        setStorageConfig(prev => ({
                          ...prev,
                          cloud: {
                            ...prev.cloud,
                            provider: value as CloudProvider
                          }
                        }));
                      }}
                    >
                      <SelectTrigger id="cloud-provider">
                        <SelectValue placeholder="Selecione um provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aws">Amazon S3</SelectItem>
                        <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                        <SelectItem value="azure">Azure Blob Storage</SelectItem>
                        <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
                        <SelectItem value="outro">Outro (S3 Compatible)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bucket-name">Nome do Bucket</Label>
                      <Input
                        id="bucket-name"
                        value={storageConfig.cloud.bucketName}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            cloud: {
                              ...prev.cloud,
                              bucketName: e.target.value
                            }
                          }));
                        }}
                        placeholder="meu-bucket-backups"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Região</Label>
                      <Input
                        id="region"
                        value={storageConfig.cloud.region}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            cloud: {
                              ...prev.cloud,
                              region: e.target.value
                            }
                          }));
                        }}
                        placeholder="us-east-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folder-path">Pasta de Destino</Label>
                    <Input
                      id="folder-path"
                      value={storageConfig.cloud.folderPath}
                      onChange={(e) => {
                        setStorageConfig(prev => ({
                          ...prev,
                          cloud: {
                            ...prev.cloud,
                            folderPath: e.target.value
                          }
                        }));
                      }}
                      placeholder="/crm-backups"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="access-key">Chave de Acesso</Label>
                      <Input
                        id="access-key"
                        type="password"
                        value={storageConfig.cloud.accessKey}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            cloud: {
                              ...prev.cloud,
                              accessKey: e.target.value
                            }
                          }));
                        }}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secret-key">Chave Secreta</Label>
                      <Input
                        id="secret-key"
                        type="password"
                        value={storageConfig.cloud.secretKey}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            cloud: {
                              ...prev.cloud,
                              secretKey: e.target.value
                            }
                          }));
                        }}
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      />
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Segurança</AlertTitle>
                    <AlertDescription>
                      Recomendamos criar um usuário específico para backups com permissões limitadas.
                      Nunca utilize credenciais de conta principal/root.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast.success('Testando conexão com a nuvem...');
                        setTimeout(() => {
                          toast.success('Conexão com o serviço de nuvem estabelecida com sucesso!');
                        }, 2000);
                      }}
                    >
                      Testar Conexão
                    </Button>
                    
                    <Button
                      onClick={() => {
                        toast.success('Configurações de cloud salvas com sucesso!');
                      }}
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>FTP/SFTP</CardTitle>
              <CardDescription>
                Configure o envio de backups para servidores FTP/SFTP externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ftp-enabled"
                  checked={storageConfig.ftp.enabled}
                  onCheckedChange={(checked) => {
                    setStorageConfig(prev => ({
                      ...prev,
                      ftp: {
                        ...prev.ftp,
                        enabled: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="ftp-enabled">
                  Habilitar armazenamento FTP/SFTP
                </Label>
              </div>
              
              {storageConfig.ftp.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ftp-host">Servidor</Label>
                      <Input
                        id="ftp-host"
                        value={storageConfig.ftp.host}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            ftp: {
                              ...prev.ftp,
                              host: e.target.value
                            }
                          }));
                        }}
                        placeholder="ftp.exemple.com.br"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ftp-port">Porta</Label>
                      <Input
                        id="ftp-port"
                        type="number"
                        value={storageConfig.ftp.port}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value > 0) {
                            setStorageConfig(prev => ({
                              ...prev,
                              ftp: {
                                ...prev.ftp,
                                port: value
                              }
                            }));
                          }
                        }}
                        placeholder="22"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ftp-username">Usuário</Label>
                      <Input
                        id="ftp-username"
                        value={storageConfig.ftp.username}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            ftp: {
                              ...prev.ftp,
                              username: e.target.value
                            }
                          }));
                        }}
                        placeholder="usuario"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ftp-password">Senha</Label>
                      <Input
                        id="ftp-password"
                        type="password"
                        value={storageConfig.ftp.password}
                        onChange={(e) => {
                          setStorageConfig(prev => ({
                            ...prev,
                            ftp: {
                              ...prev.ftp,
                              password: e.target.value
                            }
                          }));
                        }}
                        placeholder="********"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ftp-path">Caminho Remoto</Label>
                    <Input
                      id="ftp-path"
                      value={storageConfig.ftp.path}
                      onChange={(e) => {
                        setStorageConfig(prev => ({
                          ...prev,
                          ftp: {
                            ...prev.ftp,
                            path: e.target.value
                          }
                        }));
                      }}
                      placeholder="/backups"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ftp-secure"
                      checked={storageConfig.ftp.secure}
                      onCheckedChange={(checked) => {
                        setStorageConfig(prev => ({
                          ...prev,
                          ftp: {
                            ...prev.ftp,
                            secure: !!checked,
                            port: !!checked ? 22 : 21
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="ftp-secure">
                      Usar SFTP (Secure FTP)
                    </Label>
                  </div>
                  
                  <Alert className={storageConfig.ftp.secure ? 
                    "bg-green-50 text-green-800 border-green-200" : 
                    "bg-red-50 text-red-800 border-red-200"
                  }>
                    {storageConfig.ftp.secure ? (
                      <>
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Conexão Segura</AlertTitle>
                        <AlertDescription>
                          SFTP será utilizado para transferência segura dos seus backups. 
                          A porta padrão é 22.
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          FTP tradicional não é seguro e transfere dados sem criptografia.
                          Recomendamos fortemente utilizar SFTP.
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast.success('Testando conexão FTP/SFTP...');
                        setTimeout(() => {
                          toast.success('Conexão FTP/SFTP estabelecida com sucesso!');
                        }, 2000);
                      }}
                    >
                      Testar Conexão
                    </Button>
                    
                    <Button
                      onClick={() => {
                        toast.success('Configurações de FTP/SFTP salvas com sucesso!');
                      }}
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Backups</CardTitle>
              <CardDescription>
                Visualize e gerencie os backups realizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por descrição ou arquivo..."
                    className="pl-8"
                    value={historyFilters.searchTerm}
                    onChange={(e) => setHistoryFilters(prev => ({
                      ...prev,
                      searchTerm: e.target.value
                    }))}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // Implementar toggle de filtros avançados
                    }}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setHistoryFilters({
                        searchTerm: '',
                        type: 'todos',
                        status: 'todos',
                        dateFrom: '',
                        dateTo: '',
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="type-filter" className="mb-1 block text-sm">Tipo</Label>
                    <Select
                      value={historyFilters.type}
                      onValueChange={(value) => setHistoryFilters(prev => ({
                        ...prev,
                        type: value
                      }))}
                    >
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="completo">Completo</SelectItem>
                        <SelectItem value="incremental">Incremental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter" className="mb-1 block text-sm">Status</Label>
                    <Select
                      value={historyFilters.status}
                      onValueChange={(value) => setHistoryFilters(prev => ({
                        ...prev,
                        status: value
                      }))}
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="falhou">Falhou</SelectItem>
                        <SelectItem value="agendado">Agendado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date-from" className="mb-1 block text-sm">Data Inicial</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={historyFilters.dateFrom}
                      onChange={(e) => setHistoryFilters(prev => ({
                        ...prev,
                        dateFrom: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date-to" className="mb-1 block text-sm">Data Final</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={historyFilters.dateTo}
                      onChange={(e) => setHistoryFilters(prev => ({
                        ...prev,
                        dateTo: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tamanho
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destino
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBackupHistory.length > 0 ? filteredBackupHistory.map((backup) => (
                        <tr key={backup.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {backup.dateTime.toLocaleDateString('pt-BR')} {backup.dateTime.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant="outline" className={
                              backup.type === 'completo' ? 
                                "bg-blue-50 text-blue-700 border-blue-200" : 
                                "bg-purple-50 text-purple-700 border-purple-200"
                            }>
                              {backup.type === 'completo' ? 'Completo' : 'Incremental'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {backup.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    {backup.destination === 'local' ? (
                                      <HardDrive className="h-4 w-4 mr-1.5 text-slate-500" />
                                    ) : backup.destination === 'cloud' ? (
                                      <UploadCloud className="h-4 w-4 mr-1.5 text-blue-500" />
                                    ) : (
                                      <Server className="h-4 w-4 mr-1.5 text-purple-500" />
                                    )}
                                    <span>
                                      {backup.destination === 'local' ? 'Local' : 
                                       backup.destination === 'cloud' ? 'Cloud' : 'FTP/SFTP'}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs break-all">{backup.destinationDetails}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant="outline" className={
                              backup.status === 'concluido' ? 
                                "bg-green-50 text-green-700 border-green-200" : 
                              backup.status === 'em_andamento' ? 
                                "bg-blue-50 text-blue-700 border-blue-200" : 
                              backup.status === 'falhou' ? 
                                "bg-red-50 text-red-700 border-red-200" : 
                                "bg-amber-50 text-amber-700 border-amber-200"
                            }>
                              {backup.status === 'concluido' ? 'Concluído' : 
                               backup.status === 'em_andamento' ? 'Em Andamento' : 
                               backup.status === 'falhou' ? 'Falhou' : 'Agendado'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {backup.status === 'concluido' && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Baixar Backup">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    title="Restaurar Backup"
                                    onClick={() => handleRestoreBackup(backup)}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Excluir Backup"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.')) {
                                    setBackupHistory(prev => prev.filter(b => b.id !== backup.id));
                                    toast.success('Backup excluído com sucesso!');
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center">
                              <Database className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="font-medium">Nenhum backup encontrado</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {historyFilters.searchTerm || historyFilters.type !== 'todos' || historyFilters.status !== 'todos' ? 
                                  'Tente ajustar seus filtros para ver mais resultados' : 
                                  'Nenhum backup foi realizado ainda. Inicie um backup manual ou aguarde o próximo agendamento.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {filteredBackupHistory.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <div>
                    Mostrando {filteredBackupHistory.length} de {backupHistory.length} backups
                  </div>
                  
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        // Implementar exportação de relatório
                        toast.success('Exportando relatório de backups...');
                        setTimeout(() => {
                          toast.success('Relatório exportado com sucesso!');
                        }, 1500);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar Relatório
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Logs de Execução</CardTitle>
              <CardDescription>
                Detalhes técnicos das operações de backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] border rounded-md p-4 bg-gray-50 font-mono text-xs">
                <div className="space-y-2">
                  <div className="text-green-600">[25/08/2023 03:15:00] INFO: Iniciando backup completo semanal</div>
                  <div className="text-blue-600">[25/08/2023 03:15:02] INFO: Conectando ao banco de dados...</div>
                  <div className="text-blue-600">[25/08/2023 03:15:05] INFO: Criando dump do banco de dados...</div>
                  <div className="text-blue-600">[25/08/2023 03:20:15] INFO: Dump concluído com sucesso (823MB)</div>
                  <div className="text-blue-600">[25/08/2023 03:20:17] INFO: Copiando arquivos de /uploads</div>
                  <div className="text-blue-600">[25/08/2023 03:28:32] INFO: Cópia de arquivos concluída (412MB)</div>
                  <div className="text-blue-600">[25/08/2023 03:28:35] INFO: Compactando arquivos de backup...</div>
                  <div className="text-blue-600">[25/08/2023 03:35:22] INFO: Compactação concluída (1.2GB)</div>
                  <div className="text-blue-600">[25/08/2023 03:35:25] INFO: Aplicando criptografia AES-256...</div>
                  <div className="text-blue-600">[25/08/2023 03:39:10] INFO: Criptografia concluída</div>
                  <div className="text-blue-600">[25/08/2023 03:39:12] INFO: Salvando backup em /backups/full_20230825_031500.zip</div>
                  <div className="text-green-600">[25/08/2023 03:40:30] INFO: Backup concluído com sucesso</div>
                  <div className="text-green-600">[25/08/2023 03:40:32] INFO: Envio de notificações para administradores</div>
                  <div className="text-green-600">[25/08/2023 03:40:35] INFO: Operação finalizada</div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba Segurança */}
        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criptografia de Backups</CardTitle>
              <CardDescription>
                Configure a criptografia dos arquivos de backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="encryption-enabled"
                  checked={securityConfig.encryptionEnabled}
                  onCheckedChange={(checked) => {
                    setSecurityConfig(prev => ({
                      ...prev,
                      encryptionEnabled: checked
                    }));
                  }}
                />
                <Label htmlFor="encryption-enabled">
                  Habilitar criptografia AES-256
                </Label>
              </div>
              
              {securityConfig.encryptionEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="encryption-key">Chave de Criptografia</Label>
                    <div className="flex">
                      <Input
                        id="encryption-key"
                        type="password"
                        value={securityConfig.encryptionKey}
                        onChange={(e) => {
                          setSecurityConfig(prev => ({
                            ...prev,
                            encryptionKey: e.target.value
                          }));
                        }}
                        placeholder="Chave de criptografia (32 caracteres recomendados)"
                      />
                      <Button 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => {
                          // Gerar chave aleatória
                          const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join('');
                          
                          setSecurityConfig(prev => ({
                            ...prev,
                            encryptionKey: randomKey
                          }));
                          
                          toast.success('Nova chave de criptografia gerada!');
                        }}
                      >
                        Gerar
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Esta chave será usada para criptografar todos os backups. Guarde-a em um local seguro.
                    </p>
                  </div>
                  
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Se você perder esta chave, não será possível recuperar os dados de seus backups.
                      Recomendamos armazenar uma cópia em um gerenciador de senhas seguro.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-env-key"
                      checked={!securityConfig.encryptionKey || securityConfig.encryptionKey === process.env.BACKUP_ENCRYPTION_KEY}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSecurityConfig(prev => ({
                            ...prev,
                            encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || ''
                          }));
                        }
                      }}
                    />
                    <Label htmlFor="use-env-key">
                      Usar chave da variável de ambiente (BACKUP_ENCRYPTION_KEY)
                    </Label>
                  </div>
                </>
              )}
              
              <div className="pt-2">
                <Button 
                  onClick={() => {
                    toast.success('Configurações de criptografia salvas com sucesso!');
                  }}
                >
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Controle de Acesso para Restauração</CardTitle>
              <CardDescription>
                Configure as restrições para o processo de restauração de backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="restrict-restoration"
                  checked={securityConfig.restrictRestoration}
                  onCheckedChange={(checked) => {
                    setSecurityConfig(prev => ({
                      ...prev,
                      restrictRestoration: checked,
                      requireAdminForRestore: checked ? prev.requireAdminForRestore : false,
                      require2FAForRestore: checked ? prev.require2FAForRestore : false
                    }));
                  }}
                />
                <Label htmlFor="restrict-restoration">
                  Restringir acesso à restauração de backups
                </Label>
              </div>
              
              {securityConfig.restrictRestoration && (
                <>
                  <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="require-admin"
                        checked={securityConfig.requireAdminForRestore}
                        onCheckedChange={(checked) => {
                          setSecurityConfig(prev => ({
                            ...prev,
                            requireAdminForRestore: !!checked
                          }));
                        }}
                        disabled={!securityConfig.restrictRestoration}
                      />
                      <Label htmlFor="require-admin" className={!securityConfig.restrictRestoration ? "text-muted-foreground" : ""}>
                        Exigir credenciais de administrador
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="require-2fa"
                        checked={securityConfig.require2FAForRestore}
                        onCheckedChange={(checked) => {
                          setSecurityConfig(prev => ({
                            ...prev,
                            require2FAForRestore: !!checked
                          }));
                        }}
                        disabled={!securityConfig.restrictRestoration}
                      />
                      <Label htmlFor="require-2fa" className={!securityConfig.restrictRestoration ? "text-muted-foreground" : ""}>
                        Exigir autenticação de dois fatores (2FA)
                      </Label>
                    </div>
                  </div>
                </>
              )}
              
              <Alert className={securityConfig.restrictRestoration ? 
                "bg-green-50 text-green-800 border-green-200" : 
                "bg-red-50 text-red-800 border-red-200"
              }>
                {securityConfig.restrictRestoration ? (
                  <>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Proteção Ativada</AlertTitle>
                    <AlertDescription>
                      A restauração de backups exigirá verificação adicional de segurança.
                      Isso protege contra restaurações acidentais ou maliciosas.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Proteção Desativada</AlertTitle>
                    <AlertDescription>
                      Qualquer usuário com acesso a esta seção poderá restaurar backups.
                      Isso pode representar um risco de segurança.
                    </AlertDescription>
                  </>
                )}
              </Alert>
              
              <div className="pt-2">
                <Button 
                  onClick={() => {
                    toast.success('Configurações de acesso salvas com sucesso!');
                  }}
                >
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notificações e Alertas</CardTitle>
              <CardDescription>
                Configure quem receberá notificações sobre operações de backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-notifications"
                    checked={notificationConfig.emailNotifications}
                    onCheckedChange={(checked) => {
                      setNotificationConfig(prev => ({
                        ...prev,
                        emailNotifications: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="email-notifications">
                    Enviar notificações por email
                  </Label>
                </div>
                
                {notificationConfig.emailNotifications && (
                  <div className="pl-6 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email-recipients">Destinatários (separados por vírgula)</Label>
                      <Input
                        id="email-recipients"
                        value={notificationConfig.emailRecipients.join(', ')}
                        onChange={(e) => {
                          const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                          setNotificationConfig(prev => ({
                            ...prev,
                            emailRecipients: emails
                          }));
                        }}
                        placeholder="admin@empresa.com.br, coordenador@empresa.com.br"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-app-notifications"
                    checked={notificationConfig.inAppNotifications}
                    onCheckedChange={(checked) => {
                      setNotificationConfig(prev => ({
                        ...prev,
                        inAppNotifications: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="in-app-notifications">
                    Exibir notificações no sistema
                  </Label>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Quando notificar:</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notify-success"
                      checked={notificationConfig.notifyOnSuccess}
                      onCheckedChange={(checked) => {
                        setNotificationConfig(prev => ({
                          ...prev,
                          notifyOnSuccess: !!checked
                        }));
                      }}
                    />
                    <Label htmlFor="notify-success">
                      Backup concluído com sucesso
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notify-failure"
                      checked={notificationConfig.notifyOnFailure}
                      onCheckedChange={(checked) => {
                        setNotificationConfig(prev => ({
                          ...prev,
                          notifyOnFailure: !!checked
                        }));
                      }}
                    />
                    <Label htmlFor="notify-failure">
                      Falha na execução de backup
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => {
                    toast.success('Configurações de notificação salvas com sucesso!');
                    
                    // Testar notificação
                    setTimeout(() => {
                      toast.success('Notificação de teste enviada');
                    }, 1000);
                  }}
                >
                  Salvar e Testar Notificações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Restauração */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Você está prestes a restaurar um backup. Esta ação irá sobrescrever os dados atuais.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackupForRestore && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Detalhes do Backup</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Data:</p>
                    <p>{selectedBackupForRestore.dateTime.toLocaleDateString('pt-BR')} às {selectedBackupForRestore.dateTime.toLocaleTimeString('pt-BR')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tipo:</p>
                    <p>{selectedBackupForRestore.type === 'completo' ? 'Completo' : 'Incremental'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tamanho:</p>
                    <p>{selectedBackupForRestore.size}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Status:</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Concluído
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Opções de Restauração</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="restore-database" 
                      checked={restoreOptions.restoreDatabase} 
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({...prev, restoreDatabase: !!checked}))
                      }
                    />
                    <Label htmlFor="restore-database">Restaurar Banco de Dados</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="restore-files" 
                      checked={restoreOptions.restoreFiles} 
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({...prev, restoreFiles: !!checked}))
                      }
                    />
                    <Label htmlFor="restore-files">Restaurar Arquivos</Label>
                  </div>
                </div>
                
                {securityConfig.requireAdminForRestore && (
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Senha de Administrador</Label>
                    <Input 
                      id="admin-password" 
                      type="password" 
                      value={restoreOptions.confirmPassword}
                      onChange={(e) => setRestoreOptions(prev => ({...prev, confirmPassword: e.target.value}))}
                      placeholder="Informe sua senha de administrador"
                    />
                  </div>
                )}
                
                {securityConfig.require2FAForRestore && (
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code">Código 2FA</Label>
                    <Input 
                      id="2fa-code" 
                      value={restoreOptions.code2FA}
                      onChange={(e) => setRestoreOptions(prev => ({...prev, code2FA: e.target.value}))}
                      placeholder="Informe o código do seu autenticador"
                    />
                  </div>
                )}
                
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>
                    Esta operação é irreversível e irá sobrescrever dados existentes. Certifique-se de que deseja prosseguir.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{progressMessage}</span>
                <span className="text-sm">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRestore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Confirmar Restauração'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-start">
            <Shield className="h-5 w-5 mr-2 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-blue-700">Informações de Segurança</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <p>Este módulo de backup protege os dados críticos do sistema. Configure backups regulares 
          e verifique o histórico periodicamente para garantir a integridade dos seus dados.
          Recomendamos manter pelo menos três destinos diferentes de backup para máxima segurança.</p>
        </CardContent>
      </Card>
    </div>
  );
} 