import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Configuração de proxy para a API do Tiny ERP
      // Isso permite evitar problemas de CORS durante o desenvolvimento
      '/api/tiny': {
        target: 'https://api.tiny.com.br/api2',
        changeOrigin: true,
        rewrite: (path) => {
          // Remove o prefixo /api/tiny e normaliza barras duplas
          const newPath = path.replace(/^\/api\/tiny\/?/, '/').replace(/\/+/g, '/');
          console.log(`[Vite Proxy] ${path} -> ${newPath}`);
          return newPath;
        },
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy] Erro no proxy:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Vite Proxy] Requisição: ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[Vite Proxy] Resposta: ${proxyRes.statusCode} para ${req.url}`);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': {}
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@hello-pangea/dnd',
      'sonner',
      'recharts'
    ],
    exclude: ['lovable-tagger']
  }
}));
