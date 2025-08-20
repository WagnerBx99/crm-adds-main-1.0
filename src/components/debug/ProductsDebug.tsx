import React from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductsDebug() {
  const { products, loading, error } = useProducts();

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Status:</strong> {loading ? 'Carregando...' : 'Carregado'}
            </div>
            
            {error && (
              <div className="text-red-600">
                <strong>Erro:</strong> {error}
              </div>
            )}
            
            <div>
              <strong>Quantidade de produtos:</strong> {products.length}
            </div>
            
            {products.length > 0 && (
              <div>
                <strong>Produtos encontrados:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {products.map(product => (
                    <li key={product.id}>
                      <strong>{product.name}</strong> (ID: {product.id})
                      <br />
                      <span className="text-sm text-gray-600">{product.description}</span>
                      <br />
                      <span className="text-xs text-blue-600">Imagem: {product.imageUrl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <strong>localStorage 'products':</strong>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(JSON.parse(localStorage.getItem('products') || '[]'), null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 