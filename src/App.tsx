import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import ModernKanbanBoard from "./components/kanban/ModernKanbanBoard";
import Contacts from "./pages/Contacts";
import Personalization from "./pages/Personalization";
import PublicPersonalization from "./pages/PublicPersonalization";
import PublicArtworkApproval from "./pages/PublicArtworkApproval";
import EnhancedPublicForm from "./components/public/EnhancedPublicForm";
import ProductsDebug from "./components/debug/ProductsDebug";
import Settings from "./pages/Settings";
import DebugImages from "./pages/DebugImages";
import DebugProducts from "./pages/DebugProducts";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import PublicFormPage from "./pages/PublicFormPage";
import DesignSystemDemo from "./pages/DesignSystemDemo";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useEffect } from "react";
import { authService } from "./lib/services/authService";
import { UserRole, RolePermissions } from "./types";
import TinyPage from './pages/TinyPage';
import MultipleProductSelection from './pages/MultipleProductSelection';
import './components/tiny/tinyStyles.css';
import { KanbanProvider } from "./contexts/KanbanContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import { TokenTest } from "./components/test/TokenTest";

// Wrapper moderno para o Kanban Board
function ModernKanbanPage() {
  return (
    <div className="h-full">
      <ModernKanbanBoard />
    </div>
  );
}

// Tipo para configuração de rotas protegidas
interface ProtectedRouteConfig {
  path: string;
  element: React.ReactNode;
  permission?: keyof RolePermissions;
  roles?: UserRole[];
}

// Definição de rotas com suas permissões necessárias
const protectedRoutes: ProtectedRouteConfig[] = [
  {
    path: "/",
    element: <ModernKanbanPage />,
    permission: "canViewAllOrders"
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    permission: "canViewReports"
  },
  {
    path: "/contacts",
    element: <Contacts />,
    permission: undefined // Todos os usuários autenticados podem acessar
  },
  {
    path: "/personalization",
    element: <Personalization />,
    permission: undefined // Todos os usuários autenticados podem acessar
  },
  {
    path: "/settings",
    element: <Settings />,
    permission: "canAccessSettings"
  },
  {
    path: "/debug-images",
    element: <DebugImages />,
    roles: ["MASTER"] // Apenas MASTER pode acessar
  },
  {
    path: "/debug-products",
    element: <DebugProducts />,
    roles: ["MASTER"] // Apenas MASTER pode acessar
  },
  {
    path: "/tiny",
    element: <TinyPage />,
    permission: undefined // Todos usuários autenticados podem acessar
  },
  {
    path: "/multiple-products",
    element: <MultipleProductSelection />,
    permission: undefined // Todos usuários autenticados podem acessar
  },
  {
    path: "/design-system-demo",
    element: <DesignSystemDemo />,
    permission: undefined // Todos usuários autenticados podem acessar
  },
];

// Componente para atualizar sessão conforme usuário interage com a aplicação
function SessionKeepAlive() {
  useEffect(() => {
    // Configurar listener para renovar sessão em eventos de mouse e teclado
    const handleActivity = () => {
      if (authService.isLoggedIn()) {
        authService.renewSession();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    // Iniciar verificação periódica de renovação de token
    const tokenRefreshInterval = setInterval(() => {
      if (authService.isLoggedIn()) {
        authService.refreshToken();
      }
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(tokenRefreshInterval);
    };
  }, []);
  
  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" enableSystem={true}>
      <KanbanProvider>
        <TooltipProvider>
          <Sonner position="bottom-right" />
          <BrowserRouter>
            <SessionKeepAlive />
            <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/acesso-negado" element={<AccessDenied />} />
            <Route path="/cadastro" element={<PublicFormPage />} />
            <Route path="/orcamento" element={<EnhancedPublicForm />} />
            <Route path="/personalizar" element={<EnhancedPublicForm />} />
            <Route path="/public/personalize" element={<EnhancedPublicForm />} />
            <Route path="/arte/aprovar/:token" element={<PublicArtworkApproval />} />
            <Route path="/debug/products" element={<ProductsDebug />} />
            <Route path="/public-artwork-approval" element={<PublicArtworkApproval />} />
            <Route path="/token-test" element={<TokenTest />} />

            {/* Rotas protegidas */}
            {protectedRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute
                    requiredRoles={route.roles}
                    requiredPermission={route.permission}
                  >
                    <AppLayout>{route.element}</AppLayout>
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Rota de fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </KanbanProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
