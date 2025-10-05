// src/lib/nasa.ts
import axios from "axios";

const API_KEY = import.meta.env.VITE_NASA_API_KEY ?? "DEMO_KEY";

export const nasa = axios.create({
  baseURL: "https://api.nasa.gov/neo/rest/v1",
  params: { api_key: API_KEY },
});

// ---- Tipos mínimos (mantivemos só o que usamos) ----
export type NeoWsObject = {
  id: string;
  neo_reference_id?: string;
  name: string;
  designation?: string;
  estimated_diameter?: {
    meters?: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data?: Array<{
    close_approach_date?: string;
    relative_velocity?: {
      kilometers_per_second?: string;
    };
    miss_distance?: {
      kilometers?: string;
    };
    orbiting_body?: string;
  }>;
};

// ---- Endpoints helpers ----

// Lookup por ID (SPK-ID / neo_reference_id)
export async function lookupNeo(id: string): Promise<NeoWsObject> {
  const { data } = await nasa.get(`/neo/${id}`);
  return data;
}

// Browse (paginado). NeoWs não tem “search por nome”, então a estratégia
// mais prática é navegar algumas páginas e filtrar por nome/designation/id.
export async function browseNeos(page = 0, size = 20): Promise<NeoWsObject[]> {
  const { data } = await nasa.get("/neo/browse", { params: { page, size } });
  return data?.near_earth_objects ?? [];
}

// Busca textual “best effort”: varre algumas páginas do browse e filtra.
// Para datasets grandes, considere cache local.
export async function searchNeosByText(
  query: string,
  pagesToScan = 3,
  pageSize = 20
): Promise<NeoWsObject[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out: NeoWsObject[] = [];
  for (let p = 0; p < pagesToScan; p++) {
    const page = await browseNeos(p, pageSize);
    for (const neo of page) {
      const name = `${neo.name ?? ""}`.toLowerCase();
      const desg = `${neo.designation ?? ""}`.toLowerCase();
      const id = `${neo.neo_reference_id ?? neo.id ?? ""}`.toLowerCase();
      if (name.includes(q) || desg.includes(q) || id.includes(q)) out.push(neo);
    }
  }
  return out;
}

// Feed por intervalo de datas (se quiser listar por data de aproximação)
export async function feedNeos(start: string, end: string) {
  const { data } = await nasa.get("/feed", { params: { start_date: start, end_date: end } });
  // retorna no formato daily buckets; você pode achatar como preferir
  return data;
}

// ---- Util: extrair diâmetro & velocidade em m/s ----
export function extractDiameterMeters(neo: NeoWsObject): number | undefined {
  const m = neo?.estimated_diameter?.meters;
  if (!m) return undefined;
  return (m.estimated_diameter_min + m.estimated_diameter_max) / 2; // média
}

export function extractVelocityMs(neo: NeoWsObject): number | undefined {
  const vStr = neo?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second;
  if (!vStr) return undefined;
  const v = parseFloat(vStr);
  if (!isNaN(v) && v > 0) return v * 1000;
  return undefined;
}
