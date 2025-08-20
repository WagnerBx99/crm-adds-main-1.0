import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogIn, Loader2, AlertCircle, CheckCircle, User, Building, ArrowRight } from 'lucide-react';
import { PublicContact, ContactFormErrors } from '@/types/contact';
import { validateCPF, validateCNPJ, validateEmail, maskCPF, maskCNPJ, maskPhone } from '@/services/contactService';
import { searchTinyContactByCriteria } from '@/lib/services/tinyService';

interface QuickLoginProps {
  onSuccess: (contact: PublicContact) => void;
  onBack: () => void;
  onSuggestRegister: (prefilledData?: Partial<PublicContact>) => void;
}

export default function QuickLogin({ onSuccess, onBack, onSuggestRegister }: QuickLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    fone: ''
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [validFields, setValidFields] = useState<Set<string>>(new Set());

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'nome':
        if (!value.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        return undefined;

      case 'documento':
        if (!value.trim()) return tipoPessoa === 'fisica' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
        if (tipoPessoa === 'fisica') {
          return validateCPF(value) ? undefined : 'CPF inválido';
        } else {
          return validateCNPJ(value) ? undefined : 'CNPJ inválido';
        }

      case 'email':
        if (!value.trim()) return 'E-mail é obrigatório';
        return validateEmail(value) ? undefined : 'E-mail inválido';

      case 'fone':
        if (!value.trim()) return 'Telefone é obrigatório';
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10) return 'Telefone deve ter pelo menos 10 dígitos';
        return undefined;

      default:
        return undefined;
    }
  };

  const updateField = (name: string, value: string) => {
    // Aplicar máscaras
    let maskedValue = value;
    if (name === 'documento') {
      maskedValue = tipoPessoa === 'fisica' ? maskCPF(value) : maskCNPJ(value);
    } else if (name === 'fone') {
      maskedValue = maskPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: maskedValue }));

    // Validar campo
    const error = validateField(name, maskedValue);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Atualizar campos válidos
    setValidFields(prev => {
      const newSet = new Set(prev);
      if (!error && maskedValue.trim()) {
        newSet.add(name);
      } else {
        newSet.delete(name);
      }
      return newSet;
    });
  };

  const isFormValid = () => {
    const requiredFields = ['nome', 'documento', 'email', 'fone'];
    return requiredFields.every(field => validFields.has(field) && !errors[field]);
  };

  const searchContact = async (contact: PublicContact) => {
    console.log('🔍 Iniciando busca de contato:', {
      nome: contact.nome,
      email: contact.email,
      cpf_cnpj: contact.cpf_cnpj,
      fone: contact.fone
    });

    try {
      // 1. Primeiro, tentar buscar na API do Tiny
      console.log('📡 Buscando na API do Tiny...');
      const tinyContact = await searchTinyContactByCriteria({
        email: contact.email,
        cpf_cnpj: contact.cpf_cnpj,
        telefone: contact.fone,
        nome: contact.nome
      });

      if (tinyContact) {
        console.log('✅ Contato encontrado na API do Tiny:', tinyContact);
        
        // Converter do formato interno para PublicContact
        const foundContact: PublicContact = {
          nome: tinyContact.name,
          email: tinyContact.email,
          fone: tinyContact.phone,
          cpf_cnpj: tinyContact.document,
          tipo_pessoa: tinyContact.personType === 'legal' ? '2' : '1',
          endereco: tinyContact.address,
          numero: tinyContact.number,
          bairro: tinyContact.neighborhood,
          cidade: tinyContact.city,
          uf: tinyContact.state,
          cep: tinyContact.zipCode,
          complemento: ''
        };
        
        return foundContact;
      }

      // 2. Se não encontrou na API, buscar no localStorage como fallback
      console.log('📱 Buscando no localStorage como fallback...');
      const savedContacts = JSON.parse(localStorage.getItem('publicContacts') || '[]');
      
      const existingContact = savedContacts.find((saved: any) => {
        // Normalizar dados para comparação
        const savedEmail = saved.email?.toLowerCase().trim();
        const searchEmail = contact.email?.toLowerCase().trim();
        const savedDoc = saved.cpf_cnpj?.replace(/\D/g, '');
        const searchDoc = contact.cpf_cnpj?.replace(/\D/g, '');
        const savedPhone = saved.fone?.replace(/\D/g, '');
        const searchPhone = contact.fone?.replace(/\D/g, '');
        const savedName = saved.nome?.toLowerCase().trim();
        const searchName = contact.nome?.toLowerCase().trim();

        // Buscar por email, documento, telefone ou nome completo
        return (
          (savedEmail && searchEmail && savedEmail === searchEmail) ||
          (savedDoc && searchDoc && savedDoc === searchDoc) ||
          (savedPhone && searchPhone && savedPhone === searchPhone) ||
          (savedName && searchName && savedName === searchName)
        );
      });

      if (existingContact) {
        console.log('✅ Contato encontrado no localStorage:', existingContact);
        return existingContact;
      }

      console.log('❌ Contato não encontrado em nenhuma fonte. Dados pesquisados:', {
        email: contact.email,
        cpf_cnpj: contact.cpf_cnpj,
        fone: contact.fone,
        nome: contact.nome
      });
      
      return null;

    } catch (error) {
      console.error('❌ Erro durante a busca de contato:', error);
      
      // Em caso de erro na API, tentar apenas o localStorage
      console.log('🔄 Tentando apenas localStorage devido ao erro...');
      const savedContacts = JSON.parse(localStorage.getItem('publicContacts') || '[]');
      
      const existingContact = savedContacts.find((saved: any) => {
        const savedEmail = saved.email?.toLowerCase().trim();
        const searchEmail = contact.email?.toLowerCase().trim();
        const savedDoc = saved.cpf_cnpj?.replace(/\D/g, '');
        const searchDoc = contact.cpf_cnpj?.replace(/\D/g, '');
        const savedPhone = saved.fone?.replace(/\D/g, '');
        const searchPhone = contact.fone?.replace(/\D/g, '');
        const savedName = saved.nome?.toLowerCase().trim();
        const searchName = contact.nome?.toLowerCase().trim();

        return (
          (savedEmail && searchEmail && savedEmail === searchEmail) ||
          (savedDoc && searchDoc && savedDoc === searchDoc) ||
          (savedPhone && searchPhone && savedPhone === searchPhone) ||
          (savedName && searchName && savedName === searchName)
        );
      });

      return existingContact || null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      const contactData: PublicContact = {
        nome: formData.nome.trim(),
        tipo: tipoPessoa,
        tipo_pessoa: tipoPessoa === 'fisica' ? '1' : '2',
        cpf_cnpj: formData.documento.replace(/\D/g, ''),
        email: formData.email.trim().toLowerCase(),
        fone: formData.fone.replace(/\D/g, ''),
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        complemento: ''
      };

      const foundContact = await searchContact(contactData);

      if (foundContact) {
        // Login bem-sucedido
        onSuccess(foundContact);
      } else {
        // Contato não encontrado - sugerir cadastro com dados preenchidos
        setIsLoading(false);
        setTimeout(() => {
          if (window.confirm(
            'Não encontramos seu cadastro em nossa base de dados.\n\n' +
            'Gostaria de criar uma nova conta agora?\n' +
            'Seus dados já serão preenchidos automaticamente.'
          )) {
            // Passar dados preenchidos para o cadastro
            const prefilledData: Partial<PublicContact> = {
              nome: contactData.nome,
              tipo_pessoa: contactData.tipo_pessoa,
              cpf_cnpj: contactData.cpf_cnpj,
              email: contactData.email,
              fone: contactData.fone,
              endereco: '',
              numero: '',
              bairro: '',
              cidade: '',
              uf: '',
              cep: '',
              complemento: ''
            };
            onSuggestRegister(prefilledData);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Erro na busca de contato:', error);
      setErrors({ general: 'Erro ao verificar cadastro. Tente novamente.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center bg-brand-blue text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            Login Rápido
          </CardTitle>
          <p className="text-blue-100">
            Informe seus dados para encontrar seu cadastro
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Tipo de Pessoa */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Pessoa *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={tipoPessoa === 'fisica' ? 'default' : 'outline'}
                  onClick={() => {
                    setTipoPessoa('fisica');
                    updateField('documento', '');
                  }}
                  className="h-12 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Pessoa Física
                </Button>
                <Button
                  type="button"
                  variant={tipoPessoa === 'juridica' ? 'default' : 'outline'}
                  onClick={() => {
                    setTipoPessoa('juridica');
                    updateField('documento', '');
                  }}
                  className="h-12 flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Pessoa Jurídica
                </Button>
              </div>
            </div>

            {/* Nome/Razão Social */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-base font-medium">
                {tipoPessoa === 'fisica' ? 'Nome Completo' : 'Razão Social'} *
              </Label>
              <div className="relative">
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => updateField('nome', e.target.value)}
                  placeholder={tipoPessoa === 'fisica' ? 'Seu nome completo' : 'Nome da empresa'}
                  className={errors.nome ? 'border-red-500' : validFields.has('nome') ? 'border-green-500' : ''}
                />
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

            {/* CPF/CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="documento" className="text-base font-medium">
                {tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} *
              </Label>
              <div className="relative">
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => updateField('documento', e.target.value)}
                  placeholder={tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  className={errors.documento ? 'border-red-500' : validFields.has('documento') ? 'border-green-500' : ''}
                />
                {validFields.has('documento') && !errors.documento && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                )}
              </div>
              {errors.documento && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.documento}
                </p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">E-mail *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-red-500' : validFields.has('email') ? 'border-green-500' : ''}
                />
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

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="fone" className="text-base font-medium">Telefone/WhatsApp *</Label>
              <div className="relative">
                <Input
                  id="fone"
                  value={formData.fone}
                  onChange={(e) => updateField('fone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={errors.fone ? 'border-red-500' : validFields.has('fone') ? 'border-green-500' : ''}
                />
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

            {/* Botões */}
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid() || isLoading}
                className="bg-brand-blue hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Informações sobre a busca */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">🔍 Como funciona a busca:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>1ª etapa:</strong> Buscamos seu cadastro na API do Tiny ERP</li>
                  <li>• <strong>2ª etapa:</strong> Se não encontrado, verificamos nossa base local</li>
                  <li>• <strong>Critérios:</strong> E-mail, CPF/CNPJ, telefone ou nome completo</li>
                </ul>
                <p className="mt-2 text-xs text-blue-600">
                  💡 <strong>Dica:</strong> Use os mesmos dados do seu cadastro no Tiny para melhor resultado
                </p>
              </div>
            </div>
          </div>

          {/* Mensagem de busca em andamento */}
          {isLoading && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Buscando seu cadastro...</p>
                  <p className="text-yellow-700">
                    Verificando na API do Tiny ERP e base local
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 