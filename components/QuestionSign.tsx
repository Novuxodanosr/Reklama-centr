"use client";

import { useEffect, useRef, useState } from "react";

// Знак «?» в блоке «Частые вопросы»: контур прорисовывается штрихом, вспыхивает красным неоном
// и дальше чуть парит; точка снизу пульсирует. Запускается, когда блок попадает в экран.
// Стили — .qsign* в app/globals.css; при prefers-reduced-motion анимации отключены.
export default function QuestionSign() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`qsign ${on ? "is-on" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 200 320" className="h-full w-full overflow-visible">
        <defs>
          <filter id="qsign-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b1" />
            <feGaussianBlur stdDeviation="16" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Разметка-линейка: фирменный мотив, тонкие риски по левому краю. */}
        <g className="qsign-ruler" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
          {Array.from({ length: 13 }, (_, i) => (
            <line key={i} style={{ ["--i" as string]: i }} x1="0" y1={20 + i * 22} x2={i % 4 === 0 ? 18 : 9} y2={20 + i * 22} />
          ))}
        </g>
        {/* Контур знака: крюк и точка. */}
        <g className="qsign-glyph" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" filter="url(#qsign-glow)">
          <path className="qsign-hook" pathLength="1" d="M46 92 C46 38 92 18 122 26 C162 36 176 72 160 108 C148 134 118 142 110 166 L108 206" />
          <circle className="qsign-dot" cx="108" cy="266" r="12" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  );
}
