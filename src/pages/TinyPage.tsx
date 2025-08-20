import React, { useState } from 'react';
import TinyDashboard from '../components/tiny/TinyDashboard';
import ClientesTiny from '../components/tiny/ClientesTiny';
import PedidosTiny from '../components/tiny/PedidosTiny';
import TinyConfigForm from '../components/integrations/TinyConfigForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Settings } from 'lucide-react';
import { tinyService, TinyServiceProvider } from '../lib/integrations/tiny/tinyServiceFactory';
import { tinyConfig } from '../lib/integrations/tiny/tinyConfig';

/**
 * Página principal de integração com o Tiny ERP
 * Gerencia a navegação entre Dashboard, Clientes e Pedidos
 * 
 * O componente usa:
 * - tinyService.getClientes() para exibir contatos
 * - tinyService.getPedidos() para exibir pedidos
 * - tinyService.testConnection() para verificar a conexão
 */
const TinyPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showConfig, setShowConfig] = useState(false);

  // Função para sincronizar dados de todos os componentes
  const handleSyncData = async (): Promise<void> => {
    console.log('Sincronizando dados do Tiny...');
    try {
      // Testar a conexão antes de sincronizar
      const connected = await tinyService.testConnection();
      if (!connected) {
        console.error('Não foi possível conectar ao Tiny. Verifique sua configuração.');
        return;
      }
      
      // Cada componente fará sua própria sincronização quando receber o sinal
      console.log('Conexão com Tiny estabelecida, sincronização em andamento');
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Integração Tiny ERP</h1>
        <Button 
          variant="outline" 
          onClick={() => setShowConfig(!showConfig)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurar Integração
        </Button>
      </div>

      {showConfig ? (
        <TinyConfigForm onSave={() => setShowConfig(false)} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <TinyDashboard onSync={handleSyncData} />
          </TabsContent>
          
          <TabsContent value="clientes">
            <ClientesTiny onSync={handleSyncData} />
          </TabsContent>
          
          <TabsContent value="pedidos">
            <PedidosTiny onSync={handleSyncData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

/**
 * Componente wrapper que fornece o TinyServiceProvider
 */
const TinyPage: React.FC = () => {
  return (
    <TinyServiceProvider value={tinyService}>
      <TinyPageContent />
    </TinyServiceProvider>
  );
};

export default TinyPage; 