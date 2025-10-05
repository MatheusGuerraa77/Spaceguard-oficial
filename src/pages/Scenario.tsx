// src/pages/Scenario.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import PageWithAsteroidBg from '@/components/space/PageWithAsteroidBg';

import {
  SimulationRequestSchema,
  type SimulationRequest,
  type SimulationResponse,
} from '@/types/dto';

import { api } from '@/lib/api';
import { mockSimulationResponse } from '@/lib/mocks';

import { ScenarioForm } from '@/features/scenario/ScenarioForm';
import { ResultsPanel } from '@/features/scenario/ResultsPanel';
import { MapView } from '@/features/map/MapView';

import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/** type-guard para respostas do tipo { data: T } */
function isWrapped<T>(x: unknown): x is { ok?: boolean; data: T } {
  return !!x && typeof x === 'object' && 'data' in (x as any);
}

/** Reposiciona todas as zonas para o [lon, lat] enviado pelo usuário */
function recenterZones(
  res: SimulationResponse,
  lat: number,
  lon: number
): SimulationResponse {
  if (!res?.zones?.features?.length) return res;

  return {
    ...res,
    zones: {
      ...res.zones,
      features: res.zones.features.map((f) => ({
        ...f,
        geometry: {
          // garante o mesmo tipo de geometria (Point) e aplica o novo centro
          ...(f.geometry ?? { type: 'Point' }),
          coordinates: [lon, lat],
        },
      })),
    },
  };
}

export default function Scenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [impactPoint, setImpactPoint] = useState<[number, number]>([
    -23.5505, // São Paulo
    -46.6333,
  ]);

  const form = useForm<SimulationRequest>({
    resolver: zodResolver(SimulationRequestSchema),
    defaultValues: {
      diameter_m: 300,
      density_kgm3: 3000,
      velocity_ms: 20000,
      angle_deg: 45,
      lat: -23.5505,
      lon: -46.6333,
      terrain: 'land',
      coupling: 0.02,
    },
  });

  const onSubmit = async (data: SimulationRequest) => {
    setIsLoading(true);
    try {
      // 1) chama a API
      const raw = await api.simulate(data);

      // 2) normaliza para SimulationResponse (aceita {data: ...} ou o objeto direto)
      const base = isWrapped<SimulationResponse>(raw)
        ? (raw.data as SimulationResponse)
        : (raw as SimulationResponse);

      // 3) força o centro das zonas para o [lat, lon] informados
      const centered = recenterZones(base, data.lat, data.lon);

      setResults(centered);
      setImpactPoint([data.lat, data.lon]);
      toast.success('Simulação concluída com sucesso!');
    } catch (error) {
      console.error('Simulation error:', error);

      toast.warning('API indisponível - usando dados de demonstração', {
        description: 'Os resultados abaixo são baseados em um cenário de exemplo',
      });

      // Mesmo para o mock, recentra as zonas no ponto atual
      const centeredMock = recenterZones(
        mockSimulationResponse,
        form.getValues('lat'),
        form.getValues('lon')
      );

      setResults(centeredMock);
      setImpactPoint([form.getValues('lat'), form.getValues('lon')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    form.setValue('lat', lat);
    form.setValue('lon', lon);
    setImpactPoint([lat, lon]);
  };

  return (
    <PageWithAsteroidBg>
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
              <ScenarioForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
            </div>

            {/* Main Content - Map & Results */}
            <div className="space-y-6">
              {/* Map */}
              <Card className="relative z-0 overflow-hidden h-[500px] lg:h-[600px]">
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
                      Configure os parâmetros ao lado e clique em "Simular Impacto" para ver os resultados
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWithAsteroidBg>
  );
}
