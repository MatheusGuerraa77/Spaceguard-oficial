// src/services/neo.ts
import type { NEOSearchItem, NEOLookupResponse } from "@/types/dto";

const API = "https://api.nasa.gov/neo/rest/v1";
const KEY = import.meta.env.VITE_NASA_KEY || "DEMO_KEY";

/* =========================================
 * Utils: mapeia item do NeoWs -> NEOSearchItem
 * ========================================= */
function mapNeoToItem(n: any): NEOSearchItem {
  const diameterMax = n?.estimated_diameter?.meters?.estimated_diameter_max ?? null;
  return {
    id: String(n?.id ?? ""),
    name: String(n?.name ?? ""),
    designation: n?.designation ? String(n.designation) : undefined,
    estimated_diameter_m: typeof diameterMax === "number" ? diameterMax : null,
    // opcional, casa com seu schema:
    orbit: n?.orbital_data ?? undefined,
  };
}

/* =====================================================
 * Normalizador: NeoWs (lookup por ID) -> NEOLookupResponse
 * ===================================================== */
export function normalizeNeoLookup(raw: any): NEOLookupResponse {
  // média simples do diâmetro em metros, se existir
  const dMin = raw?.estimated_diameter?.meters?.estimated_diameter_min;
  const dMax = raw?.estimated_diameter?.meters?.estimated_diameter_max;

  const estimated_diameter_m =
    typeof dMin === "number" && typeof dMax === "number"
      ? (dMin + dMax) / 2
      : null;

  const absolute_magnitude_h =
    typeof raw?.absolute_magnitude_h === "number"
      ? raw.absolute_magnitude_h
      : undefined;

  // flag PHA (normalizada para o seu DTO)
  const is_potentially_hazardous = !!raw?.is_potentially_hazardous_asteroid;

  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    estimated_diameter_m,
    absolute_magnitude_h,
    is_potentially_hazardous,
    close_approach_data: raw?.close_approach_data,
    orbital_data: raw?.orbital_data,
  };
}

/* ===============================================
 * 1) Busca simples para autocomplete (browse local)
 * =============================================== */
export async function searchNeo(
  q: string,
  opts?: { signal?: AbortSignal }
): Promise<NEOSearchItem[]> {
  const url = `${API}/neo/browse?api_key=${KEY}&page=0&size=50`;
  const res = await fetch(url, { signal: opts?.signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar na NeoWs (${res.status}) ${text}`);
  }

  const data = await res.json();
  const list: any[] = data?.near_earth_objects ?? [];
  const term = q.toLowerCase();

  const filtered = list.filter((n) => {
    const name = String(n?.name ?? "").toLowerCase();
    const desig = String(n?.designation ?? "").toLowerCase();
    const id = String(n?.id ?? "");
    return name.includes(term) || desig.includes(term) || id.includes(q);
  });

  return filtered.map(mapNeoToItem);
}

/* ============================
 * 2) Detalhe por ID (2 variantes)
 * ============================ */

/** Versão BRUTA (como vem da NASA) */
export async function getNeoByIdRaw(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<any> {
  const url = `${API}/neo/${encodeURIComponent(id)}?api_key=${KEY}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao obter NEO por ID (${res.status}) ${text}`);
  }
  return res.json();
}

/** Versão NORMALIZADA (bate com seu NEOLookupResponse do dto.ts) */
export async function getNeoById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<NEOLookupResponse> {
  const raw = await getNeoByIdRaw(id, opts);
  return normalizeNeoLookup(raw);
}

/* ======================================================
 * 3) FEED (janela de até 7 dias) + filtros/ordenação locais
 * ====================================================== */

export type NeoFeedOptions = {
  start: string;           // 'YYYY-MM-DD'
  end: string;             // 'YYYY-MM-DD' (máx. 7 dias após start)
  query?: string;          // termo para nome/designação/id
  phaOnly?: boolean;       // somente potencialmente perigosos
  maxH?: number;           // magnitude H máxima
  minDiameterM?: number;   // diâmetro mínimo em metros
  sort?: "relevance" | "diameter_desc" | "diameter_asc" | "name_az";
  signal?: AbortSignal;
};

export async function fetchNeoFeed(opts: NeoFeedOptions): Promise<NEOSearchItem[]> {
  const { start, end, query, phaOnly, maxH, minDiameterM, sort, signal } = opts;

  const url = `${API}/feed?start_date=${start}&end_date=${end}&api_key=${KEY}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar feed (${res.status}) ${text}`);
  }

  const data = await res.json();

  // O feed vem como { near_earth_objects: { 'YYYY-MM-DD': [NEO, ...], ... } }
  const byDate = data?.near_earth_objects ?? {};
  const flat: any[] = (Object.values(byDate) as any[]).flat();

  // filtros locais
  const term = (query ?? "").toLowerCase();

  let filtered = flat.filter((n) => {
    // PHA
    if (phaOnly && !n?.is_potentially_hazardous_asteroid) return false;

    // H máximo (quanto menor H, mais brilhante/maior em geral)
    if (typeof maxH === "number" && n?.absolute_magnitude_h != null) {
      if (Number(n.absolute_magnitude_h) > maxH) return false;
    }

    // diâmetro mínimo em metros (usa o max estimado como proxy)
    if (typeof minDiameterM === "number") {
      const dmax = n?.estimated_diameter?.meters?.estimated_diameter_max;
      if (!(typeof dmax === "number" && dmax >= minDiameterM)) return false;
    }

    // termo
    if (term) {
      const name = String(n?.name ?? "").toLowerCase();
      const desig = String(n?.designation ?? "").toLowerCase();
      const id = String(n?.id ?? "");
      if (!(name.includes(term) || desig.includes(term) || id.includes(query!))) {
        return false;
      }
    }

    return true;
  });

  // ordenação simples
  if (sort === "diameter_desc") {
    filtered.sort((a, b) => {
      const da = a?.estimated_diameter?.meters?.estimated_diameter_max ?? 0;
      const db = b?.estimated_diameter?.meters?.estimated_diameter_max ?? 0;
      return db - da;
    });
  } else if (sort === "diameter_asc") {
    filtered.sort((a, b) => {
      const da = a?.estimated_diameter?.meters?.estimated_diameter_max ?? 0;
      const db = b?.estimated_diameter?.meters?.estimated_diameter_max ?? 0;
      return da - db;
    });
  } else if (sort === "name_az") {
    filtered.sort((a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? "")));
  } else {
    // "relevance": mantém a ordem natural (ou aqui você poderia pesar PHA + H)
  }

  return filtered.map(mapNeoToItem);
}
