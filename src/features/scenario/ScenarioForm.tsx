import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import type { SimulationRequest, NEOSearchItem } from "@/types/dto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AsteroidPicker from "./AsteroidPicker";
import { getAsteroidPhysicals } from "@/services/sbdb"; 
import { computeImpact, ImpactOutputs } from "@/lib/impact"; // Importar ImpactOutputs

/** Adaptador robusto p/ inputs numéricos */
function numberChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (v: number | "" | null) => void
) {
  const txt = e.currentTarget.value;
  if (txt === "") return onChange("");                   // permite apagar tudo
  const n = Number(txt.replace(",", "."));               // aceita vírgula
  if (Number.isFinite(n)) onChange(n);                   // só envia número válido
}

interface Props {
  form: UseFormReturn<SimulationRequest>;
  onSubmit: (data: SimulationRequest) => void;
  isLoading: boolean;
}

export function ScenarioForm({ form, onSubmit, isLoading }: Props) {
  const [result, setResult] = React.useState<ImpactOutputs | null>(null); // Usando ImpactOutputs agora
  const [isApiAvailable, setIsApiAvailable] = React.useState(true);

  /** Dispara ao escolher um NEO no picker */
  const handlePick = React.useCallback(async (neo: NEOSearchItem) => {
    if (typeof neo.estimated_diameter_m === "number") {
      form.setValue("diameter_m", Math.round(neo.estimated_diameter_m), {
        shouldValidate: true, shouldDirty: true,
      });
    }

    const key = neo.designation || neo.name || neo.id || "";
    if (!key) return;

    try {
      const phy = await getAsteroidPhysicals(key);

      // Preenche os campos com dados da API
      if (phy.diameter_m) {
        form.setValue("diameter_m", phy.diameter_m, { shouldValidate: true, shouldDirty: true });
      }
      if (typeof phy.velocity_ms === "number") {
        form.setValue("velocity_ms", phy.velocity_ms, { shouldValidate: true, shouldDirty: true });
      }
      form.setValue("density_kgm3", phy.density_kgm3, { shouldValidate: true, shouldDirty: true });

      // opcional: meta/badges
      try {
        form.setValue(
          "meta" as any,
          { H: phy.H ?? null, albedo: phy.albedo ?? null, method: phy.method, source: "SBDB+CAD" },
          { shouldDirty: true }
        );
      } catch {}
      
      setIsApiAvailable(true); // API disponível
    } catch (err) {
      console.warn("SBDB/CAD falhou:", err);
      setIsApiAvailable(false); // API indisponível
    }
  }, [form]);

  /** Função que lida com o envio do formulário */
  const handleSubmit = (data: SimulationRequest) => {
    if (!isApiAvailable) {
      // Caso a API não esteja disponível, realiza o cálculo localmente
      const impactResult = computeImpact({
        diameter_m: data.diameter_m,
        density_kgm3: data.density_kgm3,
        velocity_ms: data.velocity_ms,
        angle_deg: data.angle_deg,
        terrain: data.terrain,
      });

      // Armazenar os resultados no estado
      setResult(impactResult);
    } else {
      // Caso a API esteja funcionando, os cálculos são feitos com os dados da API
      console.log("API está funcionando, calcule com dados da API");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Parâmetros do Asteroide</CardTitle>
            <CardDescription>Configure as características do impacto</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 🔭 Busca (preenche diâmetro/velocidade/densidade quando possível) */}
        <AsteroidPicker onPick={handlePick} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            handleSubmit(data); // Chama a função de cálculo
            onSubmit(data);  // Isso pode ser ajustado conforme a lógica de submissão do seu formulário
          })} className="space-y-4 mt-4">

            {/* Diâmetro */}
            <FormField
              control={form.control}
              name="diameter_m"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diâmetro (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="ex: 300"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(n);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Tamanho do asteroide em metros</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Densidade */}
            <FormField
              control={form.control}
              name="density_kgm3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Densidade (kg/m³)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="ex: 3000"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(n);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Densidade típica: ~3000 kg/m³ (rochoso)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Velocidade */}
            <FormField
              control={form.control}
              name="velocity_ms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidade (m/s)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="ex: 20000"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(n);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Velocidade de impacto (20000 m/s = 20 km/s)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ângulo */}
            <FormField
              control={form.control}
              name="angle_deg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ângulo (°)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="ex: 45"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(Math.min(Math.max(n, 0), 90));
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Ângulo de entrada: 0° (rasante) a 90° (vertical)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Latitude */}
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.0001"
                      placeholder="ex: -23.5505"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(Math.min(Math.max(n, -90), 90));
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">-90° a 90° (ou clique no mapa)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Longitude */}
            <FormField
              control={form.control}
              name="lon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.0001"
                      placeholder="ex: -46.6333"
                      value={field.value ?? ""}
                      onChange={(e) => numberChange(e, field.onChange)}
                      onBlur={(e) => {
                        const n = Number((e.currentTarget.value || "").replace(",", "."));
                        if (Number.isFinite(n)) field.onChange(Math.min(Math.max(n, -180), 180));
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">-180° a 180° (ou clique no mapa)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

           

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="simulate-button">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Simular Impacto
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Exibir os resultados de impacto */}
        {result && (
          <div className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Simulação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Energia Total (Joules)</span>
                    <span>{result.energy_J.toExponential(2)} J</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Energia Total (Mt TNT)</span>
                    <span>{result.energy_Mt.toFixed(2)} Mt TNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Cratera Estimada (km)</span>
                    <span>{result.crater_km.toFixed(2)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Magnitude Sísmica</span>
                    <span>{result.magnitudeMw.toFixed(2)} Mw</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScenarioForm;
