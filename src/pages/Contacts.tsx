import { useState } from 'react';
import ContactList from '@/components/contacts/ContactList';
import SyncLogs from '@/components/contacts/SyncLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, History } from 'lucide-react';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<string>('contacts');
  const { theme } = useTheme();
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface-0">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-high mb-2">Contatos</h1>
            <p className="text-text-low">
              Gerencie seus contatos e sincronize com a Tiny ERP
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-6 pt-4">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-accent-primary/20 mb-6 sticky top-0 bg-surface-0 z-10 pb-2 pt-2">
            <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-surface-1">
              <TabsTrigger 
                value="contacts"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 font-medium transition-all hover:bg-accent-primary/10 data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Lista de Contatos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 font-medium transition-all hover:bg-accent-primary/10 data-[state=active]:shadow-sm"
              >
                <History className="h-4 w-4" />
                <span>Logs de Sincronização</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="contacts" className="mt-0 h-full">
              <ContactList />
            </TabsContent>
            <TabsContent value="logs" className="mt-0 h-full">
              <SyncLogs />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
