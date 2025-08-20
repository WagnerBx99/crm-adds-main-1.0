import React, { useEffect, useState } from 'react';

export default function DebugImages() {
  const [images, setImages] = useState<string[]>([
    '/images/products/adds_implant.jpg',
    '/images/products/adds_ultra.jpg',
    '/images/products/raspador_lingua.jpg',
    '/images/products/estojo_viagem.jpg'
  ]);
  
  const [baseUrl, setBaseUrl] = useState('');
  
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Depuração de Imagens</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">URL Base: {baseUrl}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {images.map((imageUrl, index) => (
          <div key={index} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-sm">{imageUrl}</h3>
            </div>
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
              <img
                src={`${baseUrl}${imageUrl}`}
                alt={`Imagem ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                onLoad={() => console.log(`Imagem carregada com sucesso: ${imageUrl}`)}
                onError={() => console.error(`Erro ao carregar imagem: ${imageUrl}`)}
              />
            </div>
            <div className="p-4 text-sm">
              <p><strong>Status:</strong> <span id={`status-${index}`} className="text-green-600">Verificando...</span></p>
              <p><strong>URL Completa:</strong> {baseUrl}{imageUrl}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 