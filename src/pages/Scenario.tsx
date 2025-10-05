// src/pages/Scenario.tsx
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  SimulationRequestSchema,
  type SimulationRequest,
  type SimulationResponse,
} from "@/types/dto";

import { api } from "@/lib/api"; // seu cliente atual (axios-like)
import { mockSimulationResponse } from "@/lib/mocks";

import { ScenarioForm } from "@/features/scenario/ScenarioForm";
import { ResultsPanel } from "@/features/scenario/ResultsPanel";
import { MapView } from "@/features/map/MapView";

import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Scenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [impactPoint, setImpactPoint] = useState<[number, number]>([
    -23.5505,
    -46.6333,
  ]); // [lat, lon] São Paulo

  // ancora para rolar até os resultados
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<SimulationRequest>({
    resolver: zodResolver(SimulationRequestSchema),
    defaultValues: {
      diameter_m: 300,
      density_kgm3: 3000,
      velocity_ms: 20000,
      angle_deg: 45,
      lat: -23.5505,
      lon: -46.6333,
      // Se quiser ligar o modo automático com USGS, troque 'land' por 'auto'
      terrain: "land",
      coupling: 0.02,
    },
    mode: "onChange",
  });

  // rola até a seção de resultados assim que eles aparecem
  useEffect(() => {
    if (results && resultsAnchorRef.current) {
      resultsAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [results]);

  const onSubmit = async (data: SimulationRequest) => {
    setIsLoading(true);
    setResults(null);

    // proteção: caso o componente desmonte durante a request
    let cancelled = false;
    const cancel = () => (cancelled = true);

    try {
      const response = await api.post<SimulationResponse>("/simulate", data);
      if (cancelled) return;

      setResults(response.data);
      setImpactPoint([data.lat, data.lon]);

      toast.success("Simulação concluída com sucesso!");
    } catch (error: any) {
      if (cancelled) return;

      console.error("Simulation error:", error);

      // Mostra erro com contexto (exibe status se o cliente for axios-like)
      const status =
        error?.response?.status ?? error?.status ?? (error?.message && "—");
      const reason =
        error?.response?.data?.message ||
        error?.message ||
        "Falha ao simular impacto";

      toast.warning("API indisponível - usando dados de demonstração", {
        description:
          typeof status === "number"
            ? `Erro ${status}: ${reason}`
            : `${reason}. Os resultados abaixo são baseados em um cenário de exemplo.`,
      });

      setResults(mockSimulationResponse);
      setImpactPoint([data.lat, data.lon]);
    } finally {
      if (!cancelled) setIsLoading(false);
    }

    return cancel;
  };

  const handleMapClick = (lat: number, lon: number) => {
    form.setValue("lat", lat);
    form.setValue("lon", lon);
    setImpactPoint([lat, lon]);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 md:px-8">
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
            {/* Map */}
            <Card className="overflow-hidden h-[500px] lg:h-[600px]">
              <MapView
                impactPoint={impactPoint}
                zones={results?.zones}
                onMapClick={handleMapClick}
              />
            </Card>

            {/* Anchor para scroll suave até resultados */}
            <div ref={resultsAnchorRef} />

            {/* Loading State */}
            {isLoading && (
              <Card className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Calculando impacto...</p>
              </Card>
            )}

            {/* Results */}
            {results && !isLoading && <ResultsPanel results={results} />}

            {/* Initial State */}
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
                    Configure os parâmetros ao lado e clique em{" "}
                    <strong>“Simular Impacto”</strong> para ver os resultados
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
