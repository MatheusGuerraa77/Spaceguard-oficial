// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense } from "react";

// ⚠️ Pelo seu projeto: Header/Footer estão em components/ui
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// ⚠️ AsteroidScene está em components/ui
import AsteroidScene from "@/components/AsteroidScene";

// fundo “leve” (usa a mesma cena por trás com um gradiente sutil)
import BackgroundAsteroids from "@/components/space/BackgroundAsteroids";

// Páginas
import Home from "@/pages/Home";
import AsteroidSearch from "@/pages/AsteroidSearch";
import Scenario from "@/pages/Scenario";
import Mitigation from "@/pages/Mitigation";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      {/* Header e Footer sempre acima do fundo */}
      <div className="relative z-20">
        <Header />
      </div>

      {/* Fundo por rota */}
      <RouteBackgrounds />

      {/* Conteúdo */}
      <main className="relative z-10">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/asteroides" element={<AsteroidSearch />} />
            <Route path="/cenario" element={<Scenario />} />
            <Route path="/mitigacao" element={<Mitigation />} />
            <Route path="/sobre" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </BrowserRouter>
  );
}

/**
 * Fundo por rota, como estava:
 *  - "/" usa a cena 3D completa (AsteroidScene)
 *  - demais rotas usam uma versão “leve” com overlay
 * Ambos ficam FIXOS atrás de tudo (-z-10) e não interceptam eventos.
 */
function RouteBackgrounds() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return (
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Suspense fallback={null}>
          <AsteroidScene />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* overlayStrength sutil para não atrapalhar leitura */}
      <BackgroundAsteroids overlayStrength={0.28} />
    </div>
  );
}
