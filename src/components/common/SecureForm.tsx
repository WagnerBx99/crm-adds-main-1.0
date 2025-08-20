import React, { FormEvent, ReactNode, useEffect, useState } from 'react';
import { csrfProtection } from '@/lib/csrf';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  action?: string;
  method?: 'get' | 'post';
  className?: string;
  id?: string;
}

/**
 * Componente de formulário com proteção CSRF integrada
 * 
 * Este componente adiciona automaticamente um token CSRF como campo oculto
 * e também o inclui no cabeçalho quando o formulário é enviado via AJAX
 */
export function SecureForm({
  children,
  onSubmit,
  action = '',
  method = 'post',
  className = '',
  id
}: SecureFormProps) {
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  // Obter token CSRF ao carregar o componente
  useEffect(() => {
    const token = csrfProtection.getToken();
    setCsrfToken(token);
  }, []);
  
  // Função para lidar com o envio do formulário
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Garantir que o token está atualizado
    if (!csrfToken) {
      const token = csrfProtection.getToken();
      setCsrfToken(token);
    }
    
    // Chamar o manipulador externo
    onSubmit(e);
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      action={action} 
      method={method} 
      className={className}
      id={id}
    >
      {/* Campo oculto com token CSRF */}
      <input 
        type="hidden" 
        name={csrfProtection.getHeaderName()} 
        value={csrfToken} 
      />
      
      {/* Conteúdo do formulário */}
      {children}
    </form>
  );
}

/**
 * Hook para obter cabeçalhos com proteção CSRF para requisições AJAX
 * @returns Objeto com cabeçalhos contendo token CSRF
 */
export function useCsrfHeaders(): Record<string, string> {
  const [headers, setHeaders] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const csrfHeaders = csrfProtection.addTokenToHeaders({
      'Content-Type': 'application/json'
    });
    setHeaders(csrfHeaders);
  }, []);
  
  return headers;
}

/**
 * Hook para verificar CSRF em resposta do servidor
 * @param token Token recebido do servidor
 * @returns True se o token for válido
 */
export function useVerifyCsrf(token: string | null): boolean {
  if (!token) return false;
  return csrfProtection.verifyToken(token);
} 