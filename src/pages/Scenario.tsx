// src/pages/Scenario.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  SimulationRequestSchema,
  type SimulationRequest,
  type SimulationResponse,
} from "@/types/dto";

// IMPORTS: tente pegar tanto o axios instance (api) quanto possíveis funções
// que alguém possa ter criado (simulate/simulateImpact). O TS não reclama se
// elas não existirem; só usamos se vierem definidas.
import * as ApiModule from "@/lib/api";

import { mockSimulationResponse } from "@/lib/mocks";
import { ScenarioForm } from "@/features/scenario/ScenarioForm";
import { ResultsPanel } from "@/features/scenario/ResultsPanel";
import { MapView } from "@/features/map/MapView";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import BackgroundAsteroids from "@/components/space/BackgroundAsteroids";

export default function Scenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [impactPoint, setImpactPoint] = useState<[number, number]>([
    -23.5505,
    -46.6333,
  ]); // São Paulo

  const form = useForm<SimulationRequest>({
    resolver: zodResolver(SimulationRequestSchema),
    defaultValues: {
      diameter_m: 300,
      density_kgm3: 3000,
      velocity_ms: 20000,
      angle_deg: 45,
      lat: -23.5505,
      lon: -46.6333,
      terrain: "land",
      coupling: 0.02,
    },
  });

  // Utilitário: chama o que existir (simulate função OU api.post axios)
  async function runSimulation(payload: SimulationRequest): Promise<SimulationResponse> {
    // 1) Preferência: função exportada (alguém pode ter escrito assim)
    const simulateFn =
      (ApiModule as any).simulate ||
      (ApiModule as any).simulateImpact ||
      (ApiModule as any).runSimulation;

    if (typeof simulateFn === "function") {
      const data = await simulateFn(payload);
      return data as SimulationResponse;
    }

    // 2) Fallback: axios instance com .post
    const api = (ApiModule as any).api;
    if (api && typeof api.post === "function") {
      const res = await api.post<SimulationResponse>("/simulate", payload);
      return res.data;
    }

    // 3) Nada disponível -> lança erro explícito
    throw new Error(
      "Nenhuma função de simulação encontrada em '@/lib/api'. Esperado 'simulate(...)' ou 'api.post(...)'."
    );
  }

  const onSubmit = async (data: SimulationRequest) => {
    setIsLoading(true);
    try {
      const responseData = await runSimulation(data);
      setResults(responseData);
      setImpactPoint([data.lat, data.lon]);
      toast.success("Simulação concluída com sucesso!");
    } catch (error) {
      console.error("Simulation error:", error);
      toast.warning("API indisponível — usando dados de demonstração", {
        description:
          "Os resultados abaixo são baseados em um cenário de exemplo.",
      });
      setResults(mockSimulationResponse);
      setImpactPoint([data.lat, data.lon]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    form.setValue("lat", lat);
    form.setValue("lon", lon);
    setImpactPoint([lat, lon]);
  };

  return (
    <div className="min-h-screen">
      <BackgroundAsteroids speed={1.15} overlayStrength={0.35} />

      <div className="container px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Simulador de Cenário</h1>
          <p className="text-muted-foreground text-lg">
            Configure os parâmetros do asteroide e visualize o impacto estimado
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Sidebar - Form */}
          <div className="space-y-6">
            <ScenarioForm
              form={form}
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </div>

          {/* Main Content - Map & Results */}
          <div className="space-y-6">
            <Card className="relative z-0 overflow-hidden h-[500px] lg:h-[600px]">
              <MapView
                impactPoint={impactPoint}
                zones={results?.zones}
                onMapClick={handleMapClick}
              />
            </Card>

            {isLoading && (
              <Card className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Calculando impacto...</p>
              </Card>
            )}

            {results && !isLoading && <ResultsPanel results={results} />}

            {!results && !isLoading && (
              <Card className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Pronto para simular?
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Configure os parâmetros ao lado e clique em “Simular
                    Impacto” para ver os resultados
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
