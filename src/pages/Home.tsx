import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Radar, Zap, Info } from 'lucide-react';

const AsteroidScene = lazy(() =>
  import('@/components/AsteroidScene').then((module) => ({ default: module.AsteroidScene }))
);

export default function Home() {
  const [isHovering, setIsHovering] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.6]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Screen Black */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden nasa-hero"
        style={{ opacity: heroOpacity }}
      >
        {/* 3D Asteroid Scene */}
        <div className="absolute inset-0 w-full h-full">
          <Suspense fallback={<div className="w-full h-full bg-black" />}>
            <AsteroidScene speedMultiplier={isHovering ? 1.5 : 1} />
          </Suspense>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 px-4 md:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-sm backdrop-blur-sm">
                <Shield className="h-4 w-4 text-secondary" />
                <span className="text-white font-medium">NASA Meteor Madness Chalenge</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-none">
                Return to
                <br />
                <span className="text-muted-foreground">SpaceGuard</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl">
                Visualize, understand, and mitigate asteroid impact risks with scientific precision
              </p>

              <motion.div
                className="flex flex-col sm:flex-row items-start gap-4 pt-4"
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
                    className="text-lg px-8 h-14 rounded-2xl bg-primary hover:bg-[hsl(var(--nasa-red-700))] shadow-lg shadow-primary/30 transition-all duration-200"
                  >
                    <Link to="/scenario">
                      <Radar className="mr-2 h-5 w-5" />
                      Defender a Terra
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 h-14 rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm transition-all duration-200"
                  >
                    <Link to="/mitigation">
                      <Zap className="mr-2 h-5 w-5" />
                      Explorar Cenários
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right side - Canvas takes this space */}
            <div className="hidden lg:block" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* What is Impactor-2025 */}
      <section className="container px-4 md:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Card className="max-w-4xl mx-auto nasa-panel">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">O que é o Impactor-2025?</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Entenda a importância da defesa planetária
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Simulação científica:</strong> Calcule energia, crateras e magnitude sísmica
                  de impactos usando dados reais da NASA e USGS
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Visualização intuitiva:</strong> Mapas interativos mostram zonas de impacto
                  e permitem explorar diferentes cenários de ameaça
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Estratégias de mitigação:</strong> Teste como pequenas mudanças de velocidade (∆v)
                  aplicadas com antecedência podem desviar asteroides perigosos
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Features Grid */}
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
                  Acesse informações sobre Near-Earth Objects (NEOs) e simule impactos baseados em física real
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
                  Estimativas de energia (Mt TNT), crateras, magnitude sísmica e zonas de dano usando métodos validados
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
                  Tooltips didáticos, visualizações claras e acessibilidade completa para entender defesa planetária
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
