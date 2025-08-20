import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from '@/lib/services/authService';
import { Loader2, Eye, EyeOff, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode] = useState(process.env.NODE_ENV === 'development');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      // Login com o serviço de autenticação
      const user = authService.login({
        email,
        password,
        rememberMe
      });
      
      if (user) {
        // Login bem-sucedido
        toast.success(`Bem-vindo, ${user.name}!`);
        
        // Callback de sucesso ou redirecionamento
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          navigate(redirectTo);
        }
      } else {
        // Login falhou (mensagens de erro são exibidas pelo serviço)
        setError('Falha na autenticação');
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Ocorreu um erro durante o login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = () => {
    if (!devMode) return;
    
    try {
      const user = authService.devLogin();
      if (user) {
        toast.success(`Login de desenvolvimento como ${user.name}`);
        if (redirectTo) {
          navigate(redirectTo);
        }
      } else {
        toast.error('Erro no login de desenvolvimento');
      }
    } catch (err) {
      console.error('Erro no login de desenvolvimento:', err);
      toast.error('Erro no login de desenvolvimento');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu.email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => toast.info('Fale com seu administrador para redefinir a senha')}
            >
              Esqueceu a senha?
            </button>
          </div>
          
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={loading}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm font-normal cursor-pointer"
          >
            Mantenha-me conectado
          </Label>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Autenticando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
        
        {devMode && (
          <div className="pt-4">
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex justify-between items-center">
                  <span>Modo de desenvolvimento ativo</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    onClick={handleDevLogin}
                  >
                    Login rápido
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </form>
    </div>
  );
} 