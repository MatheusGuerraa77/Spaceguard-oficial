// src/pages/Mitigation.tsx
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/features/map/MapView";
import { Zap, RotateCcw, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 🌌 fundo animado igual à Home
import BackgroundAsteroids from "@/components/space/BackgroundAsteroids";

// ✅ use o autocomplete (ajuste o caminho se o seu arquivo estiver em /features/neo/)
import NeoAutocomplete from "@/features/scenario/NeoAutocomplete";

// Helpers para extrair valores reais da NASA (do arquivo src/lib/nasa.ts)
import {
  type NeoWsObject,
  extractDiameterMeters,
  extractVelocityMs,
} from "@/lib/nasa";

// ---- Tipos utilitários ----
type ZonesFC = GeoJSON.FeatureCollection<GeoJSON.Geometry, any>;

type SelectedNeo = {
  name?: string;
  diameter_m?: number; // metros
  density_kgm3?: number; // kg/m3
  velocity_ms?: number; // m/s
};

// ---- Helpers de física/estimativas ----
function massKg(diameter_m: number, density_kgm3: number) {
  const r = diameter_m / 2;
  const volume_m3 = (4 / 3) * Math.PI * Math.pow(r, 3);
  return volume_m3 * density_kgm3;
}

function kineticEnergyJ(mass_kg: number, velocity_ms: number) {
  return 0.5 * mass_kg * velocity_ms * velocity_ms;
}

function estimatedCraterKm(energyJ: number) {
  const mtTnt = energyJ / 4.184e15; // Joule -> megaton TNT
  return 0.85 * Math.pow(mtTnt, 1 / 4);
}

// gera círculos concêntricos (raios em km)
function makeZones(lat: number, lon: number, energyJ: number): ZonesFC {
  const mtTnt = energyJ / 4.184e15;
  const base = Math.cbrt(mtTnt + 1) * 6; // km (ajuste visual)
  const zones = [
    {
      name: "Zona 1 - Forte",
      radius_km: base * 1.0,
      color: "#ef4444",
      description: "Danos severos; estruturas destruídas.",
    },
    {
      name: "Zona 2 - Moderada",
      radius_km: base * 1.8,
      color: "#f59e0b",
      description: "Danos moderados; janelas quebradas.",
    },
    {
      name: "Zona 3 - Leve",
      radius_km: base * 2.6,
      color: "#22c55e",
      description: "Efeitos leves; ondas de choque audíveis.",
    },
  ];

  const features = zones.map((z) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [lon, lat],
    },
    properties: {
      name: z.name,
      description: z.description,
      color: z.color,
      radius_km: z.radius_km,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

// deslocamento simplificado (educacional) por ∆v e antecedência
function deflectionKm(deltaV_ms: number, daysBefore: number) {
  // fator calibrado para visualização (ajuste conforme necessário)
  return (deltaV_ms * daysBefore) / 2.7;
}

// desloca um ponto (lat,lon) ~ NE
// 1° lat ~ 111 km; 1° lon ~ 111 * cos(lat)
function offsetPoint([lat, lon]: [number, number], km: number): [number, number] {
  const latDegPerKm = 1 / 111;
  const lonDegPerKm = 1 / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat + km * 0.006 * latDegPerKm, lon + km * 0.008 * lonDegPerKm];
}

export default function Mitigation() {
  // ponto original (agora pode vir do clique no mapa)
  const [originalPoint, setOriginalPoint] = useState<[number, number]>([
    -23.5505, // São Paulo
    -46.6333,
  ]);

  // controles de ∆v e antecedência
  const [deltaV, setDeltaV] = useState(5); // m/s
  const [daysBefore, setDaysBefore] = useState(180); // dias

  // parâmetros físicos vindos do NEO (com defaults)
  const [asteroid, setAsteroid] = useState<SelectedNeo>({
    diameter_m: 300,
    density_kgm3: 3000,
    velocity_ms: 20000,
  });

  // deslocamento e ponto mitigado
  const deflection = useMemo(
    () => deflectionKm(deltaV, daysBefore),
    [deltaV, daysBefore]
  );

  const mitigatedPoint = useMemo(
    () => offsetPoint(originalPoint, deflection),
    [originalPoint, deflection]
  );

  // energia/cratera com base no asteroide
  const energyJ = useMemo(() => {
    const m = massKg(asteroid.diameter_m ?? 300, asteroid.density_kgm3 ?? 3000);
    return kineticEnergyJ(m, asteroid.velocity_ms ?? 20000);
  }, [asteroid]);

  const craterKm = useMemo(() => estimatedCraterKm(energyJ), [energyJ]);

  // 🔁 AGORA desenhamos ZONAS no PONTO ORIGINAL (vermelho),
  // enquanto o marcador verde (mitigatedPoint) se desloca com a deflexão.
  const zones = useMemo(
    () => makeZones(originalPoint[0], originalPoint[1], energyJ),
    [originalPoint, energyJ]
  );

  const handleReset = () => {
    setDeltaV(5);
    setDaysBefore(180);
  };

  // Quando seleciona um NEO no autocomplete
  const handlePickNeo = (picked: any) => {
    // Se vier do nosso autocomplete novo, ele pode trazer { raw: NeoWsObject }
    const neo: NeoWsObject = (picked?.raw ?? picked) as NeoWsObject;

    const diameter_m =
      extractDiameterMeters(neo) ?? asteroid.diameter_m ?? 300;

    const velocity_ms =
      extractVelocityMs(neo) ?? asteroid.velocity_ms ?? 20000;

    setAsteroid((prev) => ({
      name: (neo as any)?.name ?? prev.name,
      diameter_m,
      density_kgm3: prev.density_kgm3 ?? 3000, // NeoWs não entrega densidade
      velocity_ms,
    }));
  };

  // Clique no mapa => define novo local de impacto
  const handleMapClick = (lat: number, lon: number) => {
    setOriginalPoint([lat, lon]);
  };

  return (
    <BackgroundAsteroids speed={1.1} overlayStrength={0.35}>
      <div className="min-h-screen py-8">
        <div className="container px-4 md:px-8">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Estratégias de Mitigação</h1>
            <p className="text-muted-foreground text-lg">
              Explore como pequenas mudanças de velocidade podem desviar asteroides perigosos.
              <span className="ml-1 font-medium">Dica:</span> clique no mapa para escolher o local do impacto.
            </p>
          </div>

          <div className="grid lg:grid-cols-[400px_1fr] gap-6">
            {/* Sidebar – parâmetros do asteroide + controles */}
            <div className="space-y-6">
              {/* Card: parâmetros do asteroide */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Parâmetros do Asteroide</CardTitle>
                      <CardDescription>Configure as características do impacto</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* IMPORTANTE: o autocomplete dispara onPick */}
                  <NeoAutocomplete onPick={handlePickNeo} />

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border p-3 bg-card/50">
                      <div className="text-muted-foreground">Diâmetro</div>
                      <div className="font-semibold">
                        {(asteroid.diameter_m ?? 300).toLocaleString()} m
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 bg-card/50">
                      <div className="text-muted-foreground">Densidade</div>
                      <div className="font-semibold">
                        {(asteroid.density_kgm3 ?? 3000).toLocaleString()} kg/m³
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 bg-card/50">
                      <div className="text-muted-foreground">Velocidade</div>
                      <div className="font-semibold">
                        {Math.round((asteroid.velocity_ms ?? 20000) / 1000).toLocaleString()} km/s
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card: parâmetros de deflexão */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Parâmetros de Deflexão</CardTitle>
                      <CardDescription>Configure a manobra de mitigação</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base flex items-center gap-2">
                        Delta-v (∆v)
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">
                                Pequenas mudanças de velocidade aplicadas dias antes podem
                                deslocar significativamente o ponto de impacto.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Badge variant="secondary">{deltaV} m/s</Badge>
                    </div>
                    <Slider
                      value={[deltaV]}
                      onValueChange={(v) => setDeltaV(v[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="focus-visible-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variação de velocidade aplicada ao asteroide
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base flex items-center gap-2">
                        Dias de Antecedência
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">
                                Quanto mais cedo a manobra é aplicada, maior o efeito.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Badge variant="secondary">{daysBefore} dias</Badge>
                    </div>
                    <Slider
                      value={[daysBefore]}
                      onValueChange={(v) => setDaysBefore(v[0])}
                      min={30}
                      max={730}
                      step={10}
                      className="focus-visible-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo disponível antes do impacto previsto
                    </p>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Resetar Cenário
                  </Button>
                </CardContent>
              </Card>

              {/* Resultado do deslocamento */}
              <Card className="border-ok/30 bg-ok/5">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-ok/20">
                      <TrendingDown className="h-5 w-5 text-ok" />
                    </div>
                    <div>
                      <CardTitle className="text-ok">Resultado da Mitigação</CardTitle>
                      <CardDescription>Deslocamento do risco</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-ok mb-2">
                      {deflection.toFixed(1)} km
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Deslocamento estimado do ponto de impacto
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-card/50 space-y-2">
                    <p className="text-sm font-medium">🎯 Defenda a Terra</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Com ∆v de {deltaV} m/s aplicado {daysBefore} dias antes, o asteroide seria
                      desviado em aproximadamente {deflection.toFixed(1)} km, potencialmente evitando
                      o impacto em áreas populadas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main – mapa com comparação e zonas */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação: Antes vs. Depois</CardTitle>
                  <CardDescription>
                    O marcador vermelho mostra o impacto original. O marcador verde mostra o novo
                    ponto após mitigação. <strong>Clique no mapa</strong> para escolher a localização.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[650px]">
                    <MapView
                      impactPoint={originalPoint}
                      mitigatedPoint={mitigatedPoint}
                      showComparison
                      zones={zones}               // zonas centradas no ponto original
                      onMapClick={handleMapClick} // 👈 permite escolher qualquer lugar
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="rounded-lg border p-4 bg-card/60">
                      <div className="text-muted-foreground">Energia total</div>
                      <div className="font-semibold">
                        {(energyJ / 4.184e15).toFixed(2)} Mt TNT
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 bg-card/60">
                      <div className="text-muted-foreground">Cratera estimada</div>
                      <div className="font-semibold">{craterKm.toFixed(2)} km</div>
                    </div>
                    <div className="rounded-lg border p-4 bg-card/60">
                      <div className="text-muted-foreground">Velocidade usada</div>
                      <div className="font-semibold">
                        {Math.round((asteroid.velocity_ms ?? 20000) / 1000)} km/s
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                    <strong className="text-foreground">Nota:</strong> Esta simulação usa modelos
                    simplificados para fins educacionais. Para cálculos orbitais reais, consulte as
                    fontes da NASA. Os parâmetros do asteroide são obtidos do NeoWs quando
                    disponíveis (diâmetro e velocidade). O local do impacto é definido por você no mapa.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </BackgroundAsteroids>
  );
}
