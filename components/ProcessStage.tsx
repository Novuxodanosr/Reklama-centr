"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Reveal from "./motion/Reveal";

// «Заказ в 7 шагов!» — вместе с шагами «рождается» световая буква R:
// 01 пунктирный контур → 02 контур прорисовывается → 03 размерные линии → 04 штамп «согласовано» →
// 05 буква становится объёмной → 06 слои собираются, загораются диоды → 07 буква горит.
// Анимация идёт сама (без прокрутки): пока блок на экране, шаги проигрываются по кругу; шаг можно выбрать нажатием.
// Вне экрана и в фоновой вкладке — пауза; при «меньше анимации» — сразу собранная горящая буква.
const STEP_MS = 2600;
const LAST_PAUSE_MS = 2200;
const CH = "R";

export default function ProcessStage() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as { title: string; text: string }[];
  const [step, setStep] = useState(0);
  const [assembled, setAssembled] = useState(true);
  const [ledsOn, setLedsOn] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const obj = useRef<HTMLDivElement>(null);
  const ledLayer = useRef<HTMLSpanElement>(null);
  const outline = useRef<SVGTextElement>(null);
  const [leds, setLeds] = useState<{ x: number; y: number; s: number }[]>([]);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [fontPx, setFontPx] = useState(0);

  useEffect(() => { setReduce(matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);

  // Видимость блока
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Автопроигрывание шагов
  useEffect(() => {
    if (reduce || !visible) return;
    const ms = step === steps.length - 1 ? STEP_MS + LAST_PAUSE_MS : STEP_MS;
    const id = window.setTimeout(() => { if (!document.hidden) setStep((s) => (s + 1) % steps.length); }, ms);
    return () => window.clearTimeout(id);
  }, [step, visible, reduce, steps.length]);

  // Шаг «Производство»: слои разлетаются, собираются, диоды загораются волной
  useEffect(() => {
    if (reduce) { setAssembled(true); setLedsOn(leds.length); return; }
    if (step < 5) { setAssembled(true); setLedsOn(0); return; }
    if (step === 6) { setAssembled(true); setLedsOn(leds.length); return; }
    setAssembled(false); setLedsOn(0);
    const t1 = window.setTimeout(() => setAssembled(true), 900);
    let n = 0;
    const iv = window.setInterval(() => { n += Math.max(1, Math.ceil(leds.length / 14)); setLedsOn(n); if (n >= leds.length) window.clearInterval(iv); }, 70);
    return () => { window.clearTimeout(t1); window.clearInterval(iv); };
  }, [step, leds.length, reduce]);

  // Размер буквы от сцены + ровная сетка светодиодов строго внутри формы буквы
  const layout = useCallback(() => {
    const st = stage.current, o = obj.current;
    if (!st || !o) return;
    const px = Math.round(st.clientHeight * 0.78);
    setFontPx(px);
    // Небольшая задержка вместо кадра отрисовки: так расчёт срабатывает и в фоновой вкладке.
    window.setTimeout(() => {
      const W = o.clientWidth, H = o.clientHeight;
      if (!W || !H) return;
      const cs = getComputedStyle(o);
      const c = document.createElement("canvas");
      c.width = Math.ceil(W); c.height = Math.ceil(H);
      const g = c.getContext("2d");
      if (!g) return;
      g.font = `${cs.fontWeight} ${px}px ${cs.fontFamily}`;
      g.textBaseline = "alphabetic";
      const m = g.measureText(CH);
      const asc = m.fontBoundingBoxAscent || px * 0.8, desc = m.fontBoundingBoxDescent || px * 0.2;
      g.fillText(CH, 0, (H - (asc + desc)) / 2 + asc);
      const data = g.getImageData(0, 0, c.width, c.height).data;
      const inside = (x: number, y: number) => {
        const xi = Math.round(x), yi = Math.round(y);
        return xi >= 0 && yi >= 0 && xi < c.width && yi < c.height && data[(yi * c.width + xi) * 4 + 3] > 140;
      };
      const step = px * 0.052, mg = step * 0.42, pts: { x: number; y: number; s: number }[] = [];
      const s = Math.max(4, px * 0.017);
      for (let y = step * 0.5; y < H; y += step)
        for (let x = step * 0.5; x < W; x += step) {
          let ok = inside(x, y);
          for (let a = 0; ok && a < 12; a++) ok = inside(x + Math.cos((a * Math.PI) / 6) * mg, y + Math.sin((a * Math.PI) / 6) * mg);
          if (ok) pts.push({ x: x - s / 2, y: y - s / 2, s });
        }
      setLeds(pts);
      // Точные границы самой буквы в координатах SVG (шрифт 176, центр x=100, базовая линия y=168) — для размерных линий
      const g2 = document.createElement("canvas").getContext("2d");
      if (g2) {
        g2.font = `${cs.fontWeight} 176px ${cs.fontFamily}`;
        g2.textAlign = "center";
        const mm = g2.measureText(CH);
        const l = 100 - mm.actualBoundingBoxLeft, r = 100 + mm.actualBoundingBoxRight;
        const tp = 168 - mm.actualBoundingBoxAscent, bt = 168 + mm.actualBoundingBoxDescent;
        setBox({ x: l, y: tp, w: r - l, h: bt - tp });
      }
    }, 60);
  }, []);

  useEffect(() => {
    let alive = true;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (alive) layout(); });
    let tm = 0;
    const onR = () => { window.clearTimeout(tm); tm = window.setTimeout(layout, 200); };
    addEventListener("resize", onR);
    return () => { alive = false; removeEventListener("resize", onR); window.clearTimeout(tm); };
  }, [layout]);

  const shown = reduce ? steps.length - 1 : step;
  const gap = fontPx * 0.12;
  const z = (i: number) => (assembled ? i * 4 : i * gap);

  return (
    <section ref={root} className="container-x py-24 lg:py-32">
      <Reveal>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("title")}</h2>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Сцена */}
        {/* translate="no": иначе переводчик браузера превращает латинскую R в русскую «Р» и ломает сцену */}
        <div ref={stage} className={`pstage notranslate s-${shown}`} translate="no" aria-hidden="true">
          <div className="pstage-grid" />
          {/* 2D: контур, размеры, штамп (шаги 01–04) */}
          <svg className="pstage-2d" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <text ref={outline} x="100" y="168" textAnchor="middle" className="pstage-outline font-display" fontSize="176" fontWeight="800">{CH}</text>
            {box && (
              <g className="pstage-dims">
                <line x1={box.x} y1={box.y + box.h + 12} x2={box.x + box.w} y2={box.y + box.h + 12} />
                <line x1={box.x} y1={box.y + box.h + 7} x2={box.x} y2={box.y + box.h + 17} />
                <line x1={box.x + box.w} y1={box.y + box.h + 7} x2={box.x + box.w} y2={box.y + box.h + 17} />
                <text x={box.x + box.w / 2} y={box.y + box.h + 24} textAnchor="middle">1 200</text>
                <line x1={box.x + box.w + 12} y1={box.y} x2={box.x + box.w + 12} y2={box.y + box.h} />
                <line x1={box.x + box.w + 7} y1={box.y} x2={box.x + box.w + 17} y2={box.y} />
                <line x1={box.x + box.w + 7} y1={box.y + box.h} x2={box.x + box.w + 17} y2={box.y + box.h} />
                <text x={box.x + box.w + 20} y={box.y + box.h / 2} textAnchor="start" dominantBaseline="middle">1 800</text>
              </g>
            )}
          </svg>
          <div className="pstage-stamp font-display">{t("approved")}</div>

          {/* 3D: слои буквы (шаги 05–07) */}
          <div className="pstage-3d">
            <div ref={obj} className="pstage-obj font-display" style={{ fontSize: fontPx || undefined }}>
              <span className="gh">{CH}</span>
              <span className="ly back" style={{ transform: `translateZ(${z(0)}px)` }}>{CH}</span>
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k} className="ly side" style={{ transform: `translateZ(${z(1) - k * (fontPx * 0.006)}px)` }}>{CH}</span>
              ))}
              <span ref={ledLayer} className="ly leds" style={{ transform: `translateZ(${z(2)}px)` }}>
                {leds.map((d, i) => (
                  <i key={i} className={i < ledsOn ? "on" : ""} style={{ left: d.x, top: d.y, width: d.s, height: d.s }} />
                ))}
              </span>
              <span className="ly face" style={{ transform: `translateZ(${z(3)}px)` }}>{CH}</span>
            </div>
          </div>

          <div className="pstage-count font-display">
            {String(shown + 1).padStart(2, "0")} <span>/ {String(steps.length).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Список шагов */}
        <ol className="flex flex-col justify-center">
          {steps.map((s, i) => {
            const on = i === shown;
            return (
              <li key={s.title} className="border-t border-white/10 last:border-b">
                <button type="button" onClick={() => setStep(i)} aria-current={on ? "step" : undefined} className="group w-full py-4 text-left">
                  <span className="flex items-baseline gap-4">
                    <span className={`font-display text-lg font-bold transition-colors ${on ? "text-accent" : "text-dim"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`font-display text-2xl font-bold uppercase leading-none transition-colors sm:text-3xl ${on ? "text-paper" : "text-paper/35 group-hover:text-paper/70"}`}>{s.title}</span>
                  </span>
                  <span className={`grid transition-[grid-template-rows] duration-500 ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <span className="overflow-hidden">
                      <span className="block pl-9 pt-2 text-sm leading-relaxed text-mist sm:pl-10">{s.text}</span>
                    </span>
                  </span>
                  {on && !reduce && (
                    <span className="mt-3 block h-[2px] w-full overflow-hidden rounded bg-white/10 pl-0">
                      <span key={`${i}-${visible}`} className="block h-full bg-accent" style={{ animation: visible ? `pstage-bar ${i === steps.length - 1 ? STEP_MS + LAST_PAUSE_MS : STEP_MS}ms linear forwards` : "none", width: visible ? undefined : 0 }} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
