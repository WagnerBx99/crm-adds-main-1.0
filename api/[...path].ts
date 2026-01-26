import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'http://31.97.253.85:3001';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Construir a URL do backend
    // O path vem como array quando usa [...path]
    let path = '';
    if (req.query.path) {
      path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    }
    
    // Construir query string (excluindo o path)
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete('path');
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    const targetUrl = `${BACKEND_URL}/api/${path}${queryString}`;
    
    console.log('Proxy request to:', targetUrl);

    // Responder com OPTIONS para preflight CORS
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }

    // Preparar headers para o backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Copiar headers relevantes
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    // Preparar body
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Fazer a requisição ao backend
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers,
      body,
    });

    // Adicionar headers CORS na resposta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Copiar content-type da resposta
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Retornar a resposta
    const data = await response.text();
    
    return res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy Error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Erro ao conectar com o backend'
    });
  }
}
