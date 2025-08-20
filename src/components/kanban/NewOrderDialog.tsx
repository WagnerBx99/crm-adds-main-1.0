import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Customer, Order, Priority, Status, ArtworkImage } from '@/types';
import { customers } from '@/lib/data';
import { ChevronLeft, ChevronRight, Check, Save, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import CustomerSearch from './CustomerSearch';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  initialStatus?: Status | null;
}

// Função para obter produtos configurados do localStorage
const getConfiguredProducts = () => {
  const storedProducts = localStorage.getItem('products');
  if (storedProducts) {
    const configProducts = JSON.parse(storedProducts);
    // Filtrar apenas produtos ativos e visíveis na personalização
    return configProducts.filter(
      (p: any) => p.active && p.visibleInPersonalization
    );
  }
  return [];
};

export default function NewOrderDialog({ 
  open, 
  onOpenChange, 
  onAddOrder,
  initialStatus = null
}: NewOrderDialogProps) {
  // Estado para controlar o passo atual do formulário
  const [currentStep, setCurrentStep] = useState(1);
  const [description, setDescription] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [status, setStatus] = useState<Status>('FAZER');
  const [priority, setPriority] = useState<Priority>('normal');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [products, setProducts] = useState<{ id: string; name: string; quantity: number }[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  
  // Novos estados para personalização e logos
  const [personalizationDetails, setPersonalizationDetails] = useState('');
  const [artworkImages, setArtworkImages] = useState<ArtworkImage[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estado para armazenar os produtos configurados
  const [configuredProducts, setConfiguredProducts] = useState<any[]>([]);

  // Carregar produtos configurados quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      setConfiguredProducts(getConfiguredProducts());
    }
  }, [open]);

  // Validação em tempo real
  const [errors, setErrors] = useState<{
    customer?: string;
  }>({});

  // Resetar o formulário quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      resetForm();
      setCurrentStep(1);
      // Definir o status inicial se fornecido
      if (initialStatus) {
        setStatus(initialStatus);
      }
    }
  }, [open, initialStatus]);

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    const selectedProduct = configuredProducts.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;
    
    const newProducts = [
      ...products,
      {
        id: `prod-${Date.now()}`,
        name: selectedProduct.name,
        quantity: parseInt(selectedQuantity.toString()) || 1
      }
    ];
    
    setProducts(newProducts);
    setSelectedProductId('');
    setSelectedQuantity(1);
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setErrors(prev => ({ ...prev, customer: undefined }));
    console.log('Cliente selecionado:', customer);
  };

  const handleCustomerError = (error: string) => {
    setErrors(prev => ({ ...prev, customer: error }));
  };

  // Função para lidar com o upload de logos
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      // Validar tipo de arquivo - aceitar imagens e PDFs
      const allowedTypes = ['image/', 'application/pdf'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));

      if (!isValidType) {
        toast.error(`Arquivo "${file.name}": Por favor, selecione apenas imagens (PNG, JPG) ou PDFs`);
        return;
      }

      // Validar tamanho (10MB para PDFs, 5MB para imagens)
      let maxSize = 5 * 1024 * 1024; // 5MB para imagens
      if (file.type === 'application/pdf') {
        maxSize = 10 * 1024 * 1024; // 10MB para PDFs
      }

      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        toast.error(`Arquivo "${file.name}": Deve ter no máximo ${maxSizeMB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage: ArtworkImage = {
            id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url: event.target.result as string,
            name: file.name,
            type: file.type,
            createdAt: new Date(),
            uploadedBy: 'Usuário atual'
          };
          
          setArtworkImages(prev => [...prev, newImage]);
          
          let fileTypeText = 'arquivo';
          if (file.type === 'application/pdf') fileTypeText = 'PDF';
          else if (file.type.startsWith('image/')) fileTypeText = 'logo';
          
          toast.success(`${fileTypeText} "${file.name}" anexado com sucesso!`);
        }
      };
      reader.readAsDataURL(file);
    });

    // Limpar o input para permitir selecionar os mesmos arquivos novamente se necessário
    e.target.value = '';
  };

  // Função para remover uma logo
  const handleRemoveLogo = (imageId: string) => {
    setArtworkImages(prev => prev.filter(img => img.id !== imageId));
  };

  const validateStep = (step: number): boolean => {
    let isValid = true;
    const newErrors: {customer?: string} = {};

    if (step === 1) {
      if (!selectedCustomer) {
        newErrors.customer = 'Selecione um cliente';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!selectedCustomer) {
      toast.error('Cliente inválido');
      return;
    }

    const newOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'history'> = {
      title: selectedCustomer.name,
      description: description || undefined,
      customer: selectedCustomer,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo || undefined,
      products: products.length > 0 ? products : undefined,
      personalizationDetails: personalizationDetails || undefined,
      artworkImages: artworkImages.length > 0 ? artworkImages : [],
      labels: [],
      comments: [],
      attachments: [],
      artworkComments: []
    };

    onAddOrder(newOrder);
    resetForm();
    onOpenChange(false);
    toast.success('Pedido criado com sucesso!');
  };

  const resetForm = () => {
    setDescription('');
    setSelectedCustomer(null);
    setStatus('FAZER');
    setPriority('normal');
    setSelectedProductId('');
    setSelectedQuantity(1);
    setProducts([]);
    setDueDate('');
    setAssignedTo('');
    setPersonalizationDetails('');
    setArtworkImages([]);
    setErrors({});
  };

  // Renderizar o conteúdo com base no passo atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid gap-4 py-4">
            <CustomerSearch
              selectedCustomerId={selectedCustomer?.id}
              onCustomerSelect={handleCustomerSelect}
              onError={handleCustomerError}
              className={errors.customer ? "border-red-500" : ""}
            />
            {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Status)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAZER">Fazer</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste</SelectItem>
                    <SelectItem value="APROVACAO">Aprovação</SelectItem>
                    <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                    <SelectItem value="APROVADO">Aprovado</SelectItem>
                    <SelectItem value="PRODUCAO">Produção</SelectItem>
                    <SelectItem value="EXPEDICAO">Expedição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Produtos</Label>
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {configuredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    min="1"
                    placeholder="Quantidade"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    className="w-32"
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddProduct}
                    disabled={!selectedProductId}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {products.length > 0 && (
                <div className="mt-2 space-y-2">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">Qtd: {product.quantity}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="h-8 w-8 p-0 text-gray-500"
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="personalizationDetails">Detalhes da Personalização</Label>
              <Textarea
                id="personalizationDetails"
                value={personalizationDetails}
                onChange={(e) => setPersonalizationDetails(e.target.value)}
                placeholder="Descreva como será a personalização do produto"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label>Logos e Artes</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*,application/pdf"
                  multiple
                />
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => logoInputRef.current?.click()}
                  className="mx-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar Logos
                </Button>
                
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: PNG, JPG, PDF. Tamanho máximo: 5MB para imagens, 10MB para PDFs
                </p>
              </div>

              {artworkImages.length > 0 && (
                <div className="mt-4">
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {artworkImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center h-20">
                            {image.type === 'application/pdf' ? (
                              <div className="text-center">
                                <FileText className="h-6 w-6 text-red-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-600 font-medium">PDF</p>
                              </div>
                            ) : (
                              <img 
                                src={image.url} 
                                alt={image.name} 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-5 w-5 absolute -top-1 -right-1 opacity-80 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveLogo(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs truncate mt-1" title={image.name}>
                            {image.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {artworkImages.length > 6 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {artworkImages.length} arquivo(s) anexado(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid gap-4 py-4">
            <h3 className="font-medium text-lg">Resumo do Pedido</h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-3">
              <div>
                <span className="text-sm text-gray-500">Cliente:</span>
                <p className="font-medium">{selectedCustomer?.name} - {selectedCustomer?.company}</p>
              </div>
              
              {description && (
                <div>
                  <span className="text-sm text-gray-500">Descrição:</span>
                  <p>{description}</p>
                </div>
              )}
              
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <p>{status}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Prioridade:</span>
                  <p>{priority === 'high' ? 'Alta' : 'Normal'}</p>
                </div>
              </div>
              
              {products.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Produtos:</span>
                  <ul className="list-disc list-inside">
                    {products.map(product => (
                      <li key={product.id}>{product.name} (Qtd: {product.quantity})</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {personalizationDetails && (
                <div>
                  <span className="text-sm text-gray-500">Detalhes da Personalização:</span>
                  <p>{personalizationDetails}</p>
                </div>
              )}
              
              {artworkImages.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Logos Anexadas:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {artworkImages.map(image => (
                      <div key={image.id} className="w-12 h-12 relative rounded-md overflow-hidden border border-gray-200">
                        <img 
                          src={image.url} 
                          alt={image.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {dueDate && (
                <div>
                  <span className="text-sm text-gray-500">Data de Entrega:</span>
                  <p>{new Date(dueDate).toLocaleDateString()}</p>
                </div>
              )}
              
              {assignedTo && (
                <div>
                  <span className="text-sm text-gray-500">Responsável:</span>
                  <p>{assignedTo}</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Renderizar os indicadores de progresso
  const renderProgressIndicators = () => {
    return (
      <div className="flex justify-center mb-4">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step} 
            className="flex items-center"
            onClick={() => {
              if (step < currentStep) {
                setCurrentStep(step);
              }
            }}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                step === currentStep 
                  ? 'bg-brand-blue text-white' 
                  : step < currentStep 
                    ? 'bg-green-100 text-green-600 border border-green-200' 
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step < currentStep ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 4 && (
              <div 
                className={`w-10 h-1 ${
                  step < currentStep ? 'bg-green-200' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo pedido
          </DialogDescription>
        </DialogHeader>

        {renderProgressIndicators()}
        {renderStepContent()}
        
        <DialogFooter>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} className="mr-auto">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Criar Pedido
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 