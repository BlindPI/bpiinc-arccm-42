import { motion } from "framer-motion";
import React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  isTransitioning: boolean;
}

export function PageTransition({ children, isTransitioning }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isTransitioning ? 0 : 1, 
        y: isTransitioning ? 10 : 0 
      }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}