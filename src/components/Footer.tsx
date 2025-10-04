import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="border-t border-border nasa-panel mt-auto">
      <div className="container px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>SpaceGuard © 2025 - NASA Impactor-2025 Challenge</p>
            <p className="text-xs mt-1">Dados simulados para fins educacionais</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link to="/about#calculations" className="text-link transition-colors focus-visible-ring">
              Como calculamos?
            </Link>
            <Link to="/about#sources" className="text-link transition-colors focus-visible-ring">
              Fontes
            </Link>
            <Link to="/about#limitations" className="text-link transition-colors focus-visible-ring">
              Limitações
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
