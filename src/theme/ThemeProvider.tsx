import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook personalizado para usar o tema
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Hook para detectar preferência do sistema
const useSystemTheme = (): Theme => {
  const [systemTheme, setSystemTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return systemTheme;
};

// Hook para localStorage com SSR-safe
const useLocalStorage = (key: string, initialValue: Theme | null): [Theme | null, (value: Theme | null) => void] => {
  const [storedValue, setStoredValue] = useState<Theme | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        return item ? (JSON.parse(item) as Theme) : initialValue;
      } catch (error) {
        console.warn('Erro ao ler localStorage:', error);
        return initialValue;
      }
    }
    return initialValue;
  });

  const setValue = (value: Theme | null) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  enableSystem = true,
}) => {
  const systemTheme = useSystemTheme();
  const [storedTheme, setStoredTheme] = useLocalStorage('app-theme', null);
  
  // Determina o tema atual baseado na preferência armazenada ou sistema
  const [theme, setThemeState] = useState<Theme>(() => {
    if (storedTheme) {
      return storedTheme;
    }
    return enableSystem ? systemTheme : defaultTheme;
  });

  // Aplicar tema no documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove classes de tema existentes
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');
    
    // Aplica o novo tema
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    
    // Meta theme-color para mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        theme === 'dark' ? '#0F111A' : '#FFFFFF'
      );
    }
  }, [theme]);

  // Atualiza tema quando a preferência do sistema muda (se não há preferência manual)
  useEffect(() => {
    if (enableSystem && !storedTheme) {
      setThemeState(systemTheme);
    }
  }, [systemTheme, enableSystem, storedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Componente para toggle de tema
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md p-2
        bg-surface-1 hover:bg-surface-1/hover
        text-text-high hover:text-text-high/hover
        border border-accent-primary/20
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
        ${className}
      `}
      aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      )}
    </button>
  );
}; 