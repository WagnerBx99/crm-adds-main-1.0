import { Canvas } from 'fabric';
import { DesignElement } from '@/types/personalization';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Trash2,
  Text,
  Move,
  Image,
  Download,
  Save,
  Share,
  Copy,
  RotateCcw,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Palette,
  ArrowUpDown,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  ArrowUpRightFromSquare,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ToolbarEditProps {
  canvas: Canvas | null;
  selectedElement: DesignElement | null;
  onUpdateElement: (element: DesignElement) => void;
  onRemoveElement: (id: string) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateElement?: (id: string) => void;
  onDownload?: () => void;
  onTogglePanels?: () => void;
  isPanelsVisible?: boolean;
}

export function ToolbarEdit({
  canvas,
  selectedElement,
  onUpdateElement,
  onRemoveElement,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicateElement,
  onDownload,
  onTogglePanels,
  isPanelsVisible = true
}: ToolbarEditProps) {
  const [activeTextAlign, setActiveTextAlign] = useState<string>('left');
  const [showGrid, setShowGrid] = useState(false);
  const [showTextOptions, setShowTextOptions] = useState(false);

  // Manipular alterações de formatação de texto
  const handleTextFormatChange = (property: string, value: any) => {
    if (!selectedElement) return;

    onUpdateElement({
      ...selectedElement,
      [property]: value
    });

    if (property === 'textAlign') {
      setActiveTextAlign(value);
    }
  };

  // Manipular a exclusão de elementos
  const handleDeleteElement = () => {
    if (!selectedElement) return;
    onRemoveElement(selectedElement.id);
  };

  // Manipular a duplicação de elementos
  const handleDuplicateElement = () => {
    if (!selectedElement || !onDuplicateElement) return;
    onDuplicateElement(selectedElement.id);
  };

  // Verificar se o elemento selecionado é do tipo texto
  const isTextElement = selectedElement && ['text', 'contact', 'social', 'email'].includes(selectedElement.type);

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between w-full bg-white border rounded-md px-1.5 py-1 gap-3">
        {/* Grupo de histórico */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", !canUndo && "opacity-50 cursor-not-allowed")}
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Desfazer</p>
              <p className="text-xs text-muted-foreground">Ctrl+Z</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", !canRedo && "opacity-50 cursor-not-allowed")}
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Refazer</p>
              <p className="text-xs text-muted-foreground">Ctrl+Y</p>
            </TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Zoom controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Diminuir zoom</TooltipContent>
          </Tooltip>
          
          <Badge variant="outline" className="px-2 py-0 h-6 text-xs font-normal">
            {Math.round(zoomLevel * 100)}%
          </Badge>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Aumentar zoom</TooltipContent>
          </Tooltip>
        </div>
        
        {/* Seção do meio - formatação de texto quando texto selecionado */}
        <div className="flex items-center gap-1">
          {isTextElement && (
            <>
              {/* Opções de formatação de texto */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Negrito</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.fontStyle === 'italic' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Itálico</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={(selectedElement.textAlign === 'left' || !selectedElement.textAlign) ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Alinhar à esquerda</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.textAlign === 'center' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Centralizar</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.textAlign === 'right' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Alinhar à direita</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.textAlign === 'justify' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextFormatChange('textAlign', 'justify')}
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Justificar</TooltipContent>
              </Tooltip>
            </>
          )}
          
          {/* Mostramos uma mensagem quando nenhum elemento está selecionado */}
          {!selectedElement && (
            <span className="text-xs text-muted-foreground">
              Selecione um elemento para editar
            </span>
          )}
          
          {/* Mostramos uma mensagem quando o elemento selecionado não é de texto */}
          {selectedElement && !isTextElement && (
            <span className="text-xs text-muted-foreground">
              {selectedElement.type === 'logo' || selectedElement.type === 'image' 
                ? "Imagem selecionada" 
                : "Elemento selecionado"}
            </span>
          )}
        </div>
        
        {/* Grupo de ações à direita */}
        <div className="flex items-center gap-1">
          {/* Ações para elemento selecionado */}
          {selectedElement && (
            <>
              {onDuplicateElement && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDuplicateElement}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Duplicar</TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDeleteElement}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Excluir</TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="mx-1 h-6" />
            </>
          )}
          
          {/* Ações globais */}
          {onDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Baixar design</TooltipContent>
            </Tooltip>
          )}
          
          {/* Botão de toggle para os painéis laterais */}
          {onTogglePanels && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onTogglePanels}
                >
                  {isPanelsVisible ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isPanelsVisible ? "Ocultar painéis" : "Mostrar painéis"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
