// server/src/services/nasa.ts
import axios from "axios";

const NASA_API = "https://api.nasa.gov/neo/rest/v1";

/**
 * Escolha UMA das duas abordagens de key:
 *  A) travar sem key (produção)  -> use REQUIRED_KEY()
 *  B) permitir DEMO_KEY em dev    -> use SOFT_KEY()
 */
const REQUIRED_KEY = () => {
  const k = process.env.NASA_API_KEY;
  if (!k) throw new Error("Missing NASA_API_KEY");
  return k;
};

const SOFT_KEY = () => process.env.NASA_API_KEY || "DEMO_KEY";

// >>> defina aqui qual prefere usar:
const apiKey = SOFT_KEY; // ou REQUIRED_KEY

// ---------------------------------------------------------------------------
// Utils de erro para respostas não-200
function assertOk(resp: { status: number; data: any; statusText: string }) {
  if (resp.status >= 200 && resp.status < 300) return;

  const d = resp.data || {};
  // NeoWs costuma trazer campos como 'error_message' / 'http_error'
  const msg =
    d.error_message ||
    d.http_error ||
    d.error ||
    d.message ||
    resp.statusText ||
    `HTTP ${resp.status}`;

  const err = new Error(msg) as any;
  err.status = resp.status;
  err.payload = d;
  throw err;
}

// média de diâmetro (m)
function meanDiameterMeters(n: any) {
  const m = n?.estimated_diameter?.meters;
  if (!m) return null;
  const min = Number(m.estimated_diameter_min);
  const max = Number(m.estimated_diameter_max);
  if (!isFinite(min) || !isFinite(max)) return null;
  return (min + max) / 2;
}

// normaliza nome/designação para busca simples
function normalize(s: string) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[()_,\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 🔎 Busca no /neo/browse com paginação, depois filtra no servidor
export async function searchNEO(query: string) {
  const q = normalize(query);
  if (!q) return [];

  // Menos agressivo para evitar 403/429 com DEMO_KEY
  const pageLimit = 3;   // antes 10
  const size = 100;

  const results: any[] = [];

  for (let page = 0; page < pageLimit; page++) {
    const resp = await axios.get(`${NASA_API}/neo/browse`, {
      params: { api_key: apiKey(), size, page },
      timeout: 15000,
      validateStatus: () => true,
    });

    // Se não veio 2xx, lança já com a msg da NASA:
    try {
      assertOk(resp);
    } catch (e: any) {
      // Enriquecer a mensagem em casos comuns
      if (resp.status === 403 || resp.status === 429) {
        e.message =
          resp.data?.error_message ||
          "Rate limit/forbidden da NASA. Use uma NASA_API_KEY válida ou tente novamente em instantes.";
      }
      throw e;
    }

    const chunk = resp.data?.near_earth_objects ?? [];
    for (const n of chunk) {
      const name = normalize(n.name);
      const des  = normalize(n.designation);
      const id   = String(n.neo_reference_id || n.id || "").toLowerCase();
      if (name.includes(q) || des.includes(q) || id.includes(q)) {
        results.push(n);
      }
    }

    const totalPages: number = resp.data?.page?.total_pages ?? pageLimit;
    if (page >= totalPages - 1) break;
    if (results.length >= 200) break; // proteção leve
  }

  // Mapeia só o essencial para o front
  return results.slice(0, 12).map((n) => ({
    id: n.id,
    neo_reference_id: n.neo_reference_id,
    name: n.name,
    designation: n.designation,
    estimated_diameter_m: meanDiameterMeters(n),
    absolute_magnitude_h: n.absolute_magnitude_h,
    is_potentially_hazardous_asteroid: n.is_potentially_hazardous_asteroid,
  }));
}



// 📄 Detalhe por ID
export async function getNEO(id: string) {
  const resp = await axios.get(
    `${NASA_API}/neo/${encodeURIComponent(id)}`,
    {
      params: { api_key: apiKey() },
      timeout: 15000,
      validateStatus: () => true,
    }
  );
  assertOk(resp);
  const data = resp.data;

  return {
    id: data.id,
    name: data.name,
    designation: data.designation,
    est_diameter_m: meanDiameterMeters(data),
    absolute_magnitude_h: data.absolute_magnitude_h,
    close_approach_data: (data.close_approach_data ?? []).map((c: any) => ({
      date: c.close_approach_date_full || c.close_approach_date,
      velocity_kms: Number(c.relative_velocity?.kilometers_per_second),
      miss_distance_km: Number(c.miss_distance?.kilometers),
      orbiting_body: c.orbiting_body,
    })),
  };
}

// (Opcional) Feed por janela de datas — útil para sua página /api/neo/feed
export async function getNeoFeed(start: string, end?: string) {
  const resp = await axios.get(`${NASA_API}/feed`, {
    params: {
      start_date: start,             // Nomes corretos dos parâmetros!
      ...(end ? { end_date: end } : {}),
      api_key: apiKey(),
    },
    timeout: 20000,
    validateStatus: () => true,
  });
  assertOk(resp);
  return resp.data;
}

// (Opcional) Browse “cru” com paginação
export async function getNeoBrowse(page = 0, size = 20) {
  const resp = await axios.get(`${NASA_API}/neo/browse`, {
    params: { page, size, api_key: apiKey() },
    timeout: 15000,
    validateStatus: () => true,
  });
  assertOk(resp);
  return resp.data;
}
