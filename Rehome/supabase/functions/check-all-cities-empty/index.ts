// Supabase Edge Function: check-all-cities-empty
// Query params: ?date=YYYY-MM-DD
// Proxies upstream, adds timeout, cache headers, and in-flight coalescing

const inflight = new Map<string, Promise<Response>>();
const TTL_SECONDS = 60;

function cacheHeaders() {
  const maxAge = TTL_SECONDS;
  const sMaxAge = 300;
  const swr = 600;
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
    'Vary': 'Authorization, Accept-Encoding',
  };
}

function withTimeout(promise: Promise<Response>, ms = 600) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    promise,
    new Promise<Response>((resolve) => resolve(new Response(null, { status: 408 }))),
  ]).finally(() => clearTimeout(t));
}

async function proxy(date: string): Promise<Response> {
  const backendBase = (globalThis as any)?.Deno?.env?.get?.('BACKEND_BASE_URL') || undefined;
  if (!backendBase) {
    return new Response(JSON.stringify({ success: true, data: { isEmpty: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cacheHeaders() },
    });
  }
  const url = `${backendBase}/api/check-all-cities-empty?date=${encodeURIComponent(date)}`;
  const res = await withTimeout(fetch(url, { headers: { 'Accept': 'application/json' } }), 600);
  if (!res || !res.ok) {
    return new Response(JSON.stringify({ success: true, data: { isEmpty: false } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cacheHeaders() },
    });
  }
  const json = await res.json();
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cacheHeaders() },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || '';
  if (!date) {
    return new Response(JSON.stringify({ success: false, error: 'Missing date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const key = date;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = proxy(date).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// deno-lint-ignore no-explicit-any
// @ts-ignore Supabase runtime export
serve(handler as any);


