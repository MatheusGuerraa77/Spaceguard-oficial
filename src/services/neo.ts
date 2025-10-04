// src/services/neo.ts

/** ============================
 * Tipos usados
 * ============================ */
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

export type NEOSearchItem = {
  id: string;
  name: string;
  estimated_diameter_m: number | null;
};

/** ============================
 * Helpers
 * ============================ */
const BASE = ""; // via proxy do Vite
const JSON_HEADERS: HeadersInit = { Accept: "application/json" };

async function handleJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (data.data ?? data) as T;
}

/** ============================
 * Feed
 * ============================ */
export async function fetchNeoFeed(
  start: string,
  end?: string,
  opts?: { signal?: AbortSignal }
): Promise<NeoFeed> {
  const url = new URL(`${BASE}/api/neo/feed`, window.location.origin);
  url.searchParams.set("start", start);
  if (end) url.searchParams.set("end", end);

  const res = await fetch(url.pathname + url.search, {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<NeoFeed>(res);
}

/** Feed “achatado” opcional */
export type FeedFlatRow = {
  id: string;
  name: string;
  date: string;
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

  const res = await fetch(url.pathname + url.search, {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<FeedFlatRow[]>(res);
}

/** ============================
 * Lookup por ID
 * ============================ */
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
 * Browse
 * ============================ */
export async function fetchNeoBrowse(
  page = 0,
  size = 20,
  opts?: { signal?: AbortSignal }
): Promise<NeoBrowsePage> {
  const url = new URL(`${BASE}/api/neo/browse`, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.pathname + url.search, {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<NeoBrowsePage>(res);
}

/** ============================
 * Search (para o AsteroidPicker)
 * GET /api/neo/search?q=...
 * ============================ */
export async function searchNeo(
  q: string,
  opts?: { signal?: AbortSignal }
): Promise<NEOSearchItem[]> {
  const url = new URL(`/api/neo/search`, window.location.origin);
  url.searchParams.set("q", q);

  const res = await fetch(url.pathname + url.search, {
    method: "GET",
    headers: JSON_HEADERS,
    signal: opts?.signal,
  });

  return handleJson<NEOSearchItem[]>(res);
}

/** Utils de data (se precisar em outras telas) */
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const plusDaysISO = (d = 1) =>
  new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
