import React, { useState } from 'react';
import { PublicContact } from '@/types/contact';
import WelcomeScreen from './WelcomeScreen';
import QuickLogin from './QuickLogin';
import PublicContactForm from '@/components/contact/PublicContactForm';
import PublicPersonalizationEditor from '@/components/personalization/PublicPersonalizationEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

type AuthStep = 'welcome' | 'login' | 'register' | 'success' | 'personalization';

interface AuthWorkflowProps {
  initialStep?: AuthStep;
}

export default function AuthWorkflow({ initialStep = 'welcome' }: AuthWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialStep);
  const [contactData, setContactData] = useState<PublicContact | null>(null);

  // Handlers do fluxo principal
  const handleWelcomeNewUser = () => {
    setCurrentStep('register');
  };

  const handleWelcomeExistingUser = () => {
    setCurrentStep('login');
  };

  // Handlers do login
  const handleLoginSuccess = (contact: PublicContact) => {
    setContactData(contact);
    setCurrentStep('personalization');
  };

  const handleLoginBack = () => {
    setCurrentStep('welcome');
  };

  const handleLoginSuggestRegister = () => {
    setCurrentStep('register');
  };

  // Handlers do cadastro
  const handleRegisterSuccess = (contact: PublicContact) => {
    setContactData(contact);
    setCurrentStep('success');
  };

  const handleRegisterBack = () => {
    setCurrentStep('welcome');
  };

  // Handlers da tela de sucesso
  const handleSuccessToPersonalization = () => {
    setCurrentStep('personalization');
  };

  const handleSuccessNewRegister = () => {
    setContactData(null);
    setCurrentStep('register');
  };

  // Handlers da personalização
  const handlePersonalizationBack = () => {
    setCurrentStep('success');
  };

  // Renderizar a etapa atual
  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          onNewUser={handleWelcomeNewUser}
          onExistingUser={handleWelcomeExistingUser}
        />
      );

    case 'login':
      return (
        <QuickLogin
          onSuccess={handleLoginSuccess}
          onBack={handleLoginBack}
          onSuggestRegister={handleLoginSuggestRegister}
        />
      );

    case 'register':
      return (
        <PublicContactForm
          onSuccess={handleRegisterSuccess}
          onCancel={handleRegisterBack}
        />
      );

    case 'success':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-xl">
            <CardHeader className="text-center bg-green-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Cadastro Realizado com Sucesso!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Obrigado, {contactData?.nome}!
                </h3>
                
                <p className="text-gray-600">
                  Seu cadastro foi realizado com sucesso no nosso sistema. 
                  Agora você pode personalizar sua campanha ou nossa equipe 
                  entrará em contato em breve.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📧 E-mail de contato: <strong>{contactData?.email}</strong>
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    📱 Telefone: <strong>{contactData?.fone}</strong>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    🎨 Próximo Passo: Personalização
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Agora você pode personalizar sua campanha escolhendo cores, 
                    logos e detalhes que combinam com sua marca!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button
                    onClick={handleSuccessNewRegister}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Fazer Novo Cadastro
                  </Button>
                  
                  <Button
                    onClick={handleSuccessToPersonalization}
                    className="bg-brand-blue hover:bg-brand-blue/90 flex items-center gap-2"
                  >
                    🎨 Personalizar Campanha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'personalization':
      return (
        <PublicPersonalizationEditor
          isPublic={true}
          contactData={contactData}
          onBack={handlePersonalizationBack}
        />
      );

    default:
      return null;
  }
} 