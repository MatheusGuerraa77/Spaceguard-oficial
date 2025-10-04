// src/services/neo.ts

/** ============================
 *  Tipos básicos do NeoWs
 *  (suficiente para as telas atuais)
 *  ============================ */
export type NeoFeed = {
  element_count: number;
  near_earth_objects: Record<string, any[]>;
};

export type NeoBrowsePage = {
  page: {
    size: number;
    total_elements: number;
    total_pages: number;
    number: number;
  };
  near_earth_objects: any[];
};

export type NeoLookup = any;

/** ============================
 *  Config helpers
 *  ============================ */
const BASE = ""; // deixe vazio: Vite proxy redireciona /api → http://localhost:3001
const JSON_HEADERS: HeadersInit = { Accept: "application/json" };

async function handleJson<T>(res: Response): Promise<T> {
  // tenta sempre parsear JSON pra conseguir mensagem de erro do back
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || (data && data.ok === false)) {
    // back costuma mandar { ok:false, error:"..." }
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // quando vem { ok:true, data: ... }
  return (data.data ?? data) as T;
}

/** ============================
 *  Feed (lista por data de aproximação)
 *  GET /api/neo/feed?start=YYYY-MM-DD&end=YYYY-MM-DD
 *  (intervalo máx. 7 dias segundo NeoWs)
 *  ============================ */
export async function fetchNeoFeed(
  start: string,
  end?: string,
  opts?: { signal?: AbortSignal }
): Promise<NeoFeed> {
  const url = new URL(`${BASE}/api/neo/feed`, window.location.origin);
  url.searchParams.set("start", start);
  if (end) url.searchParams.set("end", end);

  const res = await fetch(url.toString().replace(window.location.origin, ""), {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<NeoFeed>(res);
}

/** (Opcional) Feed “achatado” se você criou /api/neo/feed/flat */
export type FeedFlatRow = {
  id: string;
  name: string;
  date: string; // UTC (close_approach_date_full / close_approach_date)
  miss_km: number;
  vel_kms: number;
};

export async function fetchNeoFeedFlat(
  start: string,
  end?: string,
  opts?: { signal?: AbortSignal }
): Promise<FeedFlatRow[]> {
  const url = new URL(`${BASE}/api/neo/feed/flat`, window.location.origin);
  url.searchParams.set("start", start);
  if (end) url.searchParams.set("end", end);

  const res = await fetch(url.toString().replace(window.location.origin, ""), {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<FeedFlatRow[]>(res);
}

/** ============================
 *  Lookup (detalhe por ID)
 *  GET /api/neo/lookup/:id
 *  ============================ */
export async function fetchNeoLookup(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<NeoLookup> {
  const res = await fetch(`/api/neo/lookup/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });
  return handleJson<NeoLookup>(res);
}

/** ============================
 *  Browse (pagina o dataset)
 *  GET /api/neo/browse?page=0&size=20
 *  ============================ */
export async function fetchNeoBrowse(
  page = 0,
  size = 20,
  opts?: { signal?: AbortSignal }
): Promise<NeoBrowsePage> {
  const url = new URL(`${BASE}/api/neo/browse`, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString().replace(window.location.origin, ""), {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<NeoBrowsePage>(res);
}

/** ============================
 *  Utils
 *  ============================ */
// Exponho helpers simples de data usados em páginas
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const plusDaysISO = (d = 1) =>
  new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
