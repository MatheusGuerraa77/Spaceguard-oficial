// src/components/Header.tsx
import { TopBar } from "./TopBar";
import Navbar from "./Navbar";

export function Header() {
  return (
    <header
      className="
        sticky top-0 z-[2000]
        border-b border-border
        bg-background/70 backdrop-blur
        supports-[backdrop-filter]:bg-background/60
      "
    >
      {/* Top bar */}
      <div className="relative z-10">
        <TopBar />
      </div>

      {/* Navbar principal */}
      <div className="relative z-10">
        <Navbar />
      </div>
    </header>
  );
}
