import { NextRequest, NextResponse } from 'next/server';

const TINY_API_BASE_URL = 'https://api.tiny.com.br/api2';
const TINY_API_TOKEN = '9a6db31b0fc596d5911e541f7502c1bfd559744dfe4ba44b99129e876d36c581';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const endpoint = path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Build URL with all query params
    const url = new URL(`${TINY_API_BASE_URL}/${endpoint}`);
    url.searchParams.set('token', TINY_API_TOKEN);
    url.searchParams.set('formato', 'json');
    
    // Copy other params from the request
    searchParams.forEach((value, key) => {
      if (key !== 'token' && key !== 'formato') {
        url.searchParams.set(key, value);
      }
    });

    console.log(`[Tiny Proxy] GET ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Tiny Proxy] Error:', error);
    return NextResponse.json(
      { retorno: { status: 'Erro', erro: 'Erro ao conectar com a API Tiny' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const endpoint = path.join('/');
    const body = await request.text();
    
    const url = `${TINY_API_BASE_URL}/${endpoint}`;
    
    // Parse existing body and add token
    const formData = new URLSearchParams(body);
    formData.set('token', TINY_API_TOKEN);
    formData.set('formato', 'json');

    console.log(`[Tiny Proxy] POST ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Tiny Proxy] Error:', error);
    return NextResponse.json(
      { retorno: { status: 'Erro', erro: 'Erro ao conectar com a API Tiny' } },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
