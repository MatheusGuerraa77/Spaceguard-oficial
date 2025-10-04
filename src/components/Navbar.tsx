// src/components/Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { pathname } = useLocation();

  const linkBase =
    "text-sm font-medium transition-colors hover:text-primary focus-visible-ring";
  const active = "text-primary";

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="nasa-panel border-b sticky top-0 z-40 backdrop-blur-sm bg-card/95"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center gap-8">
          {/* Logo (esquerda) */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">SpaceGuard</span>
          </Link>

          {/* Navegação (direita) */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <Link
              to="/scenario"
              className={`${linkBase} ${pathname === "/scenario" ? active : ""}`}
            >
              Cenário
            </Link>
            <Link
              to="/mitigation"
              className={`${linkBase} ${pathname === "/mitigation" ? active : ""}`}
            >
              Mitigação
            </Link>
            {/* Novo: Asteroides */}
            <Link
              to="/asteroids"
              className={`${linkBase} ${pathname === "/asteroids" ? active : ""}`}
            >
              Asteroides
            </Link>
            <Link
              to="/about"
              className={`${linkBase} ${pathname === "/about" ? active : ""}`}
            >
              Sobre
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
