import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  Mail,
  Instagram, 
  Facebook, 
  Music, 
  Link, 
  Upload, 
  Palette, 
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  X,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { maskPhone } from '@/services/contactService';

interface PersonalizationData {
  // Contato do Cliente (obrigatórios)
  telefone: string;
  whatsapp: string;
  // Contato do Cliente (opcionais)
  email: string;
  
  // Redes Sociais
  redes: {
    instagram: string;
    facebook: string;
    tiktok: string;
    outro: string;
    outroLabel: string; // Label dinâmico para "outro"
  };
  
  // Logo
  logo: File | null;
  logoPreview: string;
  
  // Cor da Impressão
  cor_impressao: 'branco' | 'preto' | 'outro';
  cor_custom: string;
  sugestao_contraste: string;
}

interface RestructuredPersonalizationFormProps {
  onSubmit: (data: PersonalizationData) => void;
  onBack: () => void;
  className?: string;
}

// Função para calcular contraste e sugerir cor
const calculateContrastSuggestion = (color: string): string => {
  // Converter hex para RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  if (luminance > 0.7) {
    return 'Para melhor legibilidade, considere usar uma cor mais escura ou aplicar sobre fundo escuro.';
  } else if (luminance < 0.3) {
    return 'Cor escura ideal para impressão. Garantirá boa legibilidade.';
  } else {
    return 'Cor com bom contraste. Adequada para impressão.';
  }
};

export default function RestructuredPersonalizationForm({ 
  onSubmit, 
  onBack, 
  className = '' 
}: RestructuredPersonalizationFormProps) {
  const [formData, setFormData] = useState<PersonalizationData>({
    telefone: '',
    whatsapp: '',
    email: '',
    redes: {
      instagram: '',
      facebook: '',
      tiktok: '',
      outro: '',
      outroLabel: 'LinkedIn'
    },
    logo: null,
    logoPreview: '',
    cor_impressao: 'branco',
    cor_custom: '#000000',
    sugestao_contraste: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validação em tempo real
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'telefone':
      case 'whatsapp':
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10) return 'Telefone deve ter pelo menos 10 dígitos';
        return '';
      case 'email':
        if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return 'E-mail inválido';
        }
        return '';
      case 'instagram':
        if (value && !value.match(/^https?:\/\/(www\.)?instagram\.com\/.+/)) {
          return 'URL do Instagram inválida (ex: https://instagram.com/seu_perfil)';
        }
        return '';
      case 'facebook':
        if (value && !value.match(/^https?:\/\/(www\.)?facebook\.com\/.+/)) {
          return 'URL do Facebook inválida (ex: https://facebook.com/sua_pagina)';
        }
        return '';
      case 'tiktok':
        if (value && !value.match(/^https?:\/\/(www\.)?tiktok\.com\/.+/)) {
          return 'URL do TikTok inválida (ex: https://tiktok.com/@seu_perfil)';
        }
        return '';
      default:
        return '';
    }
  }, []);

  // Atualizar dados do formulário
  const updateFormData = useCallback((field: string, value: string) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof PersonalizationData] as any),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });

    // Validar campo
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    // Atualizar sugestão de contraste para cor personalizada
    if (field === 'cor_custom') {
      const sugestao = calculateContrastSuggestion(value);
      setFormData(prev => ({ ...prev, sugestao_contraste: sugestao }));
    }
  }, [validateField]);

  // Upload de logo
  const handleLogoUpload = useCallback((file: File) => {
    // Validar formato
    if (!file.type.match(/^image\/png$/) && file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PNG ou PDF são aceitos. Não aceitamos fotos de logos.');
      return;
    }

    // Validar tamanho
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoPreview: e.target?.result as string
      }));
      toast.success('Logo carregado com sucesso!');
    };
    reader.readAsDataURL(file);
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
      handleLogoUpload(files[0]);
    }
  }, [handleLogoUpload]);

  // Verificar se todos os campos obrigatórios estão preenchidos
  const isFormValid = useCallback(() => {
    const hasRequiredFields = formData.telefone.trim() && formData.whatsapp.trim();
    const hasNoErrors = Object.values(errors).every(error => !error);
    return hasRequiredFields && hasNoErrors;
  }, [formData.telefone, formData.whatsapp, errors]);

  // Submeter formulário
  const handleSubmit = useCallback(() => {
    if (!isFormValid()) {
      toast.error('Preencha todos os campos obrigatórios corretamente');
      return;
    }

    onSubmit(formData);
  }, [formData, isFormValid, onSubmit]);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Personalização do Produto
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Configure as informações que aparecerão no seu produto personalizado. 
            Preencha apenas os dados que deseja incluir.
          </p>
        </motion.div>

        {/* Layout Principal: Preview à esquerda, Formulários à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* PREVIEW À ESQUERDA */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Prévisualização
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Simulação do produto */}
                  <div className="bg-gray-100 rounded-lg p-6 mb-4 min-h-[300px] flex flex-col items-center justify-center">
                    <div className="w-full max-w-[200px] bg-white rounded-lg shadow-lg p-4 text-center">
                      {/* Logo */}
                      {formData.logoPreview && (
                        <div className="mb-3">
                          <img 
                            src={formData.logoPreview} 
                            alt="Logo preview" 
                            className="w-16 h-16 mx-auto object-contain"
                          />
                        </div>
                      )}
                      
                      {/* Informações */}
                      <div className="space-y-2 text-sm">
                        {formData.telefone && (
                          <div className="flex items-center justify-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{formData.telefone}</span>
                          </div>
                        )}
                        
                        {formData.whatsapp && (
                          <div className="flex items-center justify-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{formData.whatsapp}</span>
                          </div>
                        )}
                        
                        {formData.email && (
                          <div className="flex items-center justify-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{formData.email}</span>
                          </div>
                        )}
                        
                        {formData.redes.instagram && (
                          <div className="flex items-center justify-center gap-1">
                            <Instagram className="h-3 w-3" />
                            <span className="text-xs">Instagram</span>
                          </div>
                        )}
                        
                        {formData.redes.facebook && (
                          <div className="flex items-center justify-center gap-1">
                            <Facebook className="h-3 w-3" />
                            <span className="text-xs">Facebook</span>
                          </div>
                        )}
                        
                        {formData.redes.tiktok && (
                          <div className="flex items-center justify-center gap-1">
                            <Music className="h-3 w-3" />
                            <span className="text-xs">TikTok</span>
                          </div>
                        )}
                        
                        {formData.redes.outro && (
                          <div className="flex items-center justify-center gap-1">
                            <Link className="h-3 w-3" />
                            <span className="text-xs">{formData.redes.outroLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações da cor */}
                  {formData.cor_impressao !== 'branco' && (
                    <div className="text-sm text-gray-600">
                      <strong>Cor de impressão:</strong> {
                        formData.cor_impressao === 'preto' ? 'Preto' : 
                        formData.cor_impressao === 'outro' ? formData.cor_custom : 'Branco'
                      }
                      {formData.cor_impressao === 'outro' && formData.sugestao_contraste && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <Info className="h-3 w-3 inline mr-1" />
                          {formData.sugestao_contraste}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* FORMULÁRIOS À DIREITA */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            
            {/* 1. CONTATO DO CLIENTE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="h-6 w-6 text-blue-600" />
                  Contato do Cliente
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Campos obrigatórios para contato direto com seus clientes
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Telefone - Obrigatório */}
                <div>
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Telefone *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => updateFormData('telefone', maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={errors.telefone ? 'border-red-500' : ''}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.telefone}
                    </p>
                  )}
                </div>

                {/* WhatsApp - Obrigatório */}
                <div>
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    WhatsApp *
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => updateFormData('whatsapp', maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={errors.whatsapp ? 'border-red-500' : ''}
                  />
                  {errors.whatsapp && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.whatsapp}
                    </p>
                  )}
                </div>

                {/* E-mail - Opcional */}
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    E-mail (opcional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. REDES SOCIAIS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Link className="h-6 w-6 text-blue-600" />
                  Redes Sociais
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Adicione suas redes sociais para divulgação (todos opcionais)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <div>
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.redes.instagram}
                    onChange={(e) => updateFormData('redes.instagram', e.target.value)}
                    placeholder="https://instagram.com/seu_perfil"
                    className={errors['redes.instagram'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.instagram'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors['redes.instagram']}
                    </p>
                  )}
                </div>

                {/* Facebook */}
                <div>
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-700" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={formData.redes.facebook}
                    onChange={(e) => updateFormData('redes.facebook', e.target.value)}
                    placeholder="https://facebook.com/sua_pagina"
                    className={errors['redes.facebook'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.facebook'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors['redes.facebook']}
                    </p>
                  )}
                </div>

                {/* TikTok */}
                <div>
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-black" />
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    value={formData.redes.tiktok}
                    onChange={(e) => updateFormData('redes.tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@seu_perfil"
                    className={errors['redes.tiktok'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.tiktok'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors['redes.tiktok']}
                    </p>
                  )}
                </div>

                {/* Outro com label dinâmico */}
                <div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Label htmlFor="outro-label" className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-gray-600" />
                        Tipo da rede
                      </Label>
                      <Input
                        id="outro-label"
                        value={formData.redes.outroLabel}
                        onChange={(e) => updateFormData('redes.outroLabel', e.target.value)}
                        placeholder="LinkedIn, YouTube, Site..."
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Label htmlFor="outro" className="text-sm text-gray-600">
                    URL da rede social
                  </Label>
                  <Input
                    id="outro"
                    value={formData.redes.outro}
                    onChange={(e) => updateFormData('redes.outro', e.target.value)}
                    placeholder="https://linkedin.com/in/seu_perfil"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. ENVIO DE LOGO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Envio de Logo
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Envie o logo da sua empresa em alta resolução
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {formData.logoPreview ? (
                    <div className="space-y-3">
                      <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={formData.logoPreview} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        Logo carregado com sucesso!
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, logo: null, logoPreview: '' }));
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium">Arraste seu logo aqui</p>
                        <p className="text-sm text-gray-600">ou clique para selecionar</p>
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          ⚠️ Apenas PNG ou PDF • Mínimo 300 dpi • Não aceitamos fotos
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Escolher Arquivo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. COR DA IMPRESSÃO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Palette className="h-6 w-6 text-blue-600" />
                  Cor da Impressão
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Escolha a cor para impressão dos elementos no produto
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Branco */}
                  <label className="flex flex-col items-center gap-2 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="cor_impressao"
                      value="branco"
                      checked={formData.cor_impressao === 'branco'}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={`w-12 h-12 bg-white border-2 rounded-lg ${
                      formData.cor_impressao === 'branco' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                    }`}></div>
                    <span className="font-medium">Branco</span>
                    {formData.cor_impressao === 'branco' && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </label>

                  {/* Preto */}
                  <label className="flex flex-col items-center gap-2 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="cor_impressao"
                      value="preto"
                      checked={formData.cor_impressao === 'preto'}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={`w-12 h-12 bg-black border-2 rounded-lg ${
                      formData.cor_impressao === 'preto' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                    }`}></div>
                    <span className="font-medium">Preto</span>
                    {formData.cor_impressao === 'preto' && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </label>

                  {/* Outro */}
                  <label className="flex flex-col items-center gap-2 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="cor_impressao"
                      value="outro"
                      checked={formData.cor_impressao === 'outro'}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div 
                      className={`w-12 h-12 border-2 rounded-lg ${
                        formData.cor_impressao === 'outro' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: formData.cor_custom }}
                    ></div>
                    <span className="font-medium">Outro</span>
                    {formData.cor_impressao === 'outro' && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </label>
                </div>

                {/* Seletor de cor personalizada */}
                <AnimatePresence>
                  {formData.cor_impressao === 'outro' && (
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
                          onChange={(e) => updateFormData('cor_custom', e.target.value)}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.cor_custom}
                          onChange={(e) => updateFormData('cor_custom', e.target.value)}
                          placeholder="#000000"
                          className="w-32"
                        />
                        <span className="text-sm text-gray-600">Código da cor</span>
                      </div>
                      
                      {formData.sugestao_contraste && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {formData.sugestao_contraste}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* BOTÃO REVISAR SOLICITAÇÃO - Sempre visível */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`shadow-lg hover:shadow-xl transition-all ${
                isFormValid() 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white px-8 py-3 text-lg font-medium`}
            >
              {isFormValid() ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Revisar Solicitação
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Preencha os campos obrigatórios
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 