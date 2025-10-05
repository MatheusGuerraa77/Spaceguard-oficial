// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/ui/Header";

import Home from "@/pages/Home";
import Scenario from "@/pages/Scenario";
import Mitigation from "@/pages/Mitigation";
import About from "@/pages/About";
import AsteroidSearch from "@/pages/AsteroidSearch";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      {/* Header fixo com z-index alto; o conteúdo vem abaixo */}
      <Header />

      {/* Conteúdo principal */}
      <main className="relative z-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scenario" element={<Scenario />} />
          <Route path="/mitigation" element={<Mitigation />} />
          <Route path="/about" element={<About />} />
          <Route path="/asteroids" element={<AsteroidSearch />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
