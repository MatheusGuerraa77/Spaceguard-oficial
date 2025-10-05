import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Database, AlertTriangle, ExternalLink } from 'lucide-react';

// 🔭 fundo com asteroides (igual Home)
import BackgroundAsteroids from '@/components/space/BackgroundAsteroids';

export default function About() {
  return (
    <div className="relative min-h-screen pb-12">
      {/* fundo animado — mesma aparência da Home */}
      <BackgroundAsteroids speed={1.15} overlayStrength={0.3} />

      <div className="container relative z-10 px-4 md:px-8 max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sobre o SpaceGuard</h1>
          <p className="text-muted-foreground text-lg">Metodologia, fontes de dados e limitações do sistema</p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              SpaceGuard é uma ferramenta educacional desenvolvida para o <strong>NASA Impactor-2025 Challenge</strong>,
              com o objetivo de democratizar o acesso a simulações de impacto de asteroides e estratégias de defesa
              planetária.
            </p>
          </CardContent>
        </Card>

        {/* Accordions */}
        <Accordion type="single" collapsible className="space-y-4">
          {/* How We Calculate */}
          <AccordionItem value="calculations" id="calculations" className="border rounded-2xl px-6 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Como Calculamos?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Energia Cinética</h4>
                <p className="text-sm leading-relaxed">
                  Calculamos a energia do impacto usando a fórmula clássica:{' '}
                  <code className="px-2 py-1 bg-muted rounded text-xs">E = ½ × m × v²</code>
                </p>
                <p className="text-sm mt-2">
                  Onde <strong>m</strong> é a massa (derivada de diâmetro × densidade) e <strong>v</strong> é a
                  velocidade de impacto.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Diâmetro da Cratera</h4>
                <p className="text-sm leading-relaxed">
                  Utilizamos <strong>relações de escala π (pi-scaling)</strong> baseadas em trabalhos como Holsapple &
                  Schmidt (1982) e Collins et al. (2005).
                </p>
                <p className="text-sm mt-2">
                  Fatores considerados: ângulo de impacto, densidade do projétil e do alvo, gravidade local.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Magnitude Sísmica (Mw)</h4>
                <p className="text-sm leading-relaxed">
                  Convertemos uma fração da energia cinética (fator de acoplamento sísmico ~0.02) em energia sísmica,
                  usando a relação USGS:{' '}
                  <code className="px-2 py-1 bg-muted rounded text-xs">log₁₀(E) = 1.5 × Mw + 4.8</code>
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Zonas de Dano</h4>
                <p className="text-sm leading-relaxed">
                  As zonas são círculos concêntricos estimados com base em modelos de sobrepressão atmosférica e ondas
                  de choque. Distâncias variam com a energia total liberada.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Data Sources */}
          <AccordionItem value="sources" id="sources" className="border rounded-2xl px-6 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Fontes de Dados</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">NASA NeoWs API</h4>
                <p className="text-sm leading-relaxed">
                  Dados de Near-Earth Objects (NEOs) provenientes do{' '}
                  <a
                    href="https://api.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    NASA Open API Portal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  . Inclui diâmetros estimados, órbitas e classificação de periculosidade.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">USGS Earthquake Science</h4>
                <p className="text-sm leading-relaxed">
                  Relações de magnitude-energia sísmicas baseadas em{' '}
                  <a
                    href="https://www.usgs.gov/programs/earthquake-hazards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    USGS Earthquake Hazards Program
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Literaturas de Referência</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Holsapple, K.A. & Schmidt, R.M. (1982) - Journal of Geophysical Research</li>
                  <li>Collins, G.S. et al. (2005) - Meteoritics & Planetary Science</li>
                  <li>Brown et al. (2013) - Chelyabinsk airburst analysis</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Limitations & Ethics */}
          <AccordionItem value="limitations" id="limitations" className="border rounded-2xl px-6 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warn" />
                <span className="text-lg font-semibold">Limitações e Ética</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">⚠️ Modelos Simplificados</h4>
                <p className="text-sm leading-relaxed">
                  Esta ferramenta usa <strong>aproximações educacionais</strong>. Simulações reais de impacto requerem
                  códigos hidrodinâmicos complexos (e.g., CTH, iSALE) que modelam fragmentação, vaporização e efeitos
                  atmosféricos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">🌊 Tsunamis Não Modelados</h4>
                <p className="text-sm leading-relaxed">
                  Impactos oceânicos podem gerar tsunamis devastadores. SpaceGuard não modela propagação de ondas
                  marinhas, altura de onda ou zonas costeiras afetadas.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">🛡️ Uso Responsável</h4>
                <p className="text-sm leading-relaxed">
                  Os resultados são <strong>apenas educacionais</strong> e não devem ser usados para planejamento de
                  emergência real. Consulte sempre autoridades oficiais (NASA, ESA, agências de proteção civil) para
                  informações validadas.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">📊 Incertezas</h4>
                <p className="text-sm leading-relaxed">
                  Asteroides reais têm incertezas em composição, densidade, órbita e orientação. Simulações
                  profissionais incluem análises de Monte Carlo com milhares de cenários.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer Note */}
        <Card className="mt-8 bg-card/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              SpaceGuard foi desenvolvido com React, TypeScript, Leaflet e Tailwind CSS. Código aberto e disponível
              para fins educacionais. Para mais informações sobre defesa planetária, visite{' '}
              <a
                href="https://www.nasa.gov/planetarydefense"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NASA Planetary Defense
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
