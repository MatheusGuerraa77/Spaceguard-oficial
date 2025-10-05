// src/pages/Scenario.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  SimulationRequestSchema,
  type SimulationRequest,
  type SimulationResponse,
  type NEOSearchItem,
} from "@/types/dto";

import { api } from "@/lib/api";
import { mockSimulationResponse } from "@/lib/mocks";
import { ScenarioForm } from "@/features/scenario/ScenarioForm";
import { ResultsPanel } from "@/features/scenario/ResultsPanel";
import { MapView } from "@/features/map/MapView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";

// ✅ Autocomplete + hook para preencher com dados reais
import NeoAutocomplete from "@/features/scenario/NeoAutocomplete";
import { useNeoScenario } from "@/hooks/useNeoScenario";

export default function Scenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [impactPoint, setImpactPoint] = useState<[number, number]>([
    -23.5505,
    -46.6333,
  ]); // [lat, lon] São Paulo

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

  // ✅ Hook que busca detalhe real (NASA) e guarda snapshot
  const { fetchRealValues, resetToReal, loading: loadingNeo } = useNeoScenario();

  // Quando escolhe um NEO no autocomplete → preenche o form com dados reais
  async function handlePickNeo(item: NEOSearchItem) {
    try {
      const real = await fetchRealValues(item);
      form.setValue("diameter_m", real.diameterM);     // metros
      form.setValue("velocity_ms", real.velocityMS);   // m/s
      form.setValue("density_kgm3", real.density);
      form.setValue("angle_deg", real.angleDeg);
      form.setValue("lat", real.lat);
      form.setValue("lon", real.lon);
      // mantém terrain/coupling como estavam
      setImpactPoint([real.lat, real.lon]);
      toast.success(`Dados reais carregados: ${real.name ?? item.name}`);
    } catch (e: any) {
      toast.error("Falha ao obter dados reais do NEO.");
      console.error(e);
    }
  }

  // Botão para restaurar o último snapshot real (caso usuário tenha editado)
  function handleRestoreReal() {
    const snap = resetToReal();
    if (!snap) return;
    form.setValue("diameter_m", snap.diameterM);
    form.setValue("velocity_ms", snap.velocityMS);
    form.setValue("density_kgm3", snap.density);
    form.setValue("angle_deg", snap.angleDeg);
    form.setValue("lat", snap.lat);
    form.setValue("lon", snap.lon);
    setImpactPoint([snap.lat, snap.lon]);
    toast.message("Valores reais restaurados.");
  }

  const onSubmit = async (payload: SimulationRequest) => {
    setIsLoading(true);
    try {
      // api.simulate retorna { ok: boolean; data: SimulationResponse }
      const res = await api.simulate(payload);

      if (!res?.ok) {
        throw new Error("Simulação falhou");
      }

      setResults(res.data); // ✅ agora o tipo bate com SimulationResponse
      setImpactPoint([payload.lat, payload.lon]);
      toast.success("Simulação concluída com sucesso!");
    } catch (error) {
      console.error("Simulation error:", error);
      toast.warning("API indisponível - usando dados de demonstração", {
        description: "Os resultados abaixo são baseados em um cenário de exemplo",
      });
      setResults(mockSimulationResponse);
      setImpactPoint([payload.lat, payload.lon]);
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
    <div className="min-h-screen py-8">
      <div className="container px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Simulador de Cenário</h1>
          <p className="text-muted-foreground text-lg">
            Selecione um asteroide real (ou ajuste manualmente) e visualize o
            impacto estimado.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Sidebar - Busca + Form */}
          <div className="space-y-6">
            {/* 🔎 Autocomplete de NEOs (NASA) */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">Asteroide (dados reais)</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRestoreReal}
                  disabled={loadingNeo}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurar reais
                </Button>
              </div>
              <NeoAutocomplete onPick={handlePickNeo} loadingExternal={loadingNeo} />
              <p className="text-xs text-muted-foreground mt-2">
                Ao selecionar, diâmetro e velocidade são preenchidos com os
                valores mais recentes do NeoWs. Você pode editar os campos à vontade.
              </p>
            </Card>

            {/* Formulário principal */}
            <ScenarioForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
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
                  <h3 className="text-xl font-semibold mb-2">Pronto para simular?</h3>
                  <p className="text-muted-foreground max-w-md">
                    Escolha um asteroide real acima (ou preencha manualmente) e
                    clique em “Simular Impacto”.
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
