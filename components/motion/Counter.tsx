"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// Анимированная цифра: «10+» → считает от 0 до 10, «до 5 лет» → до 5. Текст вокруг числа сохраняется.
// На сервере и при первом рендере на клиенте всегда 0 (одинаково — без ошибок гидрации). Дальше: если
// пользователь просил меньше анимации — сразу итог; иначе счёт от 0, когда блок появился на экране,
// с подстраховкой через 1,2 с, чтобы число никогда не осталось «0».
export default function Counter({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();
  const m = value.match(/(\d+)/);
  const target = m ? Number(m[1]) : null;
  const [shown, setShown] = useState(0);
  const done = useRef(false);
  const controls = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => controls.current?.stop(), []);

  useEffect(() => {
    if (target === null || done.current) return;
    if (reduce) {
      done.current = true;
      setShown(target);
      return;
    }
    const run = () => {
      if (done.current) return;
      done.current = true;
      controls.current = animate(0, target, {
        duration: Math.min(1.6, 0.6 + target / 25),
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setShown(Math.round(v)),
      });
    };
    if (inView) {
      run();
      return;
    }
    const fallback = setTimeout(run, 1200);
    return () => clearTimeout(fallback);
  }, [inView, target, reduce]);

  if (target === null || !m) return <span className={className}>{value}</span>;
  const before = value.slice(0, m.index);
  const after = value.slice((m.index ?? 0) + m[1].length);

  return (
    <span ref={ref} className={className}>
      {before}
      {shown}
      {after}
    </span>
  );
}
