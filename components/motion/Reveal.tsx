"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Единая кривая анимации сайта — импортировать отсюда, не копировать.
export const ease = [0.22, 1, 0.36, 1] as const;

// Плавное появление блока при прокрутке. Один раз, без повторов.
export default function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "figure" | "p" | "span";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease, delay } },
  };

  return (
    <Tag className={className} variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12% 0px" }}>
      {children}
    </Tag>
  );
}

// Контейнер, который показывает детей по очереди (stagger).
export function RevealGroup({ children, className = "", stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = "", y = 24, as = "div" }: { children: ReactNode; className?: string; y?: number; as?: "div" | "li" | "article" | "figure" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag className={className} variants={{ hidden: { opacity: 0, y: reduce ? 0 : y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
      {children}
    </Tag>
  );
}
