import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Settings as SettingsIcon, List, Search, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Tipos básicos
interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  channels: string[];
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  useTLS: boolean;
  apiProvider?: 'sendgrid' | 'mailgun';
  apiKey?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

interface NotificationLog {
  id: string;
  eventId: string;
  userId: string;
  channel: 'in-app' | 'email';
  status: 'success' | 'error' | 'pending';
  error?: string;
  createdAt: Date;
}

export function NotificationSettings() {
  console.log('NotificationSettings: Componente completo renderizado');
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('events');
  
  // Estado para eventos de notificação (mock data)
  const [events, setEvents] = useState<NotificationEvent[]>([
    {
      id: 'order_created',
      name: 'Pedido Criado',
      description: 'Quando um novo pedido é criado',
      category: 'Pedidos',
      enabled: true,
      channels: ['in-app', 'email']
    },
    {
      id: 'order_status_changed',
      name: 'Status do Pedido Alterado',
      description: 'Quando o status de um pedido é alterado',
      category: 'Pedidos',
      enabled: true,
      channels: ['in-app', 'email']
    },
    {
      id: 'comment_added',
      name: 'Novo Comentário',
      description: 'Quando um novo comentário é adicionado',
      category: 'Comunicação',
      enabled: true,
      channels: ['in-app']
    },
    {
      id: 'mention',
      name: 'Menção',
      description: 'Quando um usuário é mencionado',
      category: 'Comunicação',
      enabled: true,
      channels: ['in-app', 'email']
    }
  ]);
  
  // Estado para configuração de email
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPass: 'password',
    fromEmail: 'notifications@yourcompany.com',
    fromName: 'Sistema de Notificações',
    useTLS: true
  });
  
  // Estado para templates de email
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Novo Pedido',
      subject: 'Novo pedido criado: {{orderNumber}}',
      body: `
        <h2>Novo Pedido Criado</h2>
        <p>Olá {{userName}},</p>
        <p>Um novo pedido foi criado:</p>
        <ul>
          <li>Número: {{orderNumber}}</li>
          <li>Cliente: {{customerName}}</li>
          <li>Valor: {{orderValue}}</li>
        </ul>
        <p><a href="{{orderLink}}">Clique aqui para ver o pedido</a></p>
      `,
      variables: ['userName', 'orderNumber', 'customerName', 'orderValue', 'orderLink']
    },
    {
      id: '2',
      name: 'Status do Pedido Alterado',
      subject: 'Status do pedido {{orderNumber}} alterado para {{newStatus}}',
      body: `
        <h2>Status do Pedido Alterado</h2>
        <p>Olá {{userName}},</p>
        <p>O status do pedido {{orderNumber}} foi alterado:</p>
        <ul>
          <li>Status anterior: {{oldStatus}}</li>
          <li>Novo status: {{newStatus}}</li>
          <li>Alterado por: {{changedBy}}</li>
        </ul>
        <p><a href="{{orderLink}}">Clique aqui para ver o pedido</a></p>
      `,
      variables: ['userName', 'orderNumber', 'oldStatus', 'newStatus', 'changedBy', 'orderLink']
    }
  ]);
  
  // Estado para logs de notificação
  const [logs, setLogs] = useState<NotificationLog[]>([
    {
      id: '1',
      eventId: 'order_created',
      userId: 'user1',
      channel: 'email',
      status: 'success',
      createdAt: new Date(Date.now() - 3600000) // 1 hora atrás
    },
    {
      id: '2',
      eventId: 'order_created',
      userId: 'user2',
      channel: 'in-app',
      status: 'success',
      createdAt: new Date(Date.now() - 7200000) // 2 horas atrás
    },
    {
      id: '3',
      eventId: 'order_status_changed',
      userId: 'user1',
      channel: 'email',
      status: 'error',
      error: 'Falha na conexão com o servidor SMTP',
      createdAt: new Date(Date.now() - 86400000) // 1 dia atrás
    }
  ]);
  
  // Estados para controle de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  
  // Função para alternar o estado de ativação de um evento
  const handleEventToggle = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, enabled: !event.enabled } : event
    ));
  };
  
  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Obter categorias únicas para o filtro
  const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))];
  
  // Salvar configurações de email
  const handleSaveEmailConfig = () => {
    setIsLoading(true);
    
    // Simular uma operação assíncrona
    setTimeout(() => {
      console.log('Configurações de email salvas:', emailConfig);
      setIsLoading(false);
      alert('Configurações de email salvas com sucesso!');
    }, 1000);
  };
  
  // Testar conexão de email
  const handleTestEmail = () => {
    setIsTesting(true);
    
    // Simular envio de email
    setTimeout(() => {
      console.log('Email de teste enviado usando a configuração:', emailConfig);
      setIsTesting(false);
      alert('Email de teste enviado com sucesso!');
    }, 1500);
  };
  
  // Atualizar template
  const handleUpdateTemplate = (templateId: string, updates: Partial<NotificationTemplate>) => {
    setTemplates(templates.map(template =>
      template.id === templateId ? { ...template, ...updates } : template
    ));
  };
  
  // Salvar template
  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(templates.map(template =>
        template.id === selectedTemplate.id ? selectedTemplate : template
      ));
      setSelectedTemplate(null);
    }
  };
  
  // Criar notificações de demonstração
  const handleCreateDemoNotifications = () => {
    const newLog: NotificationLog = {
      id: Date.now().toString(),
      eventId: 'demo',
      userId: 'current-user',
      channel: Math.random() > 0.5 ? 'in-app' : 'email',
      status: Math.random() > 0.2 ? 'success' : 'error',
      createdAt: new Date()
    };
    
    if (newLog.status === 'error') {
      newLog.error = 'Erro simulado para demonstração';
    }
    
    setLogs([newLog, ...logs]);
    alert('Notificação de demonstração criada. Verifique a aba de Logs.');
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            <Bell className="mr-2 h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="templates">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs">
            <List className="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Aba de Eventos */}
        <TabsContent value="events" className="space-y-4">
    <Card>
      <CardHeader>
              <CardTitle>Eventos de Notificação</CardTitle>
        <CardDescription>
                Configure quais eventos disparam notificações no sistema.
        </CardDescription>
      </CardHeader>
            <CardContent>
        <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
              </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'Todas as categorias' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
            
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {filteredEvents.map(event => (
                      <Card key={event.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.name}</h4>
                              <Badge variant="outline">{event.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`channels-${event.id}`}>Canais:</Label>
                              <div className="flex gap-2">
                                {event.channels.map(channel => (
                                  <Badge key={channel} variant="secondary">
                                    {channel === 'in-app' ? 'Sistema' : 'Email'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Switch
                              id={`event-${event.id}`}
                              checked={event.enabled}
                              onCheckedChange={() => handleEventToggle(event.id)}
                            />
              </div>
                        </CardContent>
                      </Card>
                    ))}
            </div>
                </ScrollArea>
                
                <div className="flex justify-end">
                  <Button onClick={handleCreateDemoNotifications}>
                    Criar Notificações de Demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Email */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure as integrações de email para envio de notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={emailConfig.smtpHost}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                      placeholder="smtp.seuservidor.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Porta</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailConfig.smtpPort}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Usuário</Label>
                    <Input
                      id="smtpUser"
                      value={emailConfig.smtpUser}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">Senha</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      value={emailConfig.smtpPass}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                      placeholder="********"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Email Remetente</Label>
                    <Input
                      id="fromEmail"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                      placeholder="notificacoes@suaempresa.com"
                    />
            </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nome Remetente</Label>
                    <Input
                      id="fromName"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                      placeholder="Sistema de Notificações"
                    />
          </div>
        </div>
        
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useTLS"
                    checked={emailConfig.useTLS}
                    onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, useTLS: checked })}
                  />
                  <Label htmlFor="useTLS">Usar TLS</Label>
                </div>

                <div className="space-y-2">
                  <Label>Provedor de API (Opcional)</Label>
                  <Select
                    value={emailConfig.apiProvider}
                    onValueChange={(value: 'sendgrid' | 'mailgun' | undefined) =>
                      setEmailConfig({ ...emailConfig, apiProvider: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um provedor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
            
                {emailConfig.apiProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave da API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={emailConfig.apiKey || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                      placeholder="Sua chave de API"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Enviando...' : 'Testar Email'}
                  </Button>
                  <Button
                    onClick={handleSaveEmailConfig}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Email</CardTitle>
              <CardDescription>
                Gerencie os templates de email para diferentes tipos de notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map(template => (
                  <Card key={template.id} className="p-0">
                    <CardContent className="p-4">
                      <div className="space-y-4">
            <div className="flex items-center justify-between">
                          <h4 className="font-medium">{template.name}</h4>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Editar Template de Email</DialogTitle>
                                <DialogDescription>
                                  Faça alterações no template de email para "{template.name}".
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`template-name-${template.id}`}>Nome</Label>
                                  <Input
                                    id={`template-name-${template.id}`}
                                    value={template.name}
                                    onChange={(e) => handleUpdateTemplate(template.id, { name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`template-subject-${template.id}`}>Assunto</Label>
                                  <Input
                                    id={`template-subject-${template.id}`}
                                    value={template.subject}
                                    onChange={(e) => handleUpdateTemplate(template.id, { subject: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`template-body-${template.id}`}>Corpo (HTML)</Label>
                                  <Textarea
                                    id={`template-body-${template.id}`}
                                    value={template.body}
                                    onChange={(e) => handleUpdateTemplate(template.id, { body: e.target.value })}
                                    className="h-[300px] font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Variáveis Disponíveis</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {template.variables.map(variable => (
                                      <Badge key={variable} variant="secondary">
                                        {`{{${variable}}}`}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" onClick={handleSaveTemplate}>
                                  Salvar Alterações
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-2">
                          <Label>Assunto</Label>
                          <p className="text-sm text-muted-foreground">{template.subject}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Corpo (HTML)</Label>
                          <div className="rounded-md bg-slate-50 p-4 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                            {template.body}
                          </div>
              </div>
                        <div className="space-y-2">
                          <Label>Variáveis</Label>
                          <div className="flex flex-wrap gap-2">
                            {template.variables.map(variable => (
                              <Badge key={variable} variant="secondary">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
            </div>
          </div>
        </div>
                    </CardContent>
                  </Card>
                ))}
                
                {templates.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum template encontrado</AlertTitle>
                    <AlertDescription>
                      Não há templates de email configurados no sistema.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Notificação</CardTitle>
              <CardDescription>
                Visualize o histórico de envio de notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {logs.length > 0 ? (
                    logs.map(log => (
                      <Card key={log.id} className="p-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={log.status === 'success' ? 'secondary' : log.status === 'error' ? 'destructive' : 'default'}>
                                  {log.status === 'success' ? 'Sucesso' : log.status === 'error' ? 'Erro' : 'Pendente'}
                                </Badge>
                                <Badge variant="outline">{log.channel === 'in-app' ? 'Sistema' : 'Email'}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {log.error && (
                                <p className="text-sm text-red-500 mt-2">{log.error}</p>
                              )}
                            </div>
                            {log.status === 'success' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : log.status === 'error' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
        </div>
      </CardContent>
    </Card>
                    ))
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Nenhum log encontrado</AlertTitle>
                      <AlertDescription>
                        Não há registros de logs de notificações no sistema.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 