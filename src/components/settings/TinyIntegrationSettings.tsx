import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ExternalLink, AlertCircle } from 'lucide-react';

export function TinyIntegrationSettings() {
  const navigate = useNavigate();

  // Redirecionar automaticamente para a nova implementação após 2 segundos
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/tiny');
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  // Redirecionar imediatamente ao clicar no botão
  const handleRedirect = () => {
    navigate('/tiny');
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Aviso de Redirecionamento</AlertTitle>
        <AlertDescription className="text-amber-700">
          Esta página de integração foi atualizada. Você será redirecionado automaticamente para a nova interface.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Integração com Tiny ERP - Nova Versão</CardTitle>
          <CardDescription>
            Uma nova versão da integração com o Tiny ERP está disponível com suporte a OAuth 2.0 e mais recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Melhorias na Integração</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>A nova versão da integração com o Tiny ERP inclui:</p>
                  <ul className="list-disc space-y-1 ml-5">
                    <li>Autenticação OAuth 2.0 para maior segurança</li>
                    <li>Suporte para a API Tiny v3.0</li>
                    <li>Interface moderna e responsiva</li>
                    <li>Dashboard com estatísticas em tempo real</li>
                    <li>Melhor desempenho e tratamento de erros</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleRedirect} 
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Acessar Nova Interface
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 