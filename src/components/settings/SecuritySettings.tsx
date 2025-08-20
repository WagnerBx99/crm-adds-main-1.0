import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { 
  Shield, 
  Key, 
  Lock, 
  Users, 
  Clock, 
  Eye, 
  EyeOff,
  AlertTriangle, 
  History, 
  Bell, 
  RefreshCw,
  LogOut,
  Shield as ShieldIcon,
  UserX,
  FileText,
  X
} from 'lucide-react';
import { UserRole } from '@/types';
import { PermissionsMatrix } from './PermissionsMatrix';

// Tipos para configurações de segurança
interface SecurityConfig {
  auth: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      preventPasswordReuse: boolean;
      expirationDays: number;
    };
    sessionTimeout: number; // em minutos
    loginAttempts: number;
    blockDuration: number; // em minutos
    twoFactorAuth: boolean;
    bypassTwoFactorInDev: boolean;
    devModeEnabled: boolean;
  };
  tokens: {
    accessTokenExpiration: number; // em minutos
    refreshTokenExpiration: number; // em dias
    useSecureCookies: boolean;
    csrfProtection: boolean;
  };
  logs: {
    loginEvents: boolean;
    adminActions: boolean;
    dataChanges: boolean;
    accessAttempts: boolean;
    retentionDays: number;
  };
  notifications: {
    loginFromNewDevice: boolean;
    passwordChanged: boolean;
    accountLocked: boolean;
    roleMembershipChanged: boolean;
  };
}

// Estado inicial
const defaultConfig: SecurityConfig = {
  auth: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      preventPasswordReuse: true,
      expirationDays: 90
    },
    sessionTimeout: 30,
    loginAttempts: 5,
    blockDuration: 10,
    twoFactorAuth: false,
    bypassTwoFactorInDev: true,
    devModeEnabled: true
  },
  tokens: {
    accessTokenExpiration: 15,
    refreshTokenExpiration: 7,
    useSecureCookies: true,
    csrfProtection: true
  },
  logs: {
    loginEvents: true,
    adminActions: true,
    dataChanges: true,
    accessAttempts: true,
    retentionDays: 90
  },
  notifications: {
    loginFromNewDevice: true,
    passwordChanged: true,
    accountLocked: true,
    roleMembershipChanged: true
  }
};

// Amostra de registros de login para o painel de auditoria
interface LoginLog {
  id: string;
  userId: string;
  username: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}

const sampleLoginLogs: LoginLog[] = [
  {
    id: '1',
    userId: '1',
    username: 'admin@exemplo.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0',
    success: true
  },
  {
    id: '2',
    userId: '',
    username: 'usuario@exemplo.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    ipAddress: '192.168.1.5',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Safari/605.1.15',
    success: false,
    failureReason: 'Senha incorreta'
  },
  {
    id: '3',
    userId: '2',
    username: 'gestor@exemplo.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    success: true
  },
  {
    id: '4',
    userId: '',
    username: 'hacker@evil.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    ipAddress: '87.123.45.67',
    userAgent: 'Mozilla/5.0 (Linux; Android 12) Chrome/110.0.0.0',
    success: false,
    failureReason: 'Usuário não encontrado'
  }
];

// Componente principal
export function SecuritySettings() {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<string>('auth');
  const [logs, setLogs] = useState<LoginLog[]>(sampleLoginLogs);
  const [isDevMode, setIsDevMode] = useState(true);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Carregar configurações do localStorage ao iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('securityConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Erro ao carregar configurações de segurança:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage quando alteradas
  const saveConfig = (newConfig: SecurityConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('securityConfig', JSON.stringify(newConfig));
      toast.success('Configurações de segurança salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
      toast.error('Erro ao salvar configurações de segurança');
    }
  };

  // Atualizar configuração individual
  const updateConfig = <T extends unknown>(
    section: keyof SecurityConfig,
    key: string,
    value: T
  ) => {
    const newConfig = { ...config };
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      (newConfig[section] as any)[parentKey][childKey] = value;
    } else {
      (newConfig[section] as any)[key] = value;
    }
    saveConfig(newConfig);
  };

  // Toggle para valor booleano
  const toggleSetting = (
    section: keyof SecurityConfig,
    key: string
  ) => {
    const currentValue = key.includes('.')
      ? key.split('.').reduce((obj, k) => (obj as any)[k], config[section] as any)
      : (config[section] as any)[key];
    
    updateConfig(section, key, !currentValue);
  };

  // Rotina para simular logout de todas as sessões
  const handleLogoutAllSessions = () => {
    toast.success('Todas as sessões foram encerradas com sucesso');
  };

  // Rotina para regenerar chaves de segurança
  const handleRegenerateSecurityKeys = () => {
    toast.success('Chaves de segurança regeneradas com sucesso');
  };

  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações de Segurança</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as configurações de segurança, autenticação e políticas de acesso
          </p>
        </div>
        
        {/* Indicador de Modo Desenvolvimento */}
        {config.auth.devModeEnabled && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center gap-1 px-3 py-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Modo Desenvolvimento</span>
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>Autenticação</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Controle de Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="protection" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Proteção</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Auditoria</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Autenticação */}
        <TabsContent value="auth" className="space-y-4 mt-4">
          {/* Ambiente de Desenvolvimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Ambiente de Desenvolvimento
              </CardTitle>
              <CardDescription>
                Configurações aplicadas apenas em ambiente de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="devMode">Modo Desenvolvimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa facilidades para desenvolvimento e testes
                  </p>
                </div>
                <Switch
                  id="devMode"
                  checked={config.auth.devModeEnabled}
                  onCheckedChange={(checked) => {
                    updateConfig('auth', 'devModeEnabled', checked);
                    setIsDevMode(checked);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bypassTwoFactor">Bypass de 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Ignora a verificação em dois fatores em ambiente de desenvolvimento
                  </p>
                </div>
                <Switch
                  id="bypassTwoFactor"
                  checked={config.auth.bypassTwoFactorInDev}
                  onCheckedChange={(checked) => updateConfig('auth', 'bypassTwoFactorInDev', checked)}
                  disabled={!config.auth.devModeEnabled}
                />
              </div>

              <div className="pt-2">
                <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Estas configurações devem ser desativadas em ambiente de produção. 
                    O modo de desenvolvimento reduz a segurança do sistema.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Políticas de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Políticas de Senha
              </CardTitle>
              <CardDescription>
                Defina requisitos para senhas e ciclo de vida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Tamanho mínimo</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min={6}
                    max={16}
                    value={config.auth.passwordPolicy.minLength}
                    onChange={(e) => 
                      updateConfig('auth', 'passwordPolicy.minLength', parseInt(e.target.value) || 8)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Expiração (dias)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min={0}
                    max={365}
                    value={config.auth.passwordPolicy.expirationDays}
                    onChange={(e) => 
                      updateConfig('auth', 'passwordPolicy.expirationDays', parseInt(e.target.value) || 90)
                    }
                  />
                  <p className="text-xs text-muted-foreground">0 = sem expiração</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireUppercase">Exigir letra maiúscula</Label>
                  <Switch
                    id="requireUppercase"
                    checked={config.auth.passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => 
                      updateConfig('auth', 'passwordPolicy.requireUppercase', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireLowercase">Exigir letra minúscula</Label>
                  <Switch
                    id="requireLowercase"
                    checked={config.auth.passwordPolicy.requireLowercase}
                    onCheckedChange={(checked) => 
                      updateConfig('auth', 'passwordPolicy.requireLowercase', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireNumbers">Exigir números</Label>
                  <Switch
                    id="requireNumbers"
                    checked={config.auth.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => 
                      updateConfig('auth', 'passwordPolicy.requireNumbers', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireSymbols">Exigir símbolos</Label>
                  <Switch
                    id="requireSymbols"
                    checked={config.auth.passwordPolicy.requireSymbols}
                    onCheckedChange={(checked) => 
                      updateConfig('auth', 'passwordPolicy.requireSymbols', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="preventPasswordReuse">Impedir reutilização de senhas</Label>
                  <Switch
                    id="preventPasswordReuse"
                    checked={config.auth.passwordPolicy.preventPasswordReuse}
                    onCheckedChange={(checked) => 
                      updateConfig('auth', 'passwordPolicy.preventPasswordReuse', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Sessão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configurações de Sessão
              </CardTitle>
              <CardDescription>
                Defina parâmetros para sessões de usuário e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={5}
                    max={240}
                    value={config.auth.sessionTimeout}
                    onChange={(e) => 
                      updateConfig('auth', 'sessionTimeout', parseInt(e.target.value) || 30)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Tentativas de login</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    min={3}
                    max={10}
                    value={config.auth.loginAttempts}
                    onChange={(e) => 
                      updateConfig('auth', 'loginAttempts', parseInt(e.target.value) || 5)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockDuration">Duração do bloqueio (minutos)</Label>
                  <Input
                    id="blockDuration"
                    type="number"
                    min={1}
                    max={60}
                    value={config.auth.blockDuration}
                    onChange={(e) => 
                      updateConfig('auth', 'blockDuration', parseInt(e.target.value) || 10)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twoFactorAuth">Autenticação em dois fatores</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      id="twoFactorAuth"
                      checked={config.auth.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        updateConfig('auth', 'twoFactorAuth', checked)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.auth.twoFactorAuth ? 'Ativada' : 'Desativada'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogoutAllSessions}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Encerrar todas as sessões ativas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Controle de Acesso */}
        <TabsContent value="access" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Perfis de Usuários
              </CardTitle>
              <CardDescription>
                Configurações de perfis e permissões no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Matriz MASTER */}
                <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">MASTER</Badge>
                      <span className="font-medium">Administrador</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Acesso total</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usuários com acesso total ao sistema, incluindo configurações críticas de segurança,
                    gerenciamento de todos os usuários e operações sensíveis.
                  </p>
                </div>

                {/* Matriz GESTOR */}
                <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">GESTOR</Badge>
                      <span className="font-medium">Gestor</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Acesso administrativo limitado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pode gerenciar usuários comuns, acessar configurações operacionais 
                    e gerenciar ordens de serviço e workflows.
                  </p>
                </div>

                {/* Matriz PRESTADOR */}
                <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">PRESTADOR</Badge>
                      <span className="font-medium">Prestador de Serviço</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Acesso operacional</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso limitado apenas para execução das suas tarefas, 
                    visualização de suas ordens e atualização de status.
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4" onClick={() => setShowPermissionsMatrix(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar matriz detalhada de permissões
              </Button>

              {showPermissionsMatrix && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Matriz de Permissões</h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPermissionsMatrix(false)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <PermissionsMatrix />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Bloqueio Automático
              </CardTitle>
              <CardDescription>
                Regras para bloqueio automático de contas por inatividade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inactivityBlocking">Bloqueio por inatividade</Label>
                  <Select defaultValue="90">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Desativado</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notifyBefore">Notificar antes do bloqueio</Label>
                  <Select defaultValue="7">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 dias antes</SelectItem>
                      <SelectItem value="7">7 dias antes</SelectItem>
                      <SelectItem value="14">14 dias antes</SelectItem>
                      <SelectItem value="30">30 dias antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoAccountRevoke">Desativar conta após 6 meses de bloqueio</Label>
                  <Switch id="autoAccountRevoke" defaultChecked={true} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Proteção */}
        <TabsContent value="protection" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Tokens e Cookies
              </CardTitle>
              <CardDescription>
                Configurações para tokens JWT e cookies de sessão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accessTokenExpiration">Expiração de token de acesso (minutos)</Label>
                  <Input
                    id="accessTokenExpiration"
                    type="number"
                    min={5}
                    max={60}
                    value={config.tokens.accessTokenExpiration}
                    onChange={(e) => 
                      updateConfig('tokens', 'accessTokenExpiration', parseInt(e.target.value) || 15)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refreshTokenExpiration">Expiração de refresh token (dias)</Label>
                  <Input
                    id="refreshTokenExpiration"
                    type="number"
                    min={1}
                    max={30}
                    value={config.tokens.refreshTokenExpiration}
                    onChange={(e) => 
                      updateConfig('tokens', 'refreshTokenExpiration', parseInt(e.target.value) || 7)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useSecureCookies">Usar cookies seguros (HTTPS)</Label>
                  <Switch
                    id="useSecureCookies"
                    checked={config.tokens.useSecureCookies}
                    onCheckedChange={(checked) => 
                      updateConfig('tokens', 'useSecureCookies', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="csrfProtection">Proteção CSRF</Label>
                  <Switch
                    id="csrfProtection"
                    checked={config.tokens.csrfProtection}
                    onCheckedChange={(checked) => 
                      updateConfig('tokens', 'csrfProtection', checked)
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleRegenerateSecurityKeys}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar chaves de segurança
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações de Segurança
              </CardTitle>
              <CardDescription>
                Configure alertas de eventos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loginFromNewDevice">
                    Notificar login de novo dispositivo
                  </Label>
                  <Switch
                    id="loginFromNewDevice"
                    checked={config.notifications.loginFromNewDevice}
                    onCheckedChange={(checked) => 
                      updateConfig('notifications', 'loginFromNewDevice', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordChanged">
                    Notificar alteração de senha
                  </Label>
                  <Switch
                    id="passwordChanged"
                    checked={config.notifications.passwordChanged}
                    onCheckedChange={(checked) => 
                      updateConfig('notifications', 'passwordChanged', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="accountLocked">
                    Notificar bloqueio de conta
                  </Label>
                  <Switch
                    id="accountLocked"
                    checked={config.notifications.accountLocked}
                    onCheckedChange={(checked) => 
                      updateConfig('notifications', 'accountLocked', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="roleMembershipChanged">
                    Notificar alteração de perfil
                  </Label>
                  <Switch
                    id="roleMembershipChanged"
                    checked={config.notifications.roleMembershipChanged}
                    onCheckedChange={(checked) => 
                      updateConfig('notifications', 'roleMembershipChanged', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Auditoria */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configurações de Log
              </CardTitle>
              <CardDescription>
                Configure quais eventos devem ser registrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loginEvents">
                    Registrar eventos de login
                  </Label>
                  <Switch
                    id="loginEvents"
                    checked={config.logs.loginEvents}
                    onCheckedChange={(checked) => 
                      updateConfig('logs', 'loginEvents', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="adminActions">
                    Registrar ações administrativas
                  </Label>
                  <Switch
                    id="adminActions"
                    checked={config.logs.adminActions}
                    onCheckedChange={(checked) => 
                      updateConfig('logs', 'adminActions', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dataChanges">
                    Registrar alterações de dados
                  </Label>
                  <Switch
                    id="dataChanges"
                    checked={config.logs.dataChanges}
                    onCheckedChange={(checked) => 
                      updateConfig('logs', 'dataChanges', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="accessAttempts">
                    Registrar tentativas de acesso
                  </Label>
                  <Switch
                    id="accessAttempts"
                    checked={config.logs.accessAttempts}
                    onCheckedChange={(checked) => 
                      updateConfig('logs', 'accessAttempts', checked)
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retenção de logs (dias)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min={30}
                    max={365}
                    value={config.logs.retentionDays}
                    onChange={(e) => 
                      updateConfig('logs', 'retentionDays', parseInt(e.target.value) || 90)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Logs de Segurança
              </CardTitle>
              <CardDescription>
                Histórico recente de eventos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-4">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={cn(
                        "p-3 rounded-md border", 
                        log.success ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                      )}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-sm">
                          {log.username}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">
                          IP: {log.ipAddress}
                        </span>
                        <Badge 
                          variant={log.success ? "outline" : "destructive"}
                          className={cn(
                            "text-xs",
                            log.success 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          )}
                        >
                          {log.success ? "Sucesso" : "Falha"}
                        </Badge>
                      </div>
                      {!log.success && log.failureReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Motivo: {log.failureReason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.userAgent}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  Ver todos os logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 