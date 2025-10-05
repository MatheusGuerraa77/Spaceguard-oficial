// src/services/sbdb.ts
// JPL SBDB + CAD helpers: busca diâmetro, densidade e velocidade relativas

const G = 6.67430e-11; // m^3 kg^-1 s^-2

export type AstroPhysicals = {
  diameter_m?: number;           // convertido de km -> m se vier do SBDB
  density_kgm3: number;          // GM -> albedo -> default
  velocity_ms: number | null;    // CAD v_rel (m/s) ou null se não disponível
  H?: number;                    // magnitude absoluta
  albedo?: number;
  source: "SBDB+CAD";
  method: "GM" | "ALBEDO" | "DEFAULT";
  fromCache: boolean;
  had429: boolean;
  retryCount: number;
};

type SBDBLookup = {
  object?: {
    des?: string;
    fullname?: string;
    phys_par?: {
      diameter?: number; // km
      albedo?: number;
      H?: number;
      GM?: number;       // km^3/s^2
    };
  };
};

// ---- cache simples em memória (browser) ----
const memCache = new Map<string, { when: number; value: AstroPhysicals }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function fetchJSONWithBackoff(
  url: URL,
  init: RequestInit = {},
  maxRetries = 3
): Promise<{ json: any; had429: boolean; retryCount: number }> {
  let retry = 0;
  let had429 = false;

  while (true) {
    const res = await fetch(url.toString(), init);
    if (res.ok) return { json: await res.json(), had429, retryCount: retry };

    const transient = [429, 500, 502, 503, 504].includes(res.status);
    if (!transient || retry >= maxRetries) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text}`);
    }

    if (res.status === 429) had429 = true;

    // Exponential backoff + Retry-After
    let delay = 400 * 2 ** retry + Math.random() * 250;
    const ra = res.headers.get("retry-after");
    if (ra && !Number.isNaN(Number(ra))) delay = Math.max(delay, Number(ra) * 1000);
    await new Promise((r) => setTimeout(r, delay));
    retry++;
  }
}

function densityFromGM(diameter_m?: number, GM_km3s2?: number): number | null {
  if (!diameter_m || !GM_km3s2) return null;
  const GM = GM_km3s2 * 1e9; // km^3/s^2 -> m^3/s^2
  const R = diameter_m / 2;
  // ρ = 3*GM / (4πGR^3)
  return (3 * GM) / (4 * Math.PI * G * R ** 3);
}

function estimateDensityByAlbedo(albedo?: number): number {
  if (typeof albedo === "number") {
    if (albedo < 0.08) return 1500; // C-type provável
    if (albedo >= 0.30) return 3000; // alto albedo
    return 3000;                     // S/M genérico
  }
  return 3000;
}

async function sbdbLookup(s: string) {
  const u = new URL("https://ssd-api.jpl.nasa.gov/sbdb.api");
  u.searchParams.set("sstr", s);
  u.searchParams.set("phys-par", "1");
  u.searchParams.set("full-prec", "1");
  return fetchJSONWithBackoff(u);
}

async function cadVrel(desOrName: string) {
  const u = new URL("https://ssd-api.jpl.nasa.gov/cad.api");
  u.searchParams.set("des", desOrName);
  u.searchParams.set("body", "Earth");
  u.searchParams.set("fields", "des,cd,dist,v_rel");
  u.searchParams.set("limit", "1");
  return fetchJSONWithBackoff(u);
}

/** Consulta físicos (diâmetro, densidade e v_rel) no SBDB + CAD */
export async function getAsteroidPhysicals(key: string): Promise<AstroPhysicals> {
  const now = Date.now();
  const c = memCache.get(key);
  if (c && now - c.when < TTL_MS) return { ...c.value, fromCache: true };

  let had429 = false;
  let retryCount = 0;

  // SBDB
  const sb = await sbdbLookup(key);
  had429 ||= sb.had429;
  retryCount += sb.retryCount;

  const sbdb: SBDBLookup = sb.json;
  const phys = sbdb.object?.phys_par ?? {};
  const km = phys.diameter;
  const diameter_m = typeof km === "number" ? Math.round(km * 1000) : undefined;

  const rhoGM = densityFromGM(diameter_m, phys.GM);
  const density_kgm3 = rhoGM ?? estimateDensityByAlbedo(phys.albedo);
  const method: AstroPhysicals["method"] =
    rhoGM ? "GM" : (typeof phys.albedo === "number" ? "ALBEDO" : "DEFAULT");

  // CAD
  let velocity_ms: number | null = null;
  try {
    const cd = await cadVrel(sbdb.object?.des || key);
    had429 ||= cd.had429;
    retryCount += cd.retryCount;

    const row = cd.json?.data?.[0];
    if (row) velocity_ms = Number(row[3]) * 1000; // km/s -> m/s
  } catch {
    // mantém velocity_ms = null
  }

  const result: AstroPhysicals = {
    diameter_m,
    density_kgm3,
    velocity_ms,
    H: phys.H,
    albedo: phys.albedo,
    source: "SBDB+CAD",
    method,
    fromCache: false,
    had429,
    retryCount,
  };

  memCache.set(key, { when: now, value: result });
  return result;
}
