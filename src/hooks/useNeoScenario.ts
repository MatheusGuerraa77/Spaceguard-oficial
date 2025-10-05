 // src/hooks/useNeoScenario.ts
import { useCallback, useRef, useState } from "react";
import { getNeoById } from "@/services/neo";
import type { NEOSearchItem, NEOLookupResponse } from "@/types/dto";

export type ScenarioValues = {
  diameterM: number;     // metros
  density: number;       // kg/m3 (não vem da NASA — default editável)
  velocityMS: number;    // m/s (NASA retorna km/s no close_approach)
  angleDeg: number;      // graus
  lat: number;
  lon: number;
  hMag?: number | null;
  name?: string;
  pha?: boolean;
  approachDate?: string | null;
};

const DEFAULTS = {
  density: 3000,        // rochoso ~3000 kg/m3
  angleDeg: 45,
  lat: -23.5505,        // São Paulo como padrão
  lon: -46.6333,
  vKmsFallback: 20,     // km/s
  diameterFallbackM: 300,
};

export function useNeoScenario() {
  const lastRealRef = useRef<ScenarioValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  /**
   * Busca os valores reais do NEO escolhido e retorna um objeto pronto
   * para preencher o formulário do cenário. Mantém um snapshot interno
   * para permitir "resetar para dados reais" depois.
   */
  const fetchRealValues = useCallback(async (item: NEOSearchItem): Promise<ScenarioValues> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Já retorna NEOLookupResponse NORMALIZADO
      const neo: NEOLookupResponse = await getNeoById(item.id);

      // diâmetro (m): usa o normalizado; senão cai para o estimado da busca; senão, fallback
      const diameterM =
        typeof neo.estimated_diameter_m === "number"
          ? neo.estimated_diameter_m
          : (item.estimated_diameter_m ?? DEFAULTS.diameterFallbackM);

      // velocidade: close_approach_data[0].relative_velocity.kilometers_per_second (km/s) → m/s
      const ca0: any = Array.isArray(neo.close_approach_data) ? neo.close_approach_data[0] : null;
      const vKms = ca0?.relative_velocity?.kilometers_per_second
        ? Number(ca0.relative_velocity.kilometers_per_second)
        : DEFAULTS.vKmsFallback;
      const velocityMS = vKms * 1000;

      const approachDate: string | null =
        (ca0?.close_approach_date_full ||
         ca0?.close_approach_date) ?? null;

      const real: ScenarioValues = {
        diameterM: Math.max(1, Math.round(diameterM)),        // evita zero/negativos
        density: DEFAULTS.density,
        velocityMS: Math.max(1, Math.round(velocityMS)),
        angleDeg: DEFAULTS.angleDeg,
        lat: DEFAULTS.lat,
        lon: DEFAULTS.lon,
        hMag: typeof neo.absolute_magnitude_h === "number" ? neo.absolute_magnitude_h : null,
        name: neo.name ?? item.name,
        // ✅ nome normalizado
        pha: !!neo.is_potentially_hazardous,
        approachDate,
      };

      lastRealRef.current = real;
      return real;
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar dados reais do NEO.");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retorna uma cópia do último snapshot real obtido via fetchRealValues(),
   * para você poder “restaurar valores reais” no formulário se o usuário
   * tiver mexido.
   */
  const resetToReal = useCallback(() => {
    if (!lastRealRef.current) return null;
    return { ...lastRealRef.current };
  }, []);

  return { fetchRealValues, resetToReal, loading, error };
}

export default useNeoScenario;
