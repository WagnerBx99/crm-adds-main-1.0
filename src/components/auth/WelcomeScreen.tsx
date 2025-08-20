import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onNewUser: () => void;
  onExistingUser: () => void;
}

export default function WelcomeScreen({ onNewUser, onExistingUser }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center bg-brand-blue text-white rounded-t-lg p-8">
          <CardTitle className="text-3xl flex items-center justify-center gap-3 mb-2">
            <Sparkles className="h-8 w-8" />
            Bem-vindo!
          </CardTitle>
          <p className="text-blue-100 text-lg">
            Vamos começar criando sua campanha personalizada
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Você já é nosso cliente?
            </h2>
            <p className="text-gray-600">
              Escolha uma das opções abaixo para continuar
            </p>
          </div>

          <div className="space-y-4">
            {/* Botão para novos usuários */}
            <Button
              onClick={onNewUser}
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <UserPlus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Ainda não tenho cadastro</div>
                  <div className="text-sm text-green-100">Criar nova conta</div>
                </div>
              </div>
            </Button>

            {/* Botão para usuários existentes */}
            <Button
              onClick={onExistingUser}
              variant="outline"
              className="w-full h-16 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <LogIn className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Já sou cadastrado</div>
                  <div className="text-sm opacity-75">Fazer login rápido</div>
                </div>
              </div>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>Novo aqui?</strong> Nosso processo é rápido e simples! 
              Você poderá personalizar sua campanha em poucos minutos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 