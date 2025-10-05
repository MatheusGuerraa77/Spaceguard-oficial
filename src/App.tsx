// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameProvider } from "@/game/GameContext";

import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import Mitigation from "./pages/Mitigation";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AsteroidSearch from "@/pages/AsteroidSearch";

import { useEffect } from "react";
import GlobalStarfield from "@/components/GlobalStarfield"; // <— IMPORT AQUI

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TooltipProvider>
        {/* fundo animado global — sutil */}
        <GlobalStarfield density={200} speed={14} />

        {/* Toasts globais */}
        <Toaster />
        <Sonner />

        {/* Remova fundo opaco aqui; deixe transparente */}
        <div className="flex min-h-screen flex-col bg-transparent">
          {/* conteúdo acima do canvas */}
          <div className="relative z-10">
            <Header />
            <main className="flex-1">
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/scenario" element={<Scenario />} />
                <Route path="/mitigation" element={<Mitigation />} />
                <Route path="/about" element={<About />} />
                <Route path="/asteroids" element={<AsteroidSearch />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
