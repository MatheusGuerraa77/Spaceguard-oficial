import { motion } from 'framer-motion';

export function TopBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="nasa-topbar py-2 px-4 text-center text-sm font-medium"
    >
      🚀 SpaceGuard: Visualize asteroid impact scenarios using NASA/USGS data
    </motion.div>
  );
}
