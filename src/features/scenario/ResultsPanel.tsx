import { SimulationResponse } from '@/types/dto';
import { CardMetric } from '@/components/CardMetric';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Zap, Mountain, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResultsPanelProps {
  results: SimulationResponse;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  return (
    <div className="space-y-6" data-testid="results-panel">
      {/* Main Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <CardMetric
          label="Energia Total"
          value={results.energy_Mt.toFixed(2)}
          unit="Mt TNT"
          icon={<Zap className="h-5 w-5 text-warn" />}
          variant="warning"
          tooltip={
            <div className="space-y-2">
              <p>
                <strong>1 Mt = 4.184×10¹⁵ J</strong>
              </p>
              <p>
                Exemplo: O meteoro de Chelyabinsk (2013) liberou aproximadamente 0.5 Mt, 
                quebrando janelas e causando ferimentos em uma área urbana.
              </p>
            </div>
          }
        />

        <CardMetric
          label="Cratera Estimada"
          value={results.crater_km?.toFixed(2) ?? 'N/A'}
          unit="km"
          icon={<Mountain className="h-5 w-5 text-err" />}
          variant="danger"
          tooltip={
            <div className="space-y-2">
              <p>
                <strong>Relação de escala aproximada (pi-scaling)</strong>
              </p>
              <p>
                Valores variam com tipo de solo, ângulo e composição. Impactos oceânicos 
                não formam crateras tradicionais, mas podem gerar tsunamis.
              </p>
            </div>
          }
        />

        <CardMetric
          label="Magnitude Sísmica"
          value={results.Mw_est.toFixed(1)}
          unit="Mw"
          icon={<Activity className="h-5 w-5 text-warn" />}
          variant="warning"
          tooltip={
            <div className="space-y-2">
              <p>
                <strong>Estimativa educativa</strong>
              </p>
              <p>
                Convertemos fração da energia em energia sísmica usando relação USGS. 
                Mw 5-6 = sentido regionalmente; Mw 7+ = danos estruturais significativos.
              </p>
            </div>
          }
        />
      </div>

      {/* Energy in Joules (supplementary) */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 mt-1">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Energia Total (Joules)</p>
              <p className="text-2xl font-bold tabular-nums">
                {results.energy_J.toExponential(2)} J
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Equivalente a {results.energy_Mt.toFixed(2)} megatons de TNT
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Warnings */}
      {results.notes && results.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Notas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.notes.map((note, index) => (
              <Alert key={index} className="bg-card/50">
                <AlertDescription className="text-sm">{note}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Zone Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda das Zonas de Impacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#EF4444] mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Zona 1 - Forte</p>
              <p className="text-xs text-muted-foreground">Danos severos esperados, destruição significativa</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#F59E0B] mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Zona 2 - Moderada</p>
              <p className="text-xs text-muted-foreground">Danos moderados, janelas quebradas, ferimentos possíveis</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#FBBF24] mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Zona 3 - Leve</p>
              <p className="text-xs text-muted-foreground">Efeitos leves, ondas de choque audíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
