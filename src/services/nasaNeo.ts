// src/services/nasaNeo.ts
const BASE = "https://api.nasa.gov/neo/rest/v1";
const API_KEY =
  import.meta.env.VITE_NASA_API_KEY?.trim() || "DEMO_KEY";

type Json = any;

async function get(url: string, signal?: AbortSignal): Promise<Json> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    const err = new Error(msg) as any;
    err.status = res.status;
    err.url = url;
    throw err;
  }
  return res.json();
}

export async function neoFeed(
  start: string,
  end: string,
  opts?: { signal?: AbortSignal }
) {
  const url = `${BASE}/feed?start_date=${start}&end_date=${end}&api_key=${API_KEY}`;
  return get(url, opts?.signal);
}

export async function neoLookup(id: string | number, opts?: { signal?: AbortSignal }) {
  const url = `${BASE}/neo/${id}?api_key=${API_KEY}`;
  return get(url, opts?.signal);
}

/* ---- helpers p/ extrair campos úteis ---- */
export function extractDiameterKm(neo: any): number | undefined {
  const km = neo?.estimated_diameter?.kilometers;
  if (!km) return;
  const min = km.estimated_diameter_min, max = km.estimated_diameter_max;
  if (typeof min === "number" && typeof max === "number") return (min + max) / 2;
}

export function extractVelocityKmS(neo: any): number | undefined {
  const v = neo?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function extractApproachInfo(neo: any) {
  const ca = neo?.close_approach_data?.[0];
  return {
    date_full: ca?.close_approach_date_full || ca?.close_approach_date,
    miss_km: Number(ca?.miss_distance?.kilometers) || undefined,
    orbiting_body: ca?.orbiting_body || undefined,
  };
}
