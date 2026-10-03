"use client";

import { useEffect } from "react";

// Общий слой «живых» эффектов сайта. Один компонент в layout, без библиотек:
// — заголовки секций плавно выезжают из-под линии и становятся чёткими при появлении на экране;
// — карточки с data-tilt наклоняются за курсором, по рамке бежит подсветка;
// — кнопки притягиваются к курсору («магнит»);
// — кольцо-курсор на десктопе и светящаяся полоса прогресса прокрутки;
// — блоки с data-clip раскрываются «шторкой».
// Лёгкий режим (меньше анимации в системе, экономия трафика, слабое устройство): остаётся только статика.
export default function Effects() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 2;
    const lite = reduce || !!nav.connection?.saveData || weak;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    root.classList.add("fx");
    if (lite) root.classList.add("fx-lite");
    if (lite) return () => root.classList.remove("fx", "fx-lite");

    const cleanups: (() => void)[] = [];

    // 1. Заголовки и «шторки»: включаются один раз, когда попадают в кадр.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add(e.target.hasAttribute("data-clip") ? "revealed" : "lit");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => {
      document.querySelectorAll<HTMLElement>("main h2:not(.neon), main [data-clip]:not([data-fx])").forEach((el) => {
        if (el.tagName === "H2") el.classList.add("neon");
        else el.setAttribute("data-fx", "");
        io.observe(el);
      });
    };
    scan();
    const main = document.querySelector("main");
    const mo = new MutationObserver(() => { scan(); setTimeout(() => { lastCheck = 0; lightVisible(); }, 50); });
    if (main) mo.observe(main, { childList: true, subtree: true });
    cleanups.push(() => { io.disconnect(); mo.disconnect(); });

    // 2. Полоса прогресса прокрутки
    const bar = document.createElement("div");
    bar.className = "fx-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let ticking = false;
    let lastCheck = 0;
    // Страховка к IntersectionObserver: если браузер задержал его сигнал, заголовок всё равно загорится,
    // как только окажется в кадре при прокрутке. Иначе он мог бы остаться тусклым.
    const lightVisible = () => {
      const now = performance.now();
      if (now - lastCheck < 120) return;
      lastCheck = now;
      document.querySelectorAll<HTMLElement>("main h2.neon:not(.lit), main [data-clip][data-fx]:not(.revealed)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.9 && r.bottom > 0) el.classList.add(el.hasAttribute("data-clip") ? "revealed" : "lit");
      });
    };
    const onScroll = () => {
      lightVisible();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cleanups.push(() => { removeEventListener("scroll", onScroll); bar.remove(); });

    if (!finePointer) return () => { cleanups.forEach((f) => f()); root.classList.remove("fx"); };

    // 3. Кольцо-курсор (плавно догоняет указатель, растёт над ссылками и кнопками)
    const ring = document.createElement("div");
    ring.className = "fx-cursor";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    let tx = -100, ty = -100, cx = -100, cy = -100, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };

    // 4. Наклон карточек и магнитные кнопки — одним делегированным обработчиком
    let tiltEl: HTMLElement | null = null;
    let magEl: HTMLElement | null = null;
    const resetTilt = () => { if (tiltEl) { tiltEl.style.removeProperty("--rx"); tiltEl.style.removeProperty("--ry"); tiltEl.classList.remove("tilting"); tiltEl = null; } };
    const resetMag = () => { if (magEl) { magEl.style.removeProperty("--mgx"); magEl.style.removeProperty("--mgy"); magEl = null; } };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      const target = e.target as Element | null;
      ring.classList.toggle("is-link", !!target?.closest("a, button, [role=button], input, textarea, select, label"));

      const card = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (card !== tiltEl) resetTilt();
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", `${(0.5 - py) * 6}deg`);
        card.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
        card.style.setProperty("--gx", `${px * 100}%`);
        card.style.setProperty("--gy", `${py * 100}%`);
        card.classList.add("tilting");
        tiltEl = card;
      }

      const btn = target?.closest<HTMLElement>(".btn-primary, .btn-ghost, [data-magnetic]") ?? null;
      if (btn !== magEl) resetMag();
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mgx", `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
        btn.style.setProperty("--mgy", `${(e.clientY - (r.top + r.height / 2)) * 0.3}px`);
        magEl = btn;
      }
    };
    const onLeave = () => { resetTilt(); resetMag(); ring.classList.add("is-hidden"); };
    const onEnter = () => ring.classList.remove("is-hidden");
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    root.classList.add("fx-cursor-on");
    cleanups.push(() => {
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      cancelAnimationFrame(raf);
      ring.remove();
      root.classList.remove("fx-cursor-on");
    });

    return () => { cleanups.forEach((f) => f()); root.classList.remove("fx"); };
  }, []);

  return null;
}
