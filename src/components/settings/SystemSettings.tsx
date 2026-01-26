import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Globe, 
  Palette, 
  Link, 
  Gauge, 
  User, 
  RotateCcw, 
  FileText,
  Upload,
  AlertCircle,
  Save,
  CheckCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Tipos para as configurações do sistema
interface SystemConfig {
  // Identidade e Aparência
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  
  // Parâmetros Globais
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  timezone: string;
  
  // Integrações
  apiKeys: {
    tinyErp?: string;
    otherServices?: Record<string, string>;
  };
  
  // Comportamento e Performance
  cacheLifetime: number;
  sessionTimeout: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // Personalização do Usuário
  defaultNotifications: boolean;
  darkMode: boolean;
}

// Configuração padrão
const defaultConfig: SystemConfig = {
  systemName: 'CRM ADDS',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: '#21add6',
  secondaryColor: '#f07d00',
  accentColor: '#0b4269',
  fontFamily: 'Inter, sans-serif',
  
  language: 'pt-BR',
  region: 'BR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  
  apiKeys: {},
  
  cacheLifetime: 60,
  sessionTimeout: 30,
  backupFrequency: 'daily',
  
  defaultNotifications: true,
  darkMode: false
};

// Componente de seletor de cores
function ColorPicker({ color, onChange }: { color: string, onChange: (color: string) => void }) {
  const [selectedColor, setSelectedColor] = useState(color);
  
  const colors = [
    '#21add6', '#f07d00', '#0b4269', '#e53935', '#43a047', 
    '#1e88e5', '#5e35b1', '#fb8c00', '#546e7a', '#8e24aa',
    '#3949ab', '#00acc1', '#7cb342', '#c0ca33', '#fdd835'
  ];
  
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    onChange(newColor);
  };
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value);
    onChange(e.target.value);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center">
            <div 
              className="h-5 w-5 rounded-full mr-2" 
              style={{ backgroundColor: selectedColor }}
            />
            <span>{selectedColor}</span>
          </div>
          <Palette className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {colors.map((c) => (
              <button
                key={c}
                className={`h-8 w-8 rounded-full border-2 ${selectedColor === c ? 'border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                onClick={() => handleColorChange(c)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-full border" 
              style={{ backgroundColor: selectedColor }}
            />
            <Input
              type="text"
              value={selectedColor}
              onChange={handleCustomColorChange}
              className="flex-1"
            />
            <Input
              type="color"
              value={selectedColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 p-0 border-0"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Componente de upload de imagem
function ImageUploader({ 
  imageUrl, 
  onImageChange, 
  label, 
  id 
}: { 
  imageUrl: string, 
  onImageChange: (url: string) => void, 
  label: string,
  id: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {imageUrl && (
          <div className="relative h-16 w-16 rounded border p-1">
            <img 
              src={imageUrl} 
              alt={label} 
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={handleButtonClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imageUrl ? 'Alterar' : `Carregar ${label}`}
        </Button>
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState('identity');
  const [config, setConfig] = useState<SystemConfig>(() => {
    // Tentar carregar configurações do localStorage
    const savedConfig = localStorage.getItem('system_config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error('Erro ao carregar configurações do sistema:', e);
      }
    }
    return defaultConfig;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Aplicar as cores do tema quando as configurações mudarem
  useEffect(() => {
    // Atualizar variáveis CSS para as cores do tema
    document.documentElement.style.setProperty('--primary', config.primaryColor);
    document.documentElement.style.setProperty('--secondary', config.secondaryColor);
    document.documentElement.style.setProperty('--accent', config.accentColor);
    
    // Atualizar o título da página
    document.title = config.systemName;
    
    // Atualizar o favicon se estiver definido
    if (config.faviconUrl && !config.faviconUrl.includes('favicon.ico')) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.setAttribute('rel', 'shortcut icon');
      link.setAttribute('href', config.faviconUrl);
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [config]);
  
  // Função para atualizar configurações
  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => {
      if (section === 'apiKeys') {
        return {
          ...prev,
          apiKeys: {
            ...prev.apiKeys,
            [field]: value
          }
        };
      }
      
      return {
        ...prev,
        [section]: value
      };
    });
  };
  
  // Função para salvar configurações
  const handleSaveConfig = () => {
    setIsLoading(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      localStorage.setItem('system_config', JSON.stringify(config));
      console.log('Configurações do sistema salvas:', config);
      setIsLoading(false);
      setSaveSuccess(true);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };
  
  // Função para restaurar configurações padrão
  const handleResetConfig = () => {
    if (confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.')) {
      setConfig(defaultConfig);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Configurações do Sistema</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações globais e preferências do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetConfig}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button 
            onClick={handleSaveConfig}
            disabled={isLoading}
          >
            {isLoading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
      
      {saveSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-800" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>
            As configurações foram salvas com sucesso.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap sticky top-0 bg-background z-10 pt-2 pb-2 border-b w-full overflow-visible">
          <div className="w-full flex flex-wrap justify-start gap-1">
            <TabsTrigger value="identity" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4" />
              <span>Identidade</span>
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4" />
              <span>Parâmetros</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm">
              <Link className="h-4 w-4" />
              <span>Integrações</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm">
              <Gauge className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all hover:bg-gray-100 data-[state=active]:shadow-sm">
              <User className="h-4 w-4" />
              <span>Personalização</span>
            </TabsTrigger>
          </div>
        </TabsList>
        
        {/* Aba de Identidade e Aparência */}
        <TabsContent value="identity" className="space-y-4">
          <Card>
        <CardHeader>
              <CardTitle>Identidade e Aparência</CardTitle>
          <CardDescription>
                Configure a identidade visual e aparência do sistema
          </CardDescription>
        </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">Nome do Sistema</Label>
                  <Input
                    id="systemName"
                    value={config.systemName}
                    onChange={(e) => updateConfig('systemName', '', e.target.value)}
                    placeholder="Digite o nome do sistema"
                    className="focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <ImageUploader
                  id="logoUpload"
                  label="Logotipo"
                  imageUrl={config.logoUrl}
                  onImageChange={(url) => updateConfig('logoUrl', '', url)}
                />
                
                <ImageUploader
                  id="faviconUpload"
                  label="Favicon"
                  imageUrl={config.faviconUrl}
                  onImageChange={(url) => updateConfig('faviconUrl', '', url)}
                />
              </div>
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-medium">Cores do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <ColorPicker
                    color={config.primaryColor}
                    onChange={(color) => updateConfig('primaryColor', '', color)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usada para botões, links e elementos de destaque
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <ColorPicker
                    color={config.secondaryColor}
                    onChange={(color) => updateConfig('secondaryColor', '', color)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usada para elementos complementares e ações secundárias
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <ColorPicker
                    color={config.accentColor}
                    onChange={(color) => updateConfig('accentColor', '', color)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usada para elementos que precisam de atenção especial
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="fontFamily">Família de Fonte</Label>
                <Select 
                  value={config.fontFamily}
                  onValueChange={(value) => updateConfig('fontFamily', '', value)}
                >
                  <SelectTrigger id="fontFamily" className="focus:ring-2 focus:ring-primary focus:ring-opacity-50">
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Fonte principal usada em toda a interface
                </p>
              </div>
              
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Visualização</h4>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="darkMode"
                      checked={config.darkMode}
                      onCheckedChange={(checked) => updateConfig('darkMode', '', checked)}
                    />
                    <Label htmlFor="darkMode" className="text-sm">Modo Escuro</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div 
                    className="p-3 rounded-md text-white flex items-center justify-center w-24 h-12 shadow-sm"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Primária
                  </div>
                  <div 
                    className="p-3 rounded-md text-white flex items-center justify-center w-24 h-12 shadow-sm"
                    style={{ backgroundColor: config.secondaryColor }}
                  >
                    Secundária
                  </div>
                  <div 
                    className="p-3 rounded-md text-white flex items-center justify-center w-24 h-12 shadow-sm"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    Destaque
                  </div>
                </div>
                <div className="mt-4 p-4 border rounded bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                    <span 
                      className="text-sm font-medium"
                      style={{ fontFamily: config.fontFamily }}
                    >
                      Exemplo de texto com a fonte {config.fontFamily.split(',')[0]}
                    </span>
                  </div>
                  <p className="text-xs" style={{ fontFamily: config.fontFamily }}>
                    Este é um exemplo de como o texto ficará com a fonte selecionada. 
                    A fonte deve ser legível e adequada para o uso em toda a interface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Parâmetros Globais */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Globais</CardTitle>
              <CardDescription>
                Configure os parâmetros globais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={config.language}
                    onValueChange={(value) => updateConfig('language', '', value)}
                  >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Região</Label>
                  <Select 
                    value={config.region}
                    onValueChange={(value) => updateConfig('region', '', value)}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BR">Brasil</SelectItem>
                      <SelectItem value="US">Estados Unidos</SelectItem>
                      <SelectItem value="EU">Europa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select 
                    value={config.dateFormat}
                    onValueChange={(value) => updateConfig('dateFormat', '', value)}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Selecione um formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Formato de Hora</Label>
                  <Select 
                    value={config.timeFormat}
                    onValueChange={(value) => updateConfig('timeFormat', '', value)}
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue placeholder="Selecione um formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={config.currency}
                    onValueChange={(value) => updateConfig('currency', '', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecione uma moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={config.timezone}
                    onValueChange={(value) => updateConfig('timezone', '', value)}
                  >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Selecione um fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Integrações */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações e Conectividade</CardTitle>
              <CardDescription>
                Configure integrações com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tinyErpKey">Chave API Tiny ERP</Label>
                  <Input
                    id="tinyErpKey"
                    type="password"
                    value={config.apiKeys.tinyErp || ''}
                    onChange={(e) => updateConfig('apiKeys', 'tinyErp', e.target.value)}
                  />
            </div>
            
<Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label>Documentação da API</Label>
                  <p className="text-sm text-muted-foreground">
                    Acesse a documentação completa da API do CRM ADDS para integrações personalizadas.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('http://31.97.253.85:3001/api/docs/', '_blank')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Abrir Documentação da API (Swagger)
                  </Button>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Informação</AlertTitle>
                  <AlertDescription>
                    Mais integrações serão implementadas em breve.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comportamento e Performance</CardTitle>
              <CardDescription>
                Configure parâmetros de performance do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cacheLifetime">Tempo de Cache (minutos)</Label>
                    <Input
                      id="cacheLifetime"
                      type="number"
                      min="0"
                      value={config.cacheLifetime}
                      onChange={(e) => updateConfig('cacheLifetime', '', parseInt(e.target.value))}
                    />
            </div>
            
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="1"
                      value={config.sessionTimeout}
                      onChange={(e) => updateConfig('sessionTimeout', '', parseInt(e.target.value))}
                    />
            </div>
          </div>
          
              <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Frequência de Backup</Label>
                  <Select 
                    value={config.backupFrequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      updateConfig('backupFrequency', '', value)
                    }
                  >
                    <SelectTrigger id="backupFrequency">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      
        {/* Aba de Personalização */}
        <TabsContent value="user" className="space-y-4">
      <Card>
        <CardHeader>
              <CardTitle>Personalização do Usuário</CardTitle>
          <CardDescription>
                Configure preferências padrão para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="defaultNotifications">Notificações Padrão</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar notificações por padrão para novos usuários
                    </p>
            </div>
                  <Switch
                    id="defaultNotifications"
                    checked={config.defaultNotifications}
                    onCheckedChange={(checked) => updateConfig('defaultNotifications', '', checked)}
                  />
            </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="darkMode">Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar tema escuro por padrão
                    </p>
            </div>
                  <Switch
                    id="darkMode"
                    checked={config.darkMode}
                    onCheckedChange={(checked) => updateConfig('darkMode', '', checked)}
                  />
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}