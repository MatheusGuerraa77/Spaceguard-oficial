// src/components/Navbar.tsx
import { Link, NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const routes = [
  { to: "/scenario", label: "Cenário" },
  { to: "/mitigation", label: "Mitigação" },
  { to: "/about", label: "Sobre" },
];

export default function Navbar() {
  const location = useLocation();
  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0b1321]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="/Logo-DualTech-_1_.ico"
              alt="SpaceGuard"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold tracking-tight">SpaceGuard</span>
          </Link>

        {/* Nav (desktop) */}
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {routes.map((r) => {
            const isActive = activePath.startsWith(r.to);
            return (
              <NavLink
                key={r.to}
                to={r.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {r.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search (placeholder) */}
        <div className="relative hidden md:block">
          <input
            type="search"
            placeholder="Search..."
            className="w-56 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/20"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
            /
          </kbd>
        </div>
      </div>
    </header>
  );
}
