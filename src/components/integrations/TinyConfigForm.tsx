import React, { useState, useEffect } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { tinyConfig } from '../../lib/integrations/tiny/tinyConfig';
import { TINY_CONFIG } from '../../config';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { CacheService } from '../../lib/integrations/tiny/CacheService';

interface TinyConfigFormProps {
  onSave: () => void;
}

const TinyConfigForm: React.FC<TinyConfigFormProps> = ({ onSave }) => {
  const tinyService = useTinyService();
  const [token, setToken] = useState<string>(TINY_CONFIG.API_TOKEN || '');
  const [baseUrl, setBaseUrl] = useState<string>(TINY_CONFIG.API_BASE_URL || tinyConfig.baseUrl || '');
  const [clientId, setClientId] = useState<string>(tinyConfig.clientId || '');
  const [clientSecret, setClientSecret] = useState<string>(tinyConfig.clientSecret || '');
  const [useOAuth, setUseOAuth] = useState<boolean>(tinyConfig.useOAuth || false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

  // Verificar estado da conexão ao carregar o componente
  useEffect(() => {
    const verificarConexao = async () => {
      setIsLoading(true);
      try {
        const connected = await tinyService.testConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Erro ao verificar conexão com o Tiny:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    verificarConexao();
  }, [tinyService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Atualiza a configuração global
      TINY_CONFIG.API_TOKEN = token;
      TINY_CONFIG.API_BASE_URL = baseUrl;
      
      // Salvar configurações em localStorage para persistir
      localStorage.setItem('tiny_config', JSON.stringify({
        token,
        baseUrl,
        clientId: useOAuth ? clientId : '',
        clientSecret: useOAuth ? clientSecret : '',
        useOAuth
      }));

      console.log('[TinyConfigForm] Configuração salva:', { token, baseUrl, useOAuth });

      // Reinicializar o serviço com as novas configurações
      await tinyService.reinitialize({
        token,
        baseUrl,
        clientId: useOAuth ? clientId : '',
        clientSecret: useOAuth ? clientSecret : '',
        useOAuth,
        cache: false // Desativa cache temporariamente
      });

      // Limpar qualquer cache existente
      await clearCache();

      // Testar conexão
      const connected = await tinyService.testConnection();
      
      if (connected) {
        setIsConnected(true);
        setSuccessMessage('Conexão com o Tiny ERP estabelecida com sucesso!');
        setTimeout(() => onSave(), 1500); // Fecha após 1,5 segundos
      } else {
        throw new Error('Não foi possível estabelecer conexão com o Tiny ERP');
      }
    } catch (error: any) {
      console.error('Erro ao configurar conexão com o Tiny:', error);
      setErrorMessage(error.message || 'Falha ao conectar com o Tiny ERP. Verifique as credenciais e tente novamente.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para limpar o cache
  const clearCache = async () => {
    setIsClearingCache(true);
    try {
      // Limpar todos os itens em cache relacionados ao Tiny
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tiny_cache_') || key.startsWith('tiny_oauth_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Se estiver usando o CacheService
      CacheService.clearCache();
      
      console.log('[TinyConfigForm] Cache limpo com sucesso');
      setSuccessMessage('Cache limpo com sucesso!');
      
      // Atualizar o status da conexão
      const connected = await tinyService.testConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      setErrorMessage('Erro ao limpar cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <Card className="p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">Configuração da API Tiny</h2>
      
      {isConnected ? (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Conectado ao Tiny ERP</AlertTitle>
          <AlertDescription className="text-green-600">
            Usando {useOAuth ? 'OAuth (API v3)' : 'Token de Acesso (API v2)'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <XCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Desconectado do Tiny ERP</AlertTitle>
          <AlertDescription className="text-yellow-600">
            Configure suas credenciais para estabelecer conexão
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle className="text-green-700">Sucesso</AlertTitle>
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <Label>Método de Autenticação</Label>
          <RadioGroup
            value={useOAuth ? "oauth" : "token"}
            onValueChange={(value) => setUseOAuth(value === "oauth")}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oauth" id="oauth" />
              <Label htmlFor="oauth">OAuth 2.0 (API v3)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="token" id="token" />
              <Label htmlFor="token">Token (API v2)</Label>
            </div>
          </RadioGroup>
        </div>

        {!useOAuth && (
          <>
            <div className="mb-4">
              <Label htmlFor="token">Token de Acesso</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira o token de acesso da API Tiny"
                className="mt-1"
                required={!useOAuth}
              />
              <p className="text-xs text-gray-500 mt-1">
                O token pode ser obtido no painel administrativo do Tiny ERP em Integrações &gt; API
              </p>
            </div>

            <div className="mb-4">
              <Label htmlFor="baseUrl">URL da API</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.tiny.com.br/api2/"
                className="mt-1"
              />
            </div>
          </>
        )}

        {useOAuth && (
          <>
            <div className="mb-4">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1"
                required={useOAuth}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                type="password"
                id="clientSecret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="mt-1"
                required={useOAuth}
              />
            </div>
          </>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={clearCache}
            disabled={isClearingCache}
            className="flex items-center"
          >
            {isClearingCache ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Cache
              </>
            )}
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              'Salvar e Conectar'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-semibold text-blue-800">Informações sobre a API Tiny</h3>
        {!useOAuth ? (
          <p className="text-sm text-blue-700 mt-1">
            Você está usando a API v2 com Token de acesso. Este token permite acesso à API do Tiny ERP 
            para operações com clientes, produtos e pedidos. Se estiver tendo problemas, tente limpar o 
            cache ou obter um novo token no painel do Tiny.
          </p>
        ) : (
          <p className="text-sm text-blue-700 mt-1">
            A API v3 utiliza OAuth 2.0 para autenticação mais segura. As credenciais Client ID e Client Secret 
            são obtidas no painel de configuração de API do Tiny. Esta versão oferece mais recursos e melhor 
            desempenho.
          </p>
        )}
      </div>
    </Card>
  );
};

export default TinyConfigForm; 