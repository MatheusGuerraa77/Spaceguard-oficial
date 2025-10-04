import { UseFormReturn } from 'react-hook-form';
import { SimulationRequest } from '@/types/dto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Rocket } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ScenarioFormProps {
  form: UseFormReturn<SimulationRequest>;
  onSubmit: (data: SimulationRequest) => void;
  isLoading: boolean;
}

export function ScenarioForm({ form, onSubmit, isLoading }: ScenarioFormProps) {
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Diameter */}
            <FormField
              control={form.control}
              name="diameter_m"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diâmetro (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Tamanho do asteroide em metros
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Density */}
            <FormField
              control={form.control}
              name="density_kgm3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Densidade (kg/m³)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Densidade típica: ~3000 kg/m³ (rochoso)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Velocity */}
            <FormField
              control={form.control}
              name="velocity_ms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidade (m/s)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Velocidade de impacto (20000 m/s = 20 km/s)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Angle */}
            <FormField
              control={form.control}
              name="angle_deg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ângulo (°)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    -180° a 180° (ou clique no mapa)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terrain */}
            <FormField
              control={form.control}
              name="terrain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terreno</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o terreno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ocean">Oceano</SelectItem>
                      <SelectItem value="land">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Tipo de superfície no ponto de impacto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
