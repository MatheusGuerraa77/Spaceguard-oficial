import type {
  Feature,
  FeatureCollection,
  Polygon,
} from 'geojson';

export type Terrain = 'land' | 'water' | 'auto';

export interface SimulationInput {
  diameter_m: number;     // D (metros)
  density_kgm3: number;   // ρ (kg/m³)
  velocity_ms: number;    // v (m/s)
  angle_deg: number;      // ângulo em relação ao SOLO (0=grazing, 90=vertical)
  lat: number;
  lon: number;
  terrain: Terrain;       // 'land' | 'water' | 'auto'
  coupling?: number;      // fração de acoplamento sísmico [0..1] (padrão 0.03)
}

export interface SimulationOutput {
  energy_J: number;                   // Energia cinética total (J)
  energy_Mt: number;                  // Energia em megatons de TNT
  crater_km: number | null;           // Diâmetro estimado da cratera (km) ou null (oceano)
  Mw_est: number;                     // Magnitude sísmica estimada
  zones: FeatureCollection<Polygon, ZoneProps>; // Zonas de impacto (GeoJSON)
  notes: string[];                    // Observações/metadados
}

/** Energia cinética (J): E = 1/2 * m * v^2, com m = ρ * (π * D^3 / 6) */
export function kineticEnergyJ(inp: SimulationInput): number {
  const { diameter_m: D, density_kgm3: rho, velocity_ms: v } = inp;
  const volume = (Math.PI * Math.pow(D, 3)) / 6; // m³ (esfera)
  const mass = rho * volume;                      // kg
  return 0.5 * mass * v * v;                      // J
}

/** Conversão para megatons de TNT (1 Mt = 4.184e15 J) */
export const toMegatons = (J: number) => J / 4.184e15;

/**
 * Estimativa simplificada de diâmetro de cratera (km) via "rule-of-thumb"
 * para alvos rochosos/terrestres. Para impactos em oceano retornamos null.
 */
export function estimateCraterKm(inp: SimulationInput, E_Mt: number): number | null {
  // evita extremos numéricos de ângulo
  const theta = Math.max(10, Math.min(90, inp.angle_deg));
  // fator de correção angular (menos eficiente para ângulos rasantes)
  const angleFactor = Math.sin((theta * Math.PI) / 180) ** (1 / 3);
  // ordem de grandeza coerente com literatura educacional
  const base = 0.01 * Math.cbrt(E_Mt) * angleFactor; // km
  if (inp.terrain === 'water') return null; // em oceano omitimos cratera
  return Number(base.toFixed(2));
}

/**
 * Magnitude sísmica (Mw) aproximada a partir de energia sísmica acoplada:
 * Es ≈ coupling * E  e  Mw ≈ (2/3) * log10(Es) - 3.2
 */
export function estimateMw(E_J: number, coupling = 0.03): number {
  const E_s = Math.max(1, coupling * E_J); // evita log10(0)
  const Mw = (2 / 3) * Math.log10(E_s) - 3.2;
  return Number(Mw.toFixed(2));
}

/** Propriedades das zonas (GeoJSON) */
type ZoneProps = { level: number; radius_km: number; label: string };

/** Rótulos amigáveis por nível de severidade */
function zoneLabel(level: number) {
  switch (level) {
    case 1: return 'Zona Crítica (sobrepressão/thermal severa)';
    case 2: return 'Zona Alta (danos estruturais extensos)';
    case 3: return 'Zona Moderada (quebras/janelas, lesões)';
    default: return 'Zona';
  }
}

/** Polígono circular geodésico simples centrado em [lat, lon] com raio em km */
function circlePolygon(lat: number, lon: number, radiusKm: number, steps = 128): Polygon {
  const R = 6371; // raio médio da Terra em km
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lon * Math.PI) / 180;
  const d = radiusKm / R;

  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const brng = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 =
      lngRad +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
      );
    coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

/** Coleção de anéis GeoJSON (radiiKm crescentes) */
export function makeImpactZones(
  lat: number,
  lon: number,
  radiiKm: number[]
): FeatureCollection<Polygon, ZoneProps> {
  const features: Feature<Polygon, ZoneProps>[] = radiiKm.map((rKm, idx) => ({
    type: 'Feature' as const,
    properties: {
      level: idx + 1,
      radius_km: rKm,
      label: zoneLabel(idx + 1),
    },
    geometry: circlePolygon(lat, lon, rKm),
  }));

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

/**
 * Executa a simulação completa (educacional):
 * - Energia (J, Mt)
 * - Cratera (km) quando terreno=land
 * - Magnitude sísmica estimada
 * - Zonas GeoJSON escaladas por E^(1/4)
 */
export function runSimulation(inp: SimulationInput): SimulationOutput {
  const E_J = kineticEnergyJ(inp);
  const E_Mt = toMegatons(E_J);
  const crater = estimateCraterKm(inp, E_Mt);
  const Mw = estimateMw(E_J, inp.coupling ?? 0.03);

  // Faixas heurísticas escaladas por E^(1/4): 5–30–80 km (educacional)
  const scale = Math.pow(Math.max(1, E_Mt), 0.25);
  const radii = [5 * scale, 30 * scale, 80 * scale].map((x) => Number(x.toFixed(1)));

  const zones = makeImpactZones(inp.lat, inp.lon, radii);

  const notes: string[] = [
    'Modelo simplificado para fins educacionais (ordem de grandeza).',
    'Energia calculada por 0.5·m·v² com m=ρ·(π·D³/6).',
    '1 Mt = 4.184e15 J. Cratera omitida para impactos em oceano.',
  ];

  return { energy_J: E_J, energy_Mt: E_Mt, crater_km: crater, Mw_est: Mw, zones, notes };
}
