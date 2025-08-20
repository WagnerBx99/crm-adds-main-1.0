import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  User, 
  Building, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { PublicContact, ContactFormErrors } from '@/types/contact';
import {
  fetchAddressByCep,
  createContactInTiny,
  validateCPF,
  validateCNPJ,
  validateEmail,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCEP
} from '@/services/contactService';

interface PublicContactFormProps {
  onSuccess: (contact: PublicContact) => void;
  onCancel?: () => void;
  prefilledData?: Partial<PublicContact> | null;
}

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function PublicContactForm({ onSuccess, onCancel, prefilledData }: PublicContactFormProps) {
  const [formData, setFormData] = useState<PublicContact>({
    nome: prefilledData?.nome || '',
    nome_fantasia: prefilledData?.nome_fantasia || '',
    tipo_pessoa: prefilledData?.tipo_pessoa || '1',
    cpf_cnpj: prefilledData?.cpf_cnpj || '',
    inscricao_estadual: prefilledData?.inscricao_estadual || '',
    inscricao_municipal: prefilledData?.inscricao_municipal || '',
    fone: prefilledData?.fone || '',
    email: prefilledData?.email || '',
    cep: prefilledData?.cep || '',
    endereco: prefilledData?.endereco || '',
    numero: prefilledData?.numero || '',
    complemento: prefilledData?.complemento || '',
    bairro: prefilledData?.bairro || '',
    cidade: prefilledData?.cidade || '',
    uf: prefilledData?.uf || ''
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [validFields, setValidFields] = useState<Set<string>>(new Set());

  // Validação em tempo real
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nome':
        return value.trim().length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : undefined;
      
      case 'cpf_cnpj':
        if (formData.tipo_pessoa === '1') {
          return !validateCPF(value) ? 'CPF inválido' : undefined;
        } else {
          return !validateCNPJ(value) ? 'CNPJ inválido' : undefined;
        }
      
      case 'email':
        return !validateEmail(value) ? 'E-mail inválido' : undefined;
      
      case 'fone':
        const cleanPhone = value.replace(/\D/g, '');
        return cleanPhone.length < 10 ? 'Telefone deve ter pelo menos 10 dígitos' : undefined;
      
      case 'cep':
        const cleanCep = value.replace(/\D/g, '');
        return cleanCep.length !== 8 ? 'CEP deve ter 8 dígitos' : undefined;
      
      case 'endereco':
        return value.trim().length < 5 ? 'Endereço deve ter pelo menos 5 caracteres' : undefined;
      
      case 'numero':
        return value.trim().length === 0 ? 'Número é obrigatório' : undefined;
      
      case 'bairro':
        return value.trim().length < 2 ? 'Bairro deve ter pelo menos 2 caracteres' : undefined;
      
      case 'cidade':
        return value.trim().length < 2 ? 'Cidade deve ter pelo menos 2 caracteres' : undefined;
      
      case 'uf':
        return !ESTADOS_BRASIL.includes(value) ? 'UF inválida' : undefined;
      
      default:
        return undefined;
    }
  };

  // Atualizar campo com validação
  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    if (!error && value.trim()) {
      setValidFields(prev => new Set(prev).add(name));
    } else {
      setValidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  };

  // Buscar endereço por CEP
  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setIsFetchingCep(true);
      
      try {
        const addressData = await fetchAddressByCep(cleanCep);
        
        setFormData(prev => ({
          ...prev,
          endereco: addressData.logradouro,
          bairro: addressData.bairro,
          cidade: addressData.localidade,
          uf: addressData.uf
        }));
        
        // Validar campos preenchidos automaticamente
        ['endereco', 'bairro', 'cidade', 'uf'].forEach(field => {
          const value = field === 'endereco' ? addressData.logradouro :
                       field === 'bairro' ? addressData.bairro :
                       field === 'cidade' ? addressData.localidade :
                       addressData.uf;
          
          if (value) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
            if (!error) {
              setValidFields(prev => new Set(prev).add(field));
            }
          }
        });
        
        toast.success('Endereço encontrado!');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao buscar CEP');
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  // Aplicar máscaras nos campos
  const handleInputChange = (name: string, value: string) => {
    let maskedValue = value;
    
    switch (name) {
      case 'cpf_cnpj':
        maskedValue = formData.tipo_pessoa === '1' ? maskCPF(value) : maskCNPJ(value);
        break;
      case 'fone':
        maskedValue = maskPhone(value);
        break;
      case 'cep':
        maskedValue = maskCEP(value);
        break;
    }
    
    updateField(name, maskedValue);
    
    // Buscar CEP automaticamente quando preenchido
    if (name === 'cep' && maskedValue.replace(/\D/g, '').length === 8) {
      handleCepSearch(maskedValue);
    }
  };

  // Verificar se o formulário é válido
  const isFormValid = () => {
    const requiredFields = [
      'nome', 'cpf_cnpj', 'fone', 'email', 
      'cep', 'endereco', 'numero', 'bairro', 'cidade', 'uf'
    ];
    
    return requiredFields.every(field => 
      validFields.has(field) && !errors[field as keyof ContactFormErrors]
    );
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await createContactInTiny(formData);
      
      if (response.retorno.status === 'OK') {
        toast.success('🎉 Cadastro realizado com sucesso!', {
          description: 'Agora você pode continuar com seu orçamento.',
        });
        
        // Adicionar ID do contato retornado pela API
        const contactId = response.retorno.registros?.[0]?.contato?.id;
        onSuccess({ ...formData, id: contactId });
      } else {
        throw new Error('Erro no cadastro');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  // Validar campos preenchidos automaticamente e focar no primeiro campo
  useEffect(() => {
    // Validar campos preenchidos
    if (prefilledData) {
      Object.entries(prefilledData).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          const error = validateField(key, value);
          if (!error) {
            setValidFields(prev => new Set(prev).add(key));
          }
        }
      });
      
      // Mostrar toast informativo
      toast.success('Dados preenchidos automaticamente!', {
        description: 'Verifique e complete as informações restantes.',
      });
    }
    
    // Focar no primeiro campo vazio
    const firstEmptyInput = document.querySelector('input:not([value]):not([readonly])') as HTMLInputElement;
    if (firstEmptyInput) {
      firstEmptyInput.focus();
    } else {
      const firstInput = document.querySelector('input[name="nome"]') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [prefilledData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center bg-brand-blue text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            Cadastre-se para continuar
          </CardTitle>
          <p className="text-blue-100 mt-2">
            Passo 1 de 4 - Preencha seus dados para solicitar um orçamento
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          {prefilledData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Dados preenchidos automaticamente!</p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Verificamos que você já informou alguns dados. Complete as informações restantes para finalizar seu cadastro.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Pessoa */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Tipo de Pessoa *</Label>
              <RadioGroup
                value={formData.tipo_pessoa}
                onValueChange={(value: '1' | '2') => {
                  setFormData(prev => ({ 
                    ...prev, 
                    tipo_pessoa: value,
                    cpf_cnpj: '', // Limpar CPF/CNPJ ao trocar tipo
                    inscricao_estadual: '',
                    inscricao_municipal: ''
                  }));
                  setErrors(prev => ({ ...prev, cpf_cnpj: undefined }));
                  setValidFields(prev => {
                    const newSet = new Set(prev);
                    newSet.delete('cpf_cnpj');
                    return newSet;
                  });
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="pf" />
                  <Label htmlFor="pf" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Pessoa Física
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="pj" />
                  <Label htmlFor="pj" className="flex items-center gap-2 cursor-pointer">
                    <Building className="h-4 w-4" />
                    Pessoa Jurídica
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Grid de campos principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome/Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-base font-medium">
                  {formData.tipo_pessoa === '1' ? 'Nome Completo' : 'Razão Social'} *
                </Label>
                <div className="relative">
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder={formData.tipo_pessoa === '1' ? 'Seu nome completo' : 'Nome da empresa'}
                    className={`pl-10 ${errors.nome ? 'border-red-500' : validFields.has('nome') ? 'border-green-500' : ''}`}
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {validFields.has('nome') && !errors.nome && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                  )}
                </div>
                {errors.nome && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nome}
                  </p>
                )}
              </div>

              {/* Nome Fantasia (apenas PJ) */}
              {formData.tipo_pessoa === '2' && (
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia" className="text-base font-medium">Nome Fantasia</Label>
                  <div className="relative">
                    <Input
                      id="nome_fantasia"
                      name="nome_fantasia"
                      value={formData.nome_fantasia}
                      onChange={(e) => updateField('nome_fantasia', e.target.value)}
                      placeholder="Nome fantasia da empresa"
                      className="pl-10"
                    />
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </div>
              )}

              {/* CPF/CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj" className="text-base font-medium">
                  {formData.tipo_pessoa === '1' ? 'CPF' : 'CNPJ'} *
                </Label>
                <div className="relative">
                  <Input
                    id="cpf_cnpj"
                    name="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                    placeholder={formData.tipo_pessoa === '1' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className={`pl-10 ${errors.cpf_cnpj ? 'border-red-500' : validFields.has('cpf_cnpj') ? 'border-green-500' : ''}`}
                  />
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {validFields.has('cpf_cnpj') && !errors.cpf_cnpj && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                  )}
                </div>
                {errors.cpf_cnpj && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cpf_cnpj}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="fone" className="text-base font-medium">Telefone/WhatsApp *</Label>
                <div className="relative">
                  <Input
                    id="fone"
                    name="fone"
                    value={formData.fone}
                    onChange={(e) => handleInputChange('fone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={`pl-10 ${errors.fone ? 'border-red-500' : validFields.has('fone') ? 'border-green-500' : ''}`}
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {validFields.has('fone') && !errors.fone && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                  )}
                </div>
                {errors.fone && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fone}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">E-mail *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`pl-10 ${errors.email ? 'border-red-500' : validFields.has('email') ? 'border-green-500' : ''}`}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {validFields.has('email') && !errors.email && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Seção de Endereço */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-blue" />
                Endereço Completo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-base font-medium">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      placeholder="00000-000"
                      className={`pl-10 ${errors.cep ? 'border-red-500' : validFields.has('cep') ? 'border-green-500' : ''}`}
                    />
                    {isFetchingCep ? (
                      <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-blue h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    )}
                    {validFields.has('cep') && !errors.cep && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                    )}
                  </div>
                  {errors.cep && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cep}
                    </p>
                  )}
                </div>

                {/* UF */}
                <div className="space-y-2">
                  <Label htmlFor="uf" className="text-base font-medium">UF *</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => updateField('uf', value)}
                  >
                    <SelectTrigger className={errors.uf ? 'border-red-500' : validFields.has('uf') ? 'border-green-500' : ''}>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BRASIL.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.uf && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.uf}
                    </p>
                  )}
                </div>

                {/* Cidade */}
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-base font-medium">Cidade *</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    placeholder="Nome da cidade"
                    className={errors.cidade ? 'border-red-500' : validFields.has('cidade') ? 'border-green-500' : ''}
                  />
                  {errors.cidade && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cidade}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {/* Logradouro */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="endereco" className="text-base font-medium">Logradouro *</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={(e) => updateField('endereco', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    className={errors.endereco ? 'border-red-500' : validFields.has('endereco') ? 'border-green-500' : ''}
                  />
                  {errors.endereco && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.endereco}
                    </p>
                  )}
                </div>

                {/* Número */}
                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-base font-medium">Número *</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={formData.numero}
                    onChange={(e) => updateField('numero', e.target.value)}
                    placeholder="123"
                    className={errors.numero ? 'border-red-500' : validFields.has('numero') ? 'border-green-500' : ''}
                  />
                  {errors.numero && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.numero}
                    </p>
                  )}
                </div>

                {/* Complemento */}
                <div className="space-y-2">
                  <Label htmlFor="complemento" className="text-base font-medium">Complemento</Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={(e) => updateField('complemento', e.target.value)}
                    placeholder="Apto, Sala, etc."
                  />
                </div>
              </div>

              {/* Bairro */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="bairro" className="text-base font-medium">Bairro *</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={(e) => updateField('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                  className={errors.bairro ? 'border-red-500' : validFields.has('bairro') ? 'border-green-500' : ''}
                />
                {errors.bairro && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.bairro}
                  </p>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className="w-full sm:flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Cadastrar e Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
 