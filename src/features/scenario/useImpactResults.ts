// src/features/scenario/useImpactResults.ts
import { useEffect, useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import type { SimulationRequest } from "@/types/dto";
import { computeImpact, type ImpactOutputs } from "@/lib/impact";

/** Recalcula resultados sempre que os campos do form mudam */
export function useImpactResults(form: UseFormReturn<SimulationRequest>) {
  const [results, setResults] = useState<ImpactOutputs | null>(null);

  // Observa somente os campos que afetam a física
  const values = useWatch({
    control: form.control,
    name: ["diameter_m", "density_kgm3", "velocity_ms", "angle_deg", "terrain"],
  });

  // Debounce leve para evitar recalcular a cada tecla
  const debounced = useMemo(() => {
    let t: any;
    return (fn: () => void) => {
      clearTimeout(t);
      t = setTimeout(fn, 120);
    };
  }, []);

  useEffect(() => {
    debounced(() => {
      const [diameter_m, density_kgm3, velocity_ms, angle_deg, terrain] = values as any[];

      // Só calcula se houver mínimos válidos
      if (
        typeof diameter_m === "number" && diameter_m > 0 &&
        typeof density_kgm3 === "number" && density_kgm3 > 0 &&
        typeof velocity_ms === "number" && velocity_ms > 0 &&
        typeof angle_deg === "number" && angle_deg >= 0 &&
        typeof terrain === "string" && terrain.length > 0
      ) {
        const out = computeImpact({
          diameter_m,
          density_kgm3,
          velocity_ms,
          angle_deg,
          terrain: terrain === "ocean" ? "ocean" : terrain === "land" ? "land" : "land",
        });
        setResults(out);
      } else {
        setResults(null);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  return results;
}
