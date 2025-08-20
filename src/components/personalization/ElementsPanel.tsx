import { Button } from '@/components/ui/button';
import {
  Type,
  Image,
  Phone,
  AtSign,
  Instagram,
  Trash2,
  Layers,
  FileText,
  PlusCircle,
  MoveUp,
  MoveDown,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignElement } from '@/types/personalization';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface ElementsPanelProps {
  onAddElement: (type: DesignElement['type']) => void;
  elements: DesignElement[];
  onRemoveElement: (id: string) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onMoveElementUp?: (id: string) => void;
  onMoveElementDown?: (id: string) => void;
}

export function ElementsPanel({
  onAddElement,
  elements,
  onRemoveElement,
  selectedElementId,
  onSelectElement,
  onDuplicateElement,
  onMoveElementUp,
  onMoveElementDown
}: ElementsPanelProps) {
  // Agrupar elementos por tipo para exibição organizada
  const textElements = elements.filter(el => el.type === 'text');
  const logoElements = elements.filter(el => el.type === 'logo' || el.type === 'image');
  const contactElements = elements.filter(el => el.type === 'contact' || el.type === 'social');

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-blue" />
          Elementos
        </CardTitle>
        <CardDescription>
          Adicione e organize os elementos do seu design
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="add">Adicionar</TabsTrigger>
            <TabsTrigger value="manage">
              Gerenciar
              {elements.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 text-xs">
                  {elements.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="mt-0">
            <div className="grid grid-cols-3 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto flex flex-col items-center justify-center gap-1 py-3 hover:border-brand-blue hover:bg-brand-blue/5"
                      onClick={() => onAddElement('text')}
                    >
                      <Type className="h-5 w-5" />
                      <span className="text-xs">Texto</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Adicionar texto personalizável</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto flex flex-col items-center justify-center gap-1 py-3 hover:border-brand-blue hover:bg-brand-blue/5"
                      onClick={() => onAddElement('logo')}
                    >
                      <Image className="h-5 w-5" />
                      <span className="text-xs">Logo</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Adicionar logo ou imagem</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto flex flex-col items-center justify-center gap-1 py-3 hover:border-brand-blue hover:bg-brand-blue/5"
                      onClick={() => onAddElement('contact')}
                    >
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Telefone</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Adicionar número de telefone</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto flex flex-col items-center justify-center gap-1 py-3 hover:border-brand-blue hover:bg-brand-blue/5"
                      onClick={() => onAddElement('social')}
                    >
                      <Instagram className="h-5 w-5" />
                      <span className="text-xs">Rede Social</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Adicionar conta de rede social</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto flex flex-col items-center justify-center gap-1 py-3 hover:border-brand-blue hover:bg-brand-blue/5"
                      onClick={() => onAddElement('email')}
                    >
                      <AtSign className="h-5 w-5" />
                      <span className="text-xs">Email</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Adicionar endereço de email</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="mt-0">
            {elements.length === 0 ? (
              <div className="text-center py-8 px-4 border rounded-md border-dashed">
                <PlusCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum elemento adicionado</p>
                <p className="text-xs text-gray-400 mt-1">Adicione elementos para começar a personalizar</p>
              </div>
            ) : (
              <ScrollArea className="h-[320px] pr-4">
                {textElements.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Textos
                    </h4>
                    {textElements.map((element) => (
                      <ElementItem 
                        key={element.id}
                        element={element}
                        isSelected={element.id === selectedElementId}
                        onSelect={onSelectElement}
                        onRemove={onRemoveElement}
                        onDuplicate={onDuplicateElement}
                        onMoveUp={onMoveElementUp}
                        onMoveDown={onMoveElementDown}
                      />
                    ))}
                  </div>
                )}
                
                {logoElements.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center">
                      <Image className="h-3.5 w-3.5 mr-1" />
                      Imagens
                    </h4>
                    {logoElements.map((element) => (
                      <ElementItem 
                        key={element.id}
                        element={element}
                        isSelected={element.id === selectedElementId}
                        onSelect={onSelectElement}
                        onRemove={onRemoveElement}
                        onDuplicate={onDuplicateElement}
                        onMoveUp={onMoveElementUp}
                        onMoveDown={onMoveElementDown}
                      />
                    ))}
                  </div>
                )}
                
                {contactElements.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Contatos
                    </h4>
                    {contactElements.map((element) => (
                      <ElementItem 
                        key={element.id}
                        element={element}
                        isSelected={element.id === selectedElementId}
                        onSelect={onSelectElement}
                        onRemove={onRemoveElement}
                        onDuplicate={onDuplicateElement}
                        onMoveUp={onMoveElementUp}
                        onMoveDown={onMoveElementDown}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ElementItemProps {
  element: DesignElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate?: ((id: string) => void) | undefined;
  onMoveUp?: ((id: string) => void) | undefined;
  onMoveDown?: ((id: string) => void) | undefined;
}

function ElementItem({ 
  element, 
  isSelected, 
  onSelect, 
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown
}: ElementItemProps) {
  let icon;
  let label = element.content;
  
  // Personalizar ícone e rótulo com base no tipo
  switch(element.type) {
    case 'text':
      icon = <Type className="h-3.5 w-3.5" />;
      break;
    case 'logo':
    case 'image':
      icon = <Image className="h-3.5 w-3.5" />;
      label = 'Logo/Imagem';
      break;
    case 'contact':
      icon = <Phone className="h-3.5 w-3.5" />;
      break;
    case 'social':
      icon = <Instagram className="h-3.5 w-3.5" />;
      break;
    case 'email':
      icon = <AtSign className="h-3.5 w-3.5" />;
      break;
  }
  
  return (
    <div 
      className={cn(
        "p-2 mb-1.5 rounded-md border flex items-center justify-between transition-all cursor-pointer group",
        isSelected 
          ? "bg-brand-blue/10 border-brand-blue"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
      onClick={() => onSelect(element.id)}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-sm flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm truncate" title={label}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDuplicate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(element.id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Duplicar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {onMoveUp && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(element.id);
                  }}
                >
                  <MoveUp className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Mover para cima</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {onMoveDown && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(element.id);
                  }}
                >
                  <MoveDown className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Mover para baixo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(element.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Excluir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
