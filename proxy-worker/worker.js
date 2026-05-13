/**
 * Cloudflare Worker — Reverse Proxy untuk Groq API
 * 
 * Worker ini meneruskan semua request ke api.groq.com
 * sehingga WiFi kantor yang memblokir api.groq.com bisa di-bypass
 * 
 * Deploy gratis di https://workers.cloudflare.com
 * Free tier: 100.000 request/hari (sangat cukup!)
 */

const GROQ_API = 'https://api.groq.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', proxy: 'groq-api' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward request ke Groq API
    const targetUrl = GROQ_API + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set('Host', 'api.groq.com');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });

    // Copy response dan tambah CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    return newResponse;
  },
};
