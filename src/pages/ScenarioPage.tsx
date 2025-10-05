// Exemplo: src/pages/ScenarioPage.tsx
import { useForm } from "react-hook-form";
import type { SimulationRequest } from "@/types/dto";
import { ScenarioForm } from "@/features/scenario/ScenarioForm";
import { useImpactResults } from "@/features/scenario/useImpactResults";

function num(n:number, f=2){ return n.toLocaleString("en-US",{maximumFractionDigits:f}); }
function sci(n:number){ return n.toExponential(2).replace("+",""); }

export default function ScenarioPage(){
  const form = useForm<SimulationRequest>({
    defaultValues: { diameter_m:300, density_kgm3:3000, velocity_ms:20000, angle_deg:45, lat:-23.55, lon:-46.63, terrain:"land" }
  });

  const results = useImpactResults(form);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScenarioForm form={form} onSubmit={() => {}} isLoading={false}/>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat title="Energia Total" value={results ? `${num(results.energy_Mt,2)} Mt TNT` : "—"} />
          <Stat title="Cratera Estimada" value={results ? `${num(results.crater_km,2)} km` : "—"} />
          <Stat title="Magnitude Sísmica" value={results ? `${num(results.magnitudeMw,1)} Mw` : "—"} />
        </div>
        <Card className="bg-orange-950/30 border-orange-900/50">
          <CardHeader><CardTitle>Energia Total (Joules)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{results ? `${sci(results.energy_J)} J` : "—"}</div>
            {results && <div className="text-xs text-muted-foreground mt-1">Equivalente a {num(results.energy_Mt,2)} megatons de TNT</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// componente de stat simples
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
function Stat({title, value}:{title:string; value:string}) {
  return (
    <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}
