// src/pages/Home.tsx
import {
  lazy,
  Suspense,
  useMemo,
  useState,
  useEffect,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Shield, Radar, Zap, Info } from "lucide-react";

/* ===========================
   BG com asteróides (camada fixa global via portal)
   (tipado para aceitar speedMultiplier)
=========================== */
type AsteroidSceneProps = { speedMultiplier?: number };
const AsteroidScene = lazy<ComponentType<AsteroidSceneProps>>(async () => {
  const m = await import("../components/AsteroidScene");
  // Funciona com "export const AsteroidScene" ou "export default"
  return { default: (m as any).AsteroidScene ?? m.default };
});

/** Renderiza o AsteroidScene no #cosmos-root (camada fixa, atrás do conteúdo) */
function FixedAsteroids({ speed }: { speed: number }) {
  const mount = useMemo(() => document.getElementById("cosmos-root"), []);
  if (!mount) return null;
  return createPortal(
    <Suspense fallback={null}>
      <AsteroidScene speedMultiplier={speed} />
    </Suspense>,
    mount
  );
}

/* ===========================
   Terra + órbitas (sem linhas/labels)
=========================== */
const OrbitScene = lazy(() => import("../features/orbit3d/OrbitScene"));

/* ===========================
   HUD D3 (radar) — sobrepõe a Terra
=========================== */
const HUDOverlay = lazy(() => import("../features/orbit3d/HUDOverlay"));

export default function Home() {
  const [isHovering, setIsHovering] = useState(false);
  const [hudSpeed, setHudSpeed] = useState<number | undefined>(undefined);
  const [hudAlt, setHudAlt] = useState<number | undefined>(undefined);

  // fade do herói conforme scroll
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.6]);

  // tamanho responsivo do quadro da Terra (para não cobrir o texto)
  const [vw, setVw] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const earthMax = useMemo(() => {
    if (vw < 640) return 340; // sm
    if (vw < 1024) return 520; // md
    if (vw < 1440) return 640; // lg
    return 760; // xl+
  }, [vw]);

  return (
    <div className="min-h-screen">
      {/* Fundo 3D fixo: já aparece atrás do herói assim que carrega */}
      <FixedAsteroids speed={isHovering ? 1.4 : 1} />

      {/* ============================= HERO ============================= */}
      <motion.section
        className="relative min-h-[88vh] flex items-center"
        style={{ opacity: heroOpacity }}
      >
        {/* Conteúdo do herói em 2 colunas no lg, empilha no mobile */}
        <div className="container relative z-10 px-4 md:px-8 py-16 grid gap-12 lg:grid-cols-2 items-center">
          {/* Coluna: texto + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-sm backdrop-blur-sm">
              <Shield className="h-4 w-4 text-secondary" />
              <span className="text-white font-medium">
                NASA Meteor Madness Challenge
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95]">
              Return to
              <br />
              <span className="text-muted-foreground">SpaceGuard</span>
            </h1>

            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl">
              Visualize, understand, and mitigate asteroid impact risks with
              scientific precision
            </p>

            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
              >
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-8 h-14 rounded-2xl bg-primary hover:bg-[hsl(var(--nasa-red-700))] shadow-lg shadow-primary/30 transition-all"
                >
                  <Link to="/scenario">
                    <Radar className="mr-2 h-5 w-5" />
                    Explorar Cenários
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14 rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm transition-all"
                >
                  <Link to="/mitigation">
                    <Zap className="mr-2 h-5 w-5" />
                    Defender a Terra
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Coluna: Terra 3D (responsivo e sem borda) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex justify-center lg:justify-end"
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: `min(90vw, ${earthMax}px)`,
                aspectRatio: 1,
              }}
            >
              <div className="absolute inset-0">
                <Suspense fallback={<div className="w-full h-full bg-black/50" />}>
                  <OrbitScene
                    speed={1}
                    accent="#0B3D91"
                    asteroidCount={24}
                    highlights={0}
                    onSelect={(info) => {
                      setHudSpeed(info.speedKms);
                      setHudAlt(info.altitudeKm);
                    }}
                  />
                </Suspense>

                {/* HUD D3 — aparece após clicar em um asteroide */}
                {(hudSpeed ?? hudAlt) !== undefined && (
                  <div className="absolute inset-0 pointer-events-none">
                    <Suspense fallback={null}>
                      <HUDOverlay
                        speedKms={hudSpeed}
                        altitudeKm={hudAlt}
                        energyMt={120}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Indicador de scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ======================= Seção explicativa ======================= */}
      <section className="container px-4 md:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Card className="max-w-4xl mx-auto nasa-panel">
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Ícone + POPUP (Dialog) */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      aria-label="Saiba mais sobre o Impactor-2025"
                    >
                      <Info className="h-6 w-6 text-primary" />
                    </button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Impactor-2025 — Sobre o cenário</DialogTitle>
                      <DialogDescription>
                        Contexto do desafio e como os dados são usados na plataforma.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        O cenário “Impactor-2025” é uma <strong>demonstração</strong> que
                        integra dados da <strong>NASA NeoWs</strong> (características de
                        NEOs) e do <strong>USGS</strong> (contexto geológico/ambiental)
                        para simular impactos, estimar energia, crateras e efeitos
                        (sísmicos/tsunami) de maneira educativa.
                      </p>

                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>Entrada do usuário:</strong> diâmetro, densidade,
                          velocidade, ângulo e localização do impacto (ou carregue um NEO
                          real via busca).
                        </li>
                        <li>
                          <strong>Modelo físico simplificado:</strong> converte massa e
                          velocidade em energia (Mt TNT), estima tamanho de cratera e
                          magnitude sísmica equivalente.
                        </li>
                        <li>
                          <strong>Camadas do USGS:</strong> ajudam a contextualizar riscos
                          (elevação/zonas costeiras, atividade sísmica histórica) nas
                          visualizações.
                        </li>
                        <li>
                          <strong>Mitigação:</strong> teste deflexões com ∆v e visualize o
                          novo ponto de impacto no mapa.
                        </li>
                      </ul>

                      <p className="text-xs">
                        Nota: Os resultados são aproximados e destinados a fins
                        educacionais. Para operações reais, consulte documentação técnica
                        e missões da NASA/USGS.
                      </p>

                      <div className="text-xs">
                        Recursos:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>
                            <a
                              href="https://api.nasa.gov/"
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:no-underline"
                            >
                              NASA APIs (NeoWs)
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://earthquake.usgs.gov/"
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:no-underline"
                            >
                              USGS — Earthquake Hazards / NEIC
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Título e descrição */}
                <div>
                  <CardTitle className="text-2xl mb-2">
                    O que é o Impactor-2025?
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Entenda a importância da defesa planetária
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Simulação científica:</strong>{" "}
                Calcule energia, crateras e magnitude sísmica de impactos usando
                dados reais da NASA e USGS.
              </p>
              <p>
                <strong className="text-foreground">Visualização intuitiva:</strong>{" "}
                Mapas interativos mostram zonas de impacto e permitem explorar
                diferentes cenários.
              </p>
              <p>
                <strong className="text-foreground">Estratégias de mitigação:</strong>{" "}
                Teste como pequenas mudanças de velocidade (∆v) desviam
                asteroides perigosos.
              </p>

              {/* Botão direto para o cenário */}
              <div className="pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl px-6 h-11 bg-primary hover:bg-[hsl(var(--nasa-red-700))] shadow-primary/30"
                >
                  <Link to="/scenario">
                    <span className="mr-2">🛰️</span>
                    Carregar cenário Impactor-2025
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ======================= Features Grid ======================= */}
      <section className="container px-4 md:px-8 py-16 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.06 }}
          className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-hover nasa-panel h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Radar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Dados da NASA</CardTitle>
                <CardDescription>
                  Acesse informações sobre Near-Earth Objects (NEOs) e simule
                  impactos baseados em física real
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-hover nasa-panel h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Cálculos Precisos</CardTitle>
                <CardDescription>
                  Estimativas de energia (Mt TNT), crateras, magnitude sísmica e
                  zonas de dano usando métodos validados
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-hover nasa-panel h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-[hsl(var(--ok))]/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[hsl(var(--ok))]" />
                </div>
                <CardTitle>Interface Educacional</CardTitle>
                <CardDescription>
                  Tooltips didáticos, visualizações claras e acessibilidade
                  completa para entender defesa planetária
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
