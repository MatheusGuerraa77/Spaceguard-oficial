// src/features/scenario/ScenarioForm.tsx
import { UseFormReturn } from "react-hook-form";
import { SimulationRequest } from "@/types/dto";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Rocket } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AsteroidPicker from "./AsteroidPicker";
import type { NEOSearchItem } from "@/types/dto";

interface ScenarioFormProps {
  form: UseFormReturn<SimulationRequest>;
  onSubmit: (data: SimulationRequest) => void;
  isLoading: boolean;
}

/** Helper para inputs numéricos: usa valueAsNumber e faz fallback seguro */
function toNumberSafe(e: React.ChangeEvent<HTMLInputElement>) {
  const n = e.target.valueAsNumber;
  return Number.isFinite(n) ? n : (e.target.value ? parseFloat(e.target.value) : undefined);
}

export function ScenarioForm({ form, onSubmit, isLoading }: ScenarioFormProps) {
  const handlePick = (neo: NEOSearchItem) => {
    // Se vier diâmetro médio (m), preenche direto
    if (typeof neo.estimated_diameter_m === "number") {
      form.setValue("diameter_m", Math.round(neo.estimated_diameter_m), {
        shouldValidate: true,
        shouldDirty: true,
      });
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
            <CardDescription>
              Configure as características do impacto
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 🔭 Busca (preenche o diâmetro quando disponível) */}
        <AsteroidPicker onPick={handlePick} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                      placeholder="ex: 300"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Tamanho do asteroide em metros
                  </FormDescription>
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
                      placeholder="ex: 3000"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Densidade típica: ~3000 kg/m³ (rochoso)
                  </FormDescription>
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
                      placeholder="ex: 20000"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Velocidade de impacto (20000 m/s = 20 km/s)
                  </FormDescription>
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
                      placeholder="ex: 45"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ângulo de entrada: 0° (rasante) a 90° (vertical)
                  </FormDescription>
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
                      step="0.0001"
                      placeholder="ex: -23.5505"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    -90° a 90° (ou clique no mapa)
                  </FormDescription>
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
                      step="0.0001"
                      placeholder="ex: -46.6333"
                      {...field}
                      onChange={(e) => field.onChange(toNumberSafe(e))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    -180° a 180° (ou clique no mapa)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terreno (inclui AUTO) */}
            <FormField
              control={form.control}
              name="terrain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terreno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o terreno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">Automático (USGS)</SelectItem>
                      <SelectItem value="ocean">Oceano</SelectItem>
                      <SelectItem value="land">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Em <b>Automático</b>, o servidor consulta a elevação (USGS) e
                    decide entre oceano/continente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botão de simulação */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="simulate-button"
            >
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
      </CardContent>
    </Card>
  );
}
