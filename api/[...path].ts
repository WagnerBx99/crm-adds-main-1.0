import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'http://31.97.253.85:3001';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Construir a URL do backend
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';
    const queryString = new URL(req.url || '', `https://${req.headers.host}`).search;
    const targetUrl = `${BACKEND_URL}/api/${path}${queryString}`;

    // Preparar headers
    const headers: Record<string, string> = {};
    
    // Copiar headers relevantes
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    // Fazer a requisição ao backend
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Copiar headers da resposta
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });

    // Adicionar headers CORS
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    // Responder com OPTIONS para preflight
    if (req.method === 'OPTIONS') {
      res.status(200).setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        .end();
      return;
    }

    // Retornar a resposta
    const data = await response.text();
    
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
