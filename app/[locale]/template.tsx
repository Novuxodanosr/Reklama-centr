"use client";

import { motion, useReducedMotion } from "framer-motion";

// Плавное появление каждой страницы при переходе. Только opacity: transform/filter здесь нельзя —
// они сломали бы position: fixed у всплывающих окон (просмотр фото) внутри страниц.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
