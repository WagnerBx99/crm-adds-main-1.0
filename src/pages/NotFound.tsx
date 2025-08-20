import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme, ThemeToggle } from "@/theme/ThemeProvider";

const NotFound = () => {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-7xl font-bold text-accent-primary mb-6">404</div>
        <h1 className="text-2xl font-bold mb-3 text-text-high">Página não encontrada</h1>
        <p className="text-text-low mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild variant="default">
          <Link to="/">Voltar para o Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
