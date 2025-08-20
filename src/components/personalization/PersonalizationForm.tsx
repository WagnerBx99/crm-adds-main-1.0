import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Instagram, 
  Facebook, 
  Music, 
  Link, 
  Upload, 
  Image, 
  Palette, 
  Info, 
  CheckCircle, 
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Estados brasileiros para autocomplete
const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Principais cidades por estado (exemplo simplificado)
const CIDADES_POR_ESTADO: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Petrópolis', 'Nova Iguaçu', 'Campos dos Goytacazes'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
  // Adicionar mais conforme necessário
};

interface PersonalizationData {
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  redes: {
    instagram: string;
    facebook: string;
    tiktok: string;
    outro: string;
  };
  logo: File | null;
  logoPreview: string;
  cor_impressao: 'branco' | 'preto' | 'custom';
  cor_custom: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface PersonalizationFormProps {
  onSubmit: (data: PersonalizationData) => void;
  onBack?: () => void;
  className?: string;
}

export default function PersonalizationForm({ 
  onSubmit, 
  onBack, 
  className = '' 
}: PersonalizationFormProps) {
  const [formData, setFormData] = useState<PersonalizationData>({
    telefone: '',
    whatsapp: '',
    cidade: '',
    estado: '',
    redes: {
      instagram: '',
      facebook: '',
      tiktok: '',
      outro: ''
    },
    logo: null,
    logoPreview: '',
    cor_impressao: 'branco',
    cor_custom: '#000000'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [samePhoneNumber, setSamePhoneNumber] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatação de telefone
  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  // Validação de URL
  const validateURL = (url: string): boolean => {
    if (!url) return true; // Campo opcional
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Validação de arquivo
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Apenas arquivos PNG ou PDF são permitidos';
    }
    
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 10MB';
    }
    
    return null;
  };

  // Atualizar campo
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Atualizar rede social
  const updateSocialNetwork = (network: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      redes: {
        ...prev.redes,
        [network]: value
      }
    }));
    
    // Limpar erro
    const errorKey = `redes.${network}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Sincronizar telefone e WhatsApp
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    updateField('telefone', formatted);
    
    if (samePhoneNumber) {
      updateField('whatsapp', formatted);
    }
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatPhone(value);
    updateField('whatsapp', formatted);
  };

  const handleSamePhoneToggle = (checked: boolean) => {
    setSamePhoneNumber(checked);
    if (checked) {
      updateField('whatsapp', formData.telefone);
    }
  };

  // Upload de arquivo
  const handleFileUpload = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoPreview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
    
    toast.success('Logo carregado com sucesso!');
  }, []);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Validação completa
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Telefone obrigatório
    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    // Cidade obrigatória
    if (!formData.cidade) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    // Estado obrigatório
    if (!formData.estado) {
      newErrors.estado = 'Estado é obrigatório';
    }

    // Validar URLs das redes sociais
    Object.entries(formData.redes).forEach(([network, url]) => {
      if (url && !validateURL(url)) {
        newErrors[`redes.${network}`] = 'URL deve começar com http:// ou https://';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar se formulário está válido
  const isFormValid = (): boolean => {
    return !!(
      formData.telefone &&
      formData.cidade &&
      formData.estado &&
      Object.keys(errors).length === 0
    );
  };

  // Submeter formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit(formData);
      toast.success('Personalização salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar personalização');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Personalize seu Produto
        </h1>
        <p className="text-lg text-gray-600">
          Forneça seus dados de contato, redes sociais e preferências de design
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Contato e Redes Sociais */}
        <div className="space-y-6">
          {/* Seção de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Dados de Contato
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Usaremos estes dados para entrar em contato sobre seu pedido</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={errors.telefone ? 'border-red-500' : ''}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.telefone}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => handleWhatsAppChange(e.target.value)}
                  disabled={samePhoneNumber}
                  className={samePhoneNumber ? 'bg-gray-100' : ''}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same-phone"
                    checked={samePhoneNumber}
                    onCheckedChange={handleSamePhoneToggle}
                  />
                  <Label htmlFor="same-phone" className="text-sm">
                    Mesmo número do telefone
                  </Label>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => {
                    updateField('estado', value);
                    updateField('cidade', ''); // Limpar cidade ao mudar estado
                  }}
                >
                  <SelectTrigger className={errors.estado ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.estado}
                  </p>
                )}
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                {formData.estado && CIDADES_POR_ESTADO[formData.estado] ? (
                  <Select
                    value={formData.cidade}
                    onValueChange={(value) => updateField('cidade', value)}
                  >
                    <SelectTrigger className={errors.cidade ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {CIDADES_POR_ESTADO[formData.estado].map((cidade) => (
                        <SelectItem key={cidade} value={cidade}>
                          {cidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="cidade"
                    placeholder="Digite sua cidade"
                    value={formData.cidade}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    className={errors.cidade ? 'border-red-500' : ''}
                  />
                )}
                {errors.cidade && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.cidade}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Redes Sociais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Redes Sociais
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Links para suas redes sociais (opcional)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Instagram */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Instagram
                </Label>
                <Input
                  placeholder="https://instagram.com/seu_perfil"
                  value={formData.redes.instagram}
                  onChange={(e) => updateSocialNetwork('instagram', e.target.value)}
                  className={errors['redes.instagram'] ? 'border-red-500' : ''}
                />
                {errors['redes.instagram'] && (
                  <p className="text-sm text-red-600">{errors['redes.instagram']}</p>
                )}
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  placeholder="https://facebook.com/seu_perfil"
                  value={formData.redes.facebook}
                  onChange={(e) => updateSocialNetwork('facebook', e.target.value)}
                  className={errors['redes.facebook'] ? 'border-red-500' : ''}
                />
                {errors['redes.facebook'] && (
                  <p className="text-sm text-red-600">{errors['redes.facebook']}</p>
                )}
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-black" />
                  TikTok
                </Label>
                <Input
                  placeholder="https://tiktok.com/@seu_perfil"
                  value={formData.redes.tiktok}
                  onChange={(e) => updateSocialNetwork('tiktok', e.target.value)}
                  className={errors['redes.tiktok'] ? 'border-red-500' : ''}
                />
                {errors['redes.tiktok'] && (
                  <p className="text-sm text-red-600">{errors['redes.tiktok']}</p>
                )}
              </div>

              {/* Outro */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-600" />
                  Outro
                </Label>
                <Input
                  placeholder="Digite o link da sua rede"
                  value={formData.redes.outro}
                  onChange={(e) => updateSocialNetwork('outro', e.target.value)}
                  className={errors['redes.outro'] ? 'border-red-500' : ''}
                />
                {errors['redes.outro'] && (
                  <p className="text-sm text-red-600">{errors['redes.outro']}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Logo e Cor */}
        <div className="space-y-6">
          {/* Seção de Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo da Empresa
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seu logo será impresso no produto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Envie seu logo em PNG ou PDF em alta resolução (300 dpi).</strong>
                  <br />
                  Fotos não são permitidas. Tamanho mínimo: 300 × 300 px.
                </AlertDescription>
              </Alert>

              {/* Área de Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData.logoPreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={formData.logoPreview}
                        alt="Preview do logo"
                        className="max-w-32 max-h-32 object-contain mx-auto"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            logo: null,
                            logoPreview: ''
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{formData.logo?.name}</p>
                      <p>{formData.logo && (formData.logo.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Arraste seu logo aqui
                      </p>
                      <p className="text-sm text-gray-600">
                        ou clique para selecionar
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.png,.pdf';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      Escolher Arquivo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Cor de Impressão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cor de Impressão
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cor que será usada para imprimir seu logo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.cor_impressao}
                onValueChange={(value) => updateField('cor_impressao', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="branco" id="branco" />
                  <Label htmlFor="branco" className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                    Branco
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preto" id="preto" />
                  <Label htmlFor="preto" className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-black rounded"></div>
                    Preto
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Outra cor</Label>
                </div>
              </RadioGroup>

              {/* Color Picker */}
              <AnimatePresence>
                {formData.cor_impressao === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.cor_custom}
                        onChange={(e) => updateField('cor_custom', e.target.value)}
                        className="w-12 h-12 rounded border border-gray-300"
                      />
                      <div>
                        <p className="font-medium">Cor selecionada</p>
                        <p className="text-sm text-gray-600">{formData.cor_custom}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sugestão de Otimização */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Para melhor nitidez, sugerimos usar cores sólidas com alto contraste. 
                  Evite gradientes suaves.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between mt-8">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 ml-auto"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processando...
            </>
          ) : (
            <>
              Avançar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Indicador de Campos Obrigatórios */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Campos marcados com * são obrigatórios
        </p>
        {!isFormValid() && (
          <Badge variant="outline" className="mt-2">
            {Object.keys(errors).length > 0 
              ? `${Object.keys(errors).length} erro(s) encontrado(s)`
              : 'Preencha todos os campos obrigatórios'
            }
          </Badge>
        )}
      </div>
    </div>
  );
} 