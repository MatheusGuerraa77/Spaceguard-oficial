import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="nasa-panel border-b sticky top-0 z-40 backdrop-blur-sm bg-card/95"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="/Logo-DualTech-_1_.ico"
              alt="SpaceGuard"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold tracking-tight">SpaceGuard</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link to="/scenario" className="text-sm font-medium transition-colors hover:text-primary focus-visible-ring">
              Cenário
            </Link>
            <Link to="/mitigation" className="text-sm font-medium transition-colors hover:text-primary focus-visible-ring">
              Mitigação
            </Link>
            <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary focus-visible-ring">
              Sobre
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-48 bg-input border-border text-sm focus-visible-ring"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
