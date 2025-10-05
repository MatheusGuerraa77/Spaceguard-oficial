/** ===================== TYPES ===================== */
export type ImpactInputs = {
  diameter_m: number;    // Diâmetro do asteroide em metros
  density_kgm3: number;  // Densidade do asteroide em kg/m³
  velocity_ms: number;   // Velocidade de impacto do asteroide em metros por segundo
  angle_deg: number;     // Ângulo de entrada do asteroide (em graus)
  terrain: "land" | "ocean" | "auto";  // Tipo de terreno (Continental ou Oceânico)
};

export type ImpactOutputs = {
  energy_J: number;      // Energia em Joules
  energy_Mt: number;     // Energia em Megatons TNT
  crater_km: number;     // Diâmetro da cratera em quilômetros
  magnitudeMw: number;   // Magnitude sísmica (escala de Richter)
};

/** ===================== CONSTANTS ===================== */
export const MT_TNT_J = 4.184e15;  // 1 Megaton TNT = 4.184e15 Joules
const G = 9.80665;  // Gravidade da Terra (m/s²)
const PI = Math.PI;  // Pi

// Densidade do solo e do oceano
const TARGET_DENSITY = { land: 2500, ocean: 1000 } as const;
const SEISMIC_COUPLING = { land: 1e-4, ocean: 5e-5 } as const;

/** ===================== HELPERS ===================== */
// Função para garantir que os valores não ultrapassem os limites
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// Função para calcular o seno do ângulo em radianos (para evitar valores negativos ou muito pequenos)
function safeSinDeg(deg: number) {
  const rad = clamp(deg, 0, 90) * (PI / 180);  // Converte para radianos
  return Math.max(Math.sin(rad), 0.05);  // Retorna o seno, com mínimo de 0.05
}

// Função para escolher a densidade do terreno com base no tipo (terra ou oceano)
function pickTargetDensity(t: "land" | "ocean") {
  return t === "ocean" ? TARGET_DENSITY.ocean : TARGET_DENSITY.land;
}

// Função para escolher a fração de acoplamento sísmico com base no terreno
function pickCoupling(t: "land" | "ocean") {
  return t === "ocean" ? SEISMIC_COUPLING.ocean : SEISMIC_COUPLING.land;
}

/** ===================== PHYSICS ===================== */

// Cálculo da energia cinética (E = 0.5 * m * v²), sendo m a massa (ρ * volume) e v a velocidade
export function kineticEnergyJ(d: number, rho: number, v: number): number {
  const volume = (PI / 6) * Math.max(d, 0) ** 3;  // Volume do asteroide (esférico)
  const mass = Math.max(rho, 0) * volume;  // Massa do asteroide
  return 0.5 * mass * Math.max(v, 0) ** 2;  // Energia cinética
}

// Função para estimar o diâmetro da cratera com base no modelo π-scaling para alvos rochosos
export function estimateCraterDiameterKm(
  diameter_m: number,
  density_kgm3: number,
  velocity_ms: number,
  angle_deg: number,
  terrain: "land" | "ocean"
): number {
  const K1 = terrain === "ocean" ? 0.95 : 1.161;  // Constante empírica ajustada para oceano/terra
  const mu = 0.55;

  const a = Math.max(diameter_m / 2, 0);  // Raio do impactor
  const v = Math.max(velocity_ms, 1);     // Velocidade de impacto
  const sinT = safeSinDeg(angle_deg);     // Seno do ângulo de entrada (garante valor positivo)

  const rhoT = pickTargetDensity(terrain);  // Densidade do alvo (terra ou oceano)
  const densityRatio = Math.max(density_kgm3, 1) / rhoT;  // Razão de densidade
  const pi2 = (G * a) / (v * v);  // Dependência da gravidade no modelo

  const Rt =
    K1 * a * Math.cbrt(densityRatio) * Math.pow(pi2, -mu / (2 + mu)) * Math.cbrt(sinT);

  const collapse = terrain === "ocean" ? 1.2 : 1.35;  // Fator de colapso para oceano/terra
  const Dm = collapse * 2 * Rt;  // Diâmetro final da cratera
  const Dkm = Math.max(Dm / 1000, 0);  // Converte para quilômetros
  return Number.isFinite(Dkm) ? Dkm : 0;  // Retorna o diâmetro da cratera, garantindo que é um número válido
}

// Função para estimar a magnitude sísmica (Mw) usando a energia
export function estimateSeismicMw(energy_J: number, coupling = 1e-4): number {
  const Es = Math.max(energy_J * coupling, 1);  // Energia sísmica considerando o acoplamento
  return (2 / 3) * Math.log10(Es) - 2.9;  // Fórmula empírica para magnitude sísmica
}

/** ===================== PIPELINE ===================== */
// Função principal para calcular os parâmetros do impacto
export function computeImpact(i: ImpactInputs): ImpactOutputs {
  const d = Math.max(i.diameter_m || 0, 0);  // Diâmetro do asteroide
  const rho = Math.max(i.density_kgm3 || 0, 0);  // Densidade do asteroide
  const v = Math.max(i.velocity_ms || 0, 0);  // Velocidade de impacto
  const ang = clamp(i.angle_deg || 0, 0, 90);  // Ângulo de entrada (0 a 90 graus)
  const terr: "land" | "ocean" = i.terrain === "ocean" ? "ocean" : "land";  // Tipo de terreno

  const energy_J = kineticEnergyJ(d, rho, v);  // Energia cinética
  const energy_Mt = energy_J / MT_TNT_J;  // Energia em Megatons TNT
  const crater_km = estimateCraterDiameterKm(d, rho, v, ang, terr);  // Diâmetro da cratera
  const magnitudeMw = estimateSeismicMw(energy_J, pickCoupling(terr));  // Magnitude sísmica

  return { energy_J, energy_Mt, crater_km, magnitudeMw };  // Retorna todos os resultados calculados
}
