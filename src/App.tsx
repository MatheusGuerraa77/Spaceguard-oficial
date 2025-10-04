// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";

import { Header } from "@/components/Header";   // export nomeado
import { Footer } from "@/components/Footer";   // export nomeado
import { GameProvider } from "@/game/GameContext";

import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import Mitigation from "./pages/Mitigation";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AsteroidSearch from "@/pages/AsteroidSearch"; // << NOVO
import { useEffect } from "react";

const queryClient = new QueryClient();

// (opcional) rola pro topo ao trocar de rota
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
        {/* Toasts globais */}
        <Toaster />
        <Sonner />

        <div className="flex min-h-screen flex-col bg-[#0b1321] text-white">
          <Header />
          <main className="flex-1">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scenario" element={<Scenario />} />
              <Route path="/mitigation" element={<Mitigation />} />
              <Route path="/about" element={<About />} />
              <Route path="/asteroids" element={<AsteroidSearch />} /> {/* << NOVA ROTA */}
              {/* catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
