// src/pages/Mitigation.tsx
import { useState } from "react";
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
import BackgroundAsteroids from "@/components/space/BackgroundAsteroids";

export default function Mitigation() {
  const [deltaV, setDeltaV] = useState(5); // m/s
  const [daysBefore, setDaysBefore] = useState(180); // dias

  // Ponto inicial (São Paulo)
  const originalPoint: [number, number] = [-23.5505, -46.6333];

  // Cálculo simplificado do desvio
  const deflectionKm = (deltaV * daysBefore) / 100;

  // Novo ponto após deflexão (offset aproximado)
  const newPoint: [number, number] = [
    originalPoint[0] + deflectionKm * 0.009,
    originalPoint[1] + deflectionKm * 0.012,
  ];

  const handleReset = () => {
    setDeltaV(5);
    setDaysBefore(180);
  };

  return (
    <div className="min-h-screen">
      <BackgroundAsteroids overlayStrength={0.35} />

      <div className="container px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Estratégias de Mitigação</h1>
          <p className="text-muted-foreground text-lg">
            Explore como pequenas mudanças de velocidade podem desviar
            asteroides perigosos
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Sidebar - Controles */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Parâmetros de Deflexão</CardTitle>
                    <CardDescription>
                      Configure a manobra de mitigação
                    </CardDescription>
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
                              Pequenas mudanças de velocidade aplicadas dias
                              antes podem deslocar significativamente o ponto
                              de impacto. Quanto maior o ∆v, maior o desvio.
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
                              Quanto mais cedo a manobra é aplicada, maior o
                              efeito. Mesmo pequenos ∆v podem causar grandes
                              desvios se aplicados com meses de antecedência.
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

            {/* Resultado */}
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
                    {deflectionKm.toFixed(1)} km
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deslocamento estimado do ponto de impacto
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card/50 space-y-2">
                  <p className="text-sm font-medium">🎯 Defenda a Terra</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Com ∆v de {deltaV} m/s aplicado {daysBefore} dias antes,
                    o asteroide seria desviado em aproximadamente{" "}
                    {deflectionKm.toFixed(1)} km, potencialmente evitando o
                    impacto em áreas populadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main - Mapa de comparação */}
          <div className="space-y-6">
            <Card className="relative z-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Comparação: Antes vs. Depois</CardTitle>
                <CardDescription>
                  O marcador vermelho mostra o impacto original. O marcador verde
                  mostra o novo ponto após mitigação.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <MapView
                    impactPoint={originalPoint}
                    mitigatedPoint={newPoint}
                    showComparison
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Nota:</strong> Esta
                  simulação usa modelos simplificados para fins educacionais.
                  Cálculos reais de deflexão de asteroides envolvem mecânica
                  orbital complexa, considerando gravitação, momento angular e
                  trajetórias elípticas. Consulte fontes da NASA para dados
                  precisos de missões planetárias.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
