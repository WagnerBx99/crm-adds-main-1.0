import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Instagram, 
  Facebook, 
  Music, 
  Link, 
  Upload, 
  Palette, 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { maskPhone } from '@/services/contactService';
import ProductPreview from './ProductPreview';
import PersonalizationCheckbox from './PersonalizationCheckbox';

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

interface PersonalizationOptions {
  incluirTelefone: boolean;
  incluirWhatsapp: boolean;
  incluirLocalizacao: boolean;
  incluirInstagram: boolean;
  incluirFacebook: boolean;
  incluirTiktok: boolean;
  incluirOutraRede: boolean;
  incluirLogo: boolean;
  incluirCorPersonalizada: boolean;
}

interface UltraPremiumPersonalizationFormProps {
  onSubmit: (data: PersonalizationData) => void;
  onBack: () => void;
  className?: string;
}

const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

export default function UltraPremiumPersonalizationForm({ 
  onSubmit, 
  onBack, 
  className = '' 
}: UltraPremiumPersonalizationFormProps) {
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

  const [options, setOptions] = useState<PersonalizationOptions>({
    incluirTelefone: false,
    incluirWhatsapp: false,
    incluirLocalizacao: false,
    incluirInstagram: false,
    incluirFacebook: false,
    incluirTiktok: false,
    incluirOutraRede: false,
    incluirLogo: false,
    incluirCorPersonalizada: false
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação em tempo real
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'telefone':
      case 'whatsapp':
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10) return 'Telefone deve ter pelo menos 10 dígitos';
        return '';
      case 'instagram':
        if (value && !value.match(/^https?:\/\/(www\.)?instagram\.com\/.+/)) {
          return 'URL do Instagram inválida';
        }
        return '';
      case 'facebook':
        if (value && !value.match(/^https?:\/\/(www\.)?facebook\.com\/.+/)) {
          return 'URL do Facebook inválida';
        }
        return '';
      case 'tiktok':
        if (value && !value.match(/^https?:\/\/(www\.)?tiktok\.com\/.+/)) {
          return 'URL do TikTok inválida';
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
  }, [validateField]);

  // Atualizar opções de personalização
  const updateOption = useCallback((option: keyof PersonalizationOptions, checked: boolean) => {
    setOptions(prev => ({ ...prev, [option]: checked }));
    
    // Limpar dados relacionados se desmarcado
    if (!checked) {
      switch (option) {
        case 'incluirTelefone':
          updateFormData('telefone', '');
          break;
        case 'incluirWhatsapp':
          updateFormData('whatsapp', '');
          break;
        case 'incluirLocalizacao':
          updateFormData('cidade', '');
          updateFormData('estado', '');
          break;
        case 'incluirInstagram':
          updateFormData('redes.instagram', '');
          break;
        case 'incluirFacebook':
          updateFormData('redes.facebook', '');
          break;
        case 'incluirTiktok':
          updateFormData('redes.tiktok', '');
          break;
        case 'incluirOutraRede':
          updateFormData('redes.outro', '');
          break;
        case 'incluirLogo':
          setFormData(prev => ({ ...prev, logo: null, logoPreview: '' }));
          break;
        case 'incluirCorPersonalizada':
          setFormData(prev => ({ ...prev, cor_impressao: 'branco' }));
          break;
      }
    }
  }, [updateFormData]);

  // Upload de logo
  const handleLogoUpload = useCallback((file: File) => {
    if (!file.type.match(/^image\/png$/) && file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PNG ou PDF são aceitos. Não aceitamos fotos de logos.');
      return;
    }

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

  // Submeter formulário
  const handleSubmit = useCallback(() => {
    // Validar campos obrigatórios selecionados
    const requiredFields: Array<{ option: keyof PersonalizationOptions; field: string; label: string }> = [
      { option: 'incluirTelefone', field: 'telefone', label: 'Telefone' },
      { option: 'incluirWhatsapp', field: 'whatsapp', label: 'WhatsApp' },
      { option: 'incluirLocalizacao', field: 'cidade', label: 'Cidade' },
      { option: 'incluirInstagram', field: 'redes.instagram', label: 'Instagram' },
      { option: 'incluirFacebook', field: 'redes.facebook', label: 'Facebook' },
      { option: 'incluirTiktok', field: 'redes.tiktok', label: 'TikTok' },
      { option: 'incluirOutraRede', field: 'redes.outro', label: 'Outra rede social' }
    ];

    const missingFields = requiredFields.filter(({ option, field }) => {
      if (!options[option]) return false;
      
      const value = field.includes('.') 
        ? formData.redes[field.split('.')[1] as keyof typeof formData.redes]
        : formData[field as keyof PersonalizationData];
      
      return !value || (typeof value === 'string' && !value.trim());
    });

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    // Verificar se pelo menos uma opção foi selecionada
    const hasAnyOption = Object.values(options).some(Boolean);
    if (!hasAnyOption) {
      toast.error('Selecione pelo menos uma opção de personalização');
      return;
    }

    onSubmit(formData);
  }, [formData, options, onSubmit]);

  return (
    <TooltipProvider>
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-blue-600" />
            Personalize seu Produto
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecione as informações que deseja incluir na personalização do seu produto. 
            Marque apenas o que for necessário para criar um resultado perfeito.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados de Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="h-6 w-6 text-blue-600" />
                  Dados de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Telefone */}
                <PersonalizationCheckbox
                  id="incluir-telefone"
                  checked={options.incluirTelefone}
                  onCheckedChange={(checked) => updateOption('incluirTelefone', checked)}
                  icon={Phone}
                  label="Telefone"
                  description="Telefone principal para contato"
                  tooltip="Inclua seu telefone principal para que os clientes possam entrar em contato"
                  iconColor="text-blue-600"
                >
                  <Input
                    value={formData.telefone}
                    onChange={(e) => updateFormData('telefone', maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={errors.telefone ? 'border-red-500' : ''}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-600 mt-1">{errors.telefone}</p>
                  )}
                </PersonalizationCheckbox>

                {/* WhatsApp */}
                <PersonalizationCheckbox
                  id="incluir-whatsapp"
                  checked={options.incluirWhatsapp}
                  onCheckedChange={(checked) => updateOption('incluirWhatsapp', checked)}
                  icon={MessageCircle}
                  label="WhatsApp"
                  description="Número do WhatsApp para contato direto"
                  tooltip="WhatsApp facilita o contato direto com seus clientes"
                  iconColor="text-green-600"
                >
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => updateFormData('whatsapp', maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={errors.whatsapp ? 'border-red-500' : ''}
                  />
                  {errors.whatsapp && (
                    <p className="text-sm text-red-600 mt-1">{errors.whatsapp}</p>
                  )}
                </PersonalizationCheckbox>

                {/* Localização */}
                <PersonalizationCheckbox
                  id="incluir-localizacao"
                  checked={options.incluirLocalizacao}
                  onCheckedChange={(checked) => updateOption('incluirLocalizacao', checked)}
                  icon={MapPin}
                  label="Localização"
                  description="Cidade e estado onde você atende"
                  tooltip="Ajuda clientes locais a identificarem sua região de atendimento"
                  iconColor="text-red-600"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => updateFormData('cidade', e.target.value)}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <select
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => updateFormData('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione</option>
                        {ESTADOS_BRASIL.map(estado => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </PersonalizationCheckbox>
              </CardContent>
            </Card>

            {/* Redes Sociais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Link className="h-6 w-6 text-blue-600" />
                  Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <PersonalizationCheckbox
                  id="incluir-instagram"
                  checked={options.incluirInstagram}
                  onCheckedChange={(checked) => updateOption('incluirInstagram', checked)}
                  icon={Instagram}
                  label="Instagram"
                  description="Perfil do Instagram para divulgação"
                  tooltip="Instagram é uma das principais redes para negócios visuais"
                  iconColor="text-pink-600"
                >
                  <Input
                    value={formData.redes.instagram}
                    onChange={(e) => updateFormData('redes.instagram', e.target.value)}
                    placeholder="https://instagram.com/seu_perfil"
                    className={errors['redes.instagram'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.instagram'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['redes.instagram']}</p>
                  )}
                </PersonalizationCheckbox>

                {/* Facebook */}
                <PersonalizationCheckbox
                  id="incluir-facebook"
                  checked={options.incluirFacebook}
                  onCheckedChange={(checked) => updateOption('incluirFacebook', checked)}
                  icon={Facebook}
                  label="Facebook"
                  description="Página do Facebook da sua empresa"
                  tooltip="Facebook ainda é uma rede importante para muitos públicos"
                  iconColor="text-blue-700"
                >
                  <Input
                    value={formData.redes.facebook}
                    onChange={(e) => updateFormData('redes.facebook', e.target.value)}
                    placeholder="https://facebook.com/sua_pagina"
                    className={errors['redes.facebook'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.facebook'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['redes.facebook']}</p>
                  )}
                </PersonalizationCheckbox>

                {/* TikTok */}
                <PersonalizationCheckbox
                  id="incluir-tiktok"
                  checked={options.incluirTiktok}
                  onCheckedChange={(checked) => updateOption('incluirTiktok', checked)}
                  icon={Music}
                  label="TikTok"
                  description="Perfil do TikTok para público jovem"
                  tooltip="TikTok é ideal para alcançar público mais jovem"
                  iconColor="text-black"
                >
                  <Input
                    value={formData.redes.tiktok}
                    onChange={(e) => updateFormData('redes.tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@seu_perfil"
                    className={errors['redes.tiktok'] ? 'border-red-500' : ''}
                  />
                  {errors['redes.tiktok'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['redes.tiktok']}</p>
                  )}
                </PersonalizationCheckbox>

                {/* Outra Rede */}
                <PersonalizationCheckbox
                  id="incluir-outra-rede"
                  checked={options.incluirOutraRede}
                  onCheckedChange={(checked) => updateOption('incluirOutraRede', checked)}
                  icon={Link}
                  label="Outra Rede Social"
                  description="LinkedIn, YouTube, site próprio, etc."
                  tooltip="Inclua qualquer outra rede social ou site importante"
                  iconColor="text-gray-600"
                >
                  <Input
                    value={formData.redes.outro}
                    onChange={(e) => updateFormData('redes.outro', e.target.value)}
                    placeholder="https://linkedin.com/in/seu_perfil"
                  />
                </PersonalizationCheckbox>
              </CardContent>
            </Card>

            {/* Logo e Design */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Palette className="h-6 w-6 text-blue-600" />
                  Logo e Design
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo */}
                <PersonalizationCheckbox
                  id="incluir-logo"
                  checked={options.incluirLogo}
                  onCheckedChange={(checked) => updateOption('incluirLogo', checked)}
                  icon={Upload}
                  label="Logo da Empresa"
                  description="Adicione o logo da sua marca (PNG ou PDF em alta resolução - não aceitamos fotos)"
                  tooltip="Logo em alta resolução (300 dpi). Formatos aceitos: PNG ou PDF. Tamanho mínimo: 300x300px. IMPORTANTE: Não aceitamos fotos de logos."
                  iconColor="text-purple-600"
                >
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
                        <div className="relative inline-block">
                          <img 
                            src={formData.logoPreview}
                            alt="Logo preview"
                            className="max-w-32 max-h-32 object-contain mx-auto"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setFormData(prev => ({ ...prev, logo: null, logoPreview: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div>
                          <p className="font-medium">{formData.logo?.name}</p>
                          <p className="text-sm text-gray-600">
                            {formData.logo && (formData.logo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Arraste seu logo aqui</p>
                          <p className="text-sm text-gray-600">ou clique para selecionar</p>
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            ⚠️ Apenas PNG ou PDF • Não aceitamos fotos
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          Escolher Arquivo
                        </Button>
                      </div>
                    )}
                  </div>
                </PersonalizationCheckbox>

                {/* Cor de Impressão */}
                <PersonalizationCheckbox
                  id="incluir-cor"
                  checked={options.incluirCorPersonalizada}
                  onCheckedChange={(checked) => updateOption('incluirCorPersonalizada', checked)}
                  icon={Palette}
                  label="Cor de Impressão"
                  description="Escolha a cor para impressão dos elementos"
                  tooltip="Para melhor nitidez, use cores sólidas com alto contraste. Evite gradientes suaves"
                  iconColor="text-orange-600"
                >
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cor_impressao"
                          value="branco"
                          checked={formData.cor_impressao === 'branco'}
                          onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                          className="text-blue-600"
                        />
                        <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                        <span>Branco</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cor_impressao"
                          value="preto"
                          checked={formData.cor_impressao === 'preto'}
                          onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                          className="text-blue-600"
                        />
                        <div className="w-6 h-6 bg-black border-2 border-gray-300 rounded"></div>
                        <span>Preto</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cor_impressao"
                          value="custom"
                          checked={formData.cor_impressao === 'custom'}
                          onChange={(e) => setFormData(prev => ({ ...prev, cor_impressao: e.target.value as any }))}
                          className="text-blue-600"
                        />
                        <div 
                          className="w-6 h-6 border-2 border-gray-300 rounded"
                          style={{ backgroundColor: formData.cor_custom }}
                        ></div>
                        <span>Personalizada</span>
                      </label>
                    </div>
                    
                    {formData.cor_impressao === 'custom' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.cor_custom}
                          onChange={(e) => setFormData(prev => ({ ...prev, cor_custom: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.cor_custom}
                          onChange={(e) => setFormData(prev => ({ ...prev, cor_custom: e.target.value }))}
                          placeholder="#000000"
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                </PersonalizationCheckbox>
              </CardContent>
            </Card>
          </div>

          {/* Prévisualização */}
          <div className="lg:col-span-1">
            <ProductPreview
              formData={formData}
              options={options}
              productName="ADDS Implant"
              productImage="https://addsbrasil.com.br/wp-content/uploads/2025/03/ADDS-Implant.png"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between pt-8 border-t"
        >
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2 px-6 py-3">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Produtos
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={!Object.values(options).some(Boolean)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 px-8 py-3 text-lg font-medium"
          >
            Finalizar Personalização
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </TooltipProvider>
  );
} 