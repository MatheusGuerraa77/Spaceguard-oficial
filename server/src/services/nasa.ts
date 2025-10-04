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
  const pageLimit = 10; // ~1000 objetos
  const size = 100;

  const found: any[] = [];
  for (let page = 0; page < pageLimit; page++) {
    const resp = await axios.get(`${NASA_API}/neo/browse`, {
      params: { api_key: apiKey(), size, page },
      timeout: 15000,
      validateStatus: () => true,
    });
    assertOk(resp);

    const data = resp.data;
    const chunk: any[] = data?.near_earth_objects ?? [];
    found.push(
      ...chunk.filter((n) => {
        const name = normalize(n.name);
        const des = normalize(n.designation);
        const id = String(n.neo_reference_id || n.id || "").toLowerCase();
        return name.includes(q) || des.includes(q) || id.includes(q);
      })
    );

    // encerra se acabaram as páginas
    const totalPages: number = data?.page?.total_pages ?? pageLimit;
    if (page >= totalPages - 1) break;

    // proteção leve contra rate limit
    if (found.length >= 200) break;
  }

  return found.slice(0, 12).map((n) => ({
    id: n.id,
    neo_reference_id: n.neo_reference_id,
    name: n.name,
    designation: n.designation,
    est_diameter_m: meanDiameterMeters(n),
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
