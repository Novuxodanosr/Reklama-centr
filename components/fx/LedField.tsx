"use client";

import { useEffect, useRef } from "react";

// LED-матрица первого экрана: сетка «диодов», которые загораются вокруг курсора, как под прожектором.
// На сенсорных экранах по полю сама идёт мягкая волна света. Статичная сетка точек — чистый CSS (класс led-grid),
// canvas рисует только светящиеся точки: обычно это сотня-другая квадратиков за кадр.
// Не работает в лёгком режиме (класс fx-lite на <html>), вне экрана и в фоновой вкладке.
const STEP = 18; // шаг сетки, px (совпадает с led-grid в CSS)
const RADIUS = 190; // радиус «прожектора», px

export default function LedField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || root.classList.contains("fx-lite")) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const touch = !matchMedia("(hover: hover) and (pointer: fine)").matches;
    const section = canvas.parentElement as HTMLElement;
    let w = 0, h = 0, dpr = 1, visible = true, raf = 0, last = 0;
    let px = -9999, py = -9999, active = 0; // позиция прожектора и его яркость (плавно гаснет)

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = section.clientWidth; h = section.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (t - last < 1000 / 45) { raf = requestAnimationFrame(draw); return; } // ~45 кадров/с хватает
      last = t;
      ctx.clearRect(0, 0, w, h);
      let cx = px, cy = py, amp = active;
      if (touch) {
        // Волна: прожектор сам медленно гуляет по экрану по фигуре Лиссажу
        const s = t / 1000;
        cx = w * (0.5 + 0.38 * Math.sin(s * 0.35));
        cy = h * (0.45 + 0.3 * Math.sin(s * 0.53 + 1.2));
        amp = 0.8;
      } else {
        active = Math.max(0, active - 0.02);
      }
      if (amp > 0.01) {
        const x0 = Math.max(0, Math.floor((cx - RADIUS) / STEP)), x1 = Math.min(Math.ceil(w / STEP), Math.ceil((cx + RADIUS) / STEP));
        const y0 = Math.max(0, Math.floor((cy - RADIUS) / STEP)), y1 = Math.min(Math.ceil(h / STEP), Math.ceil((cy + RADIUS) / STEP));
        for (let gx = x0; gx <= x1; gx++) {
          for (let gy = y0; gy <= y1; gy++) {
            const x = gx * STEP + STEP / 2, y = gy * STEP + STEP / 2;
            const d = Math.hypot(x - cx, y - cy) / RADIUS;
            if (d >= 1) continue;
            const k = (1 - d) * (1 - d) * amp;
            // Лёгкое «мерцание» диодов, чтобы поле было живым
            const flick = 0.75 + 0.25 * Math.sin(t / 160 + gx * 1.7 + gy * 2.3);
            const a = Math.min(1, k * flick);
            // Центр — белый, край — фирменный красный
            ctx.fillStyle = d < 0.35 ? `rgba(255,236,238,${a})` : `rgba(228,20,47,${a})`;
            const s = 2 + k * 2.5;
            ctx.fillRect(x - s / 2, y - s / 2, s, s);
          }
        }
      }
      if (touch || active > 0) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top; active = 1;
      kick();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    const onVis = () => { if (!document.hidden) kick(); };

    resize();
    io.observe(section);
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    if (!touch) section.addEventListener("pointermove", onMove, { passive: true });
    kick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <div className="led-grid pointer-events-none absolute inset-0 z-[3]" aria-hidden="true" />
      <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[3] mix-blend-screen" aria-hidden="true" />
    </>
  );
}
