import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DesignElement } from '@/types/personalization';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPhoneNumber } from '@/lib/personalization-data';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sliders, Edit3, Settings, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  selectedElement: DesignElement | null;
  onUpdateElement: (element: DesignElement) => void;
}

export function PropertiesPanel({ selectedElement, onUpdateElement }: PropertiesPanelProps) {
  const [localElement, setLocalElement] = useState<DesignElement | null>(null);

  // Sincronizar com as alterações do elemento selecionado
  useEffect(() => {
    setLocalElement(selectedElement);
  }, [selectedElement]);

  // Se não houver elemento selecionado, mostra mensagem
  if (!selectedElement || !localElement) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="h-5 w-5 text-brand-blue" />
            Propriedades
          </CardTitle>
          <CardDescription>
            Configure os elementos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PanelLeft className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground text-sm">
            Selecione um elemento para editar suas propriedades
          </p>
        </CardContent>
      </Card>
    );
  }

  // Função para atualizar o elemento com os novos valores
  const handleChange = (field: string, value: any) => {
    if (!localElement) return;

    // Atualiza o elemento local
    const updatedElement = { 
      ...localElement, 
      [field]: value 
    };
    
    setLocalElement(updatedElement);
    
    // Propaga a alteração para o componente pai
    onUpdateElement(updatedElement);
  };

  // Função para formatar números de telefone
  const handleTextChange = (field: string, value: string) => {
    if (!localElement) return;
    
    // Formata automaticamente números de telefone
    if (localElement.type === 'contact' && field === 'content') {
      value = formatPhoneNumber(value);
    }
    
    handleChange(field, value);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sliders className="h-5 w-5 text-brand-blue" />
          Propriedades
        </CardTitle>
        <CardDescription>
          Personalize o elemento selecionado
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none">
            <TabsTrigger value="content" className="rounded-none data-[state=active]:bg-gray-100">
              <Edit3 className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="style" className="rounded-none data-[state=active]:bg-gray-100">
              <Settings className="h-4 w-4 mr-2" />
              Estilo
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <TabsContent value="content" className="mt-0">
                {/* Conteúdo baseado no tipo do elemento */}
                {localElement.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Texto</Label>
                      <Textarea
                        placeholder="Digite seu texto aqui"
                        value={localElement.content}
                        onChange={(e) => handleTextChange('content', e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {localElement.type === 'contact' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Número de Telefone</Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={localElement.content}
                        onChange={(e) => handleTextChange('content', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato automático: (00) 00000-0000
                      </p>
                    </div>
                  </div>
                )}

                {localElement.type === 'email' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Endereço de Email</Label>
                      <Input
                        placeholder="seu@email.com"
                        value={localElement.content}
                        onChange={(e) => handleTextChange('content', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {localElement.type === 'social' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Usuário Rede Social</Label>
                      <Input
                        placeholder="@seuusuario"
                        value={localElement.content}
                        onChange={(e) => handleTextChange('content', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {(localElement.type === 'logo' || localElement.type === 'image') && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">URL da Imagem</Label>
                      <Input
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={localElement.content}
                        onChange={(e) => handleTextChange('content', e.target.value)}
                      />
                    </div>
                    <div className="bg-gray-50 border rounded-md p-3 flex items-center justify-center">
                      <img 
                        src={localElement.content} 
                        alt="Prévia" 
                        className="max-h-[100px] max-w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/200x200?text=Imagem+Inválida';
                        }} 
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="style" className="space-y-5 mt-0">
                <Accordion type="multiple" defaultValue={['position', 'appearance']}>
                  {/* Seção Posição e Tamanho */}
                  <AccordionItem value="position" className="border-b">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <span className="text-sm font-medium">Posição e Tamanho</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="mb-1.5 block text-xs">Posição X</Label>
                          <div className="flex">
                            <Input
                              type="number"
                              value={localElement.x}
                              onChange={(e) => handleChange('x', Number(e.target.value))}
                              min={0}
                              className="w-full"
                            />
                            <span className="ml-2 text-xs text-muted-foreground self-center">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-xs">Posição Y</Label>
                          <div className="flex">
                            <Input
                              type="number"
                              value={localElement.y}
                              onChange={(e) => handleChange('y', Number(e.target.value))}
                              min={0}
                              className="w-full"
                            />
                            <span className="ml-2 text-xs text-muted-foreground self-center">px</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="mb-1.5 block text-xs">Largura</Label>
                          <div className="flex">
                            <Input
                              type="number"
                              value={localElement.width}
                              onChange={(e) => handleChange('width', Number(e.target.value))}
                              min={10}
                              className="w-full"
                            />
                            <span className="ml-2 text-xs text-muted-foreground self-center">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-xs">Altura</Label>
                          <div className="flex">
                            <Input
                              type="number"
                              value={localElement.height}
                              onChange={(e) => handleChange('height', Number(e.target.value))}
                              min={10}
                              className="w-full"
                            />
                            <span className="ml-2 text-xs text-muted-foreground self-center">px</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-1.5 block text-xs">Rotação</Label>
                        <div className="flex items-center">
                          <Slider
                            value={[localElement.angle]}
                            min={0}
                            max={360}
                            step={1}
                            className="flex-1"
                            onValueChange={(value) => handleChange('angle', value[0])}
                          />
                          <span className="ml-4 text-xs text-muted-foreground">{localElement.angle}°</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Seção Aparência - Exibida apenas para elementos de texto */}
                  {(localElement.type === 'text' || localElement.type === 'contact' || 
                    localElement.type === 'social' || localElement.type === 'email') && (
                    <AccordionItem value="appearance" className="border-b">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="text-sm font-medium">Aparência do Texto</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="mb-4">
                          <Label className="mb-1.5 block text-xs">Fonte</Label>
                          <Select
                            value={localElement.fontFamily || 'Arial'}
                            onValueChange={(value) => handleChange('fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Courier New">Courier New</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mb-4">
                          <Label className="mb-1.5 block text-xs">Tamanho da Fonte</Label>
                          <div className="flex items-center">
                            <Slider
                              value={[localElement.fontSize || 16]}
                              min={8}
                              max={72}
                              step={1}
                              className="flex-1"
                              onValueChange={(value) => handleChange('fontSize', value[0])}
                            />
                            <span className="ml-4 text-xs text-muted-foreground">{localElement.fontSize || 16}px</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <Label className="mb-1.5 block text-xs">Cor do Texto</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={localElement.fill}
                              onChange={(e) => handleChange('fill', e.target.value)}
                              className="w-12 h-8 p-1"
                            />
                            <Input
                              type="text"
                              value={localElement.fill}
                              onChange={(e) => handleChange('fill', e.target.value)}
                              className="flex-1"
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="mb-1.5 block text-xs">Estilo de Fonte</Label>
                            <div className="flex">
                              <Button
                                type="button"
                                variant={localElement.fontWeight === 'bold' ? 'default' : 'outline'}
                                size="sm"
                                className="h-9 w-9 mr-1"
                                onClick={() => handleChange('fontWeight', localElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                              >
                                <Bold className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant={localElement.fontStyle === 'italic' ? 'default' : 'outline'}
                                size="sm"
                                className="h-9 w-9"
                                onClick={() => handleChange('fontStyle', localElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                              >
                                <Italic className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="mb-1.5 block text-xs">Inverter Cores</Label>
                            <div className="flex items-center h-9 space-x-2">
                              <Switch
                                checked={localElement.inverted}
                                onCheckedChange={(value) => handleChange('inverted', value)}
                                id="inverted"
                              />
                              <Label htmlFor="inverted" className="text-xs cursor-pointer">
                                {localElement.inverted ? 'Ativado' : 'Desativado'}
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="mb-0">
                          <Label className="mb-1.5 block text-xs">Alinhamento</Label>
                          <div className="flex">
                            <Button
                              type="button"
                              variant={(localElement.textAlign === 'left' || !localElement.textAlign) ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 flex-1 rounded-r-none"
                              onClick={() => handleChange('textAlign', 'left')}
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={localElement.textAlign === 'center' ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 flex-1 rounded-none border-l-0 border-r-0"
                              onClick={() => handleChange('textAlign', 'center')}
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={localElement.textAlign === 'right' ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 flex-1 rounded-none border-r-0"
                              onClick={() => handleChange('textAlign', 'right')}
                            >
                              <AlignRight className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={localElement.textAlign === 'justify' ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 flex-1 rounded-l-none"
                              onClick={() => handleChange('textAlign', 'justify')}
                            >
                              <AlignJustify className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
