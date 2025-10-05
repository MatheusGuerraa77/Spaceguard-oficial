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
    <div>
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
