import React, { useState } from 'react';
import { PublicContact } from '@/types/contact';
import PublicContactForm from '@/components/contact/PublicContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface PublicWorkflowProps {
  initialStep?: 'contact' | 'personalization';
}

export default function PublicWorkflow({ initialStep = 'contact' }: PublicWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<'contact' | 'personalization'>(initialStep);
  const [contactData, setContactData] = useState<PublicContact | null>(null);

  const handleContactSuccess = (contact: PublicContact) => {
    setContactData(contact);
    setCurrentStep('personalization');
  };

  const handleBackToContact = () => {
    setCurrentStep('contact');
  };

  // Renderizar etapa atual
  switch (currentStep) {
    case 'contact':
      return (
        <PublicContactForm
          onSuccess={handleContactSuccess}
        />
      );
    
    case 'personalization':
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
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Obrigado, {contactData?.nome}!
                </h3>
                
                <p className="text-gray-600">
                  Seu cadastro foi realizado com sucesso no nosso sistema. 
                  Em breve nossa equipe entrará em contato para dar continuidade 
                  ao seu orçamento.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📧 Enviaremos mais informações para: <strong>{contactData?.email}</strong>
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    📱 Telefone de contato: <strong>{contactData?.fone}</strong>
                  </p>
                </div>
                
                <div className="flex gap-3 justify-center pt-4">
                  <Button
                    onClick={handleBackToContact}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Fazer Novo Cadastro
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-brand-blue hover:bg-brand-blue/90"
                  >
                    Voltar ao Site
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    default:
      return null;
  }
} 