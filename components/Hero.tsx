"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Link } from "@/lib/navigation";
import { serviceImages, type ServiceId } from "@/lib/services";
import Counter from "./motion/Counter";
import { ease } from "./motion/Reveal";
import { ArrowIcon } from "./icons";
import LedField from "./fx/LedField";

const DURATION = 4500;

// Слайды первого экрана: направление ↔ реальный проект. Слово в заголовке, фото и подпись меняются вместе.
// Фото берётся из serviceImages (lib/services.ts) — одно место правды для «фото направления».
type Slide = { key: ServiceId | "general"; work?: string; image: string; href: string };
const heroOrder: ServiceId[] = ["outdoor", "interior", "exhibition", "promo", "print", "textile", "pos", "heraldry", "custom"];
// У направления может не быть привязанного проекта (фото иллюстративное) — тогда подпись только с названием направления.
const slideWork: Partial<Record<ServiceId, string>> = {
  outdoor: "octobank-pavilion",
  interior: "tmz-hall",
  exhibition: "octobank-expo",
  promo: "alfabank-set",
  print: "dilbar-tags",
  textile: "samsung-plaid",
  pos: "josera-display",
  heraldry: "heraldry-star",
  custom: "oz-makon-night",
};
const slides: Slide[] = [
  { key: "general", image: "/works/tmz-pylon.webp", href: "/services" },
  ...heroOrder.map((key) => ({ key, work: slideWork[key], image: serviceImages[key] ?? "/works/tmz-pylon.webp", href: `/services#${key}` })),
];

export default function Hero() {
  const t = useTranslations();
  const reduce = useReducedMotion();
  // Текущий и предыдущий слайд в одном состоянии: предыдущий остаётся под новым, пока тот проявляется.
  const [pos, setPos] = useState({ index: 0, prev: -1 });
  const { index, prev } = pos;
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [fine, setFine] = useState(false);
  const total = slides.length;
  const slide = slides[index];
  // В DOM держим только текущий, предыдущий и следующий (он подгружается заранее).
  const mounted = new Set([index, (index + 1) % total, prev].filter((i) => i >= 0));

  // Автосмена слайдов. Пауза при наведении на индикатор и когда вкладка скрыта.
  useEffect(() => {
    if (reduce || paused || hidden) return;
    const id = setTimeout(() => setPos((p) => ({ index: (p.index + 1) % total, prev: p.index })), DURATION);
    return () => clearTimeout(id);
  }, [index, paused, hidden, reduce, total, cycle]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    setFine(window.matchMedia("(pointer: fine)").matches);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Параллакс от курсора: фон уходит от мыши, текст — за ней. Плюс красная подсветка под курсором.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spotX = useMotionValue(70);
  const spotY = useMotionValue(40);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const bgX = useTransform(sx, (v) => v * -22);
  const bgY = useTransform(sy, (v) => v * -22);
  const fgX = useTransform(sx, (v) => v * 10);
  const fgY = useTransform(sy, (v) => v * 10);
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${spotX}% ${spotY}%, rgba(228,20,47,0.22), transparent 62%)`;
  const parallax = fine && !reduce;

  // Не чаще одного раза за кадр: иначе на каждое движение мыши читается геометрия и дёргается раскладка.
  const frame = useRef(0);
  function onMove(e: MouseEvent<HTMLElement>) {
    if (!parallax || frame.current) return;
    const { clientX, clientY, currentTarget } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const r = currentTarget.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      mx.set(px - 0.5);
      my.set(py - 0.5);
      spotX.set(px * 100);
      spotY.set(py * 100);
    });
  }

  function go(i: number) {
    setPos((p) => (p.index === i ? p : { index: i, prev: p.index }));
    setCycle((c) => c + 1);
  }

  const word = t(`hero.rotate.words.${slide.key}`);
  const before = t("hero.rotate.before");
  const after = t("hero.rotate.after");
  const tagline = slide.key === "general" ? t("hero.tagline") : t(`services.items.${slide.key}.tagline`);
  const subtitle = slide.key === "general" ? t("hero.subtitle") : t(`services.items.${slide.key}.short`);
  const caption =
    slide.key === "general"
      ? t("hero.rotate.generalCaption")
      : slide.work
        ? `${t(`services.items.${slide.key}.title`)} · ${t(`works.items.${slide.work}.title`)}`
        : t(`services.items.${slide.key}.title`);
  const stats = ["line", "warranty", "sample", "scale"] as const;
  const fade = useMemo(
    () => (delay: number) => ({
      initial: reduce ? false : { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.7, ease, delay },
    }),
    [reduce],
  );

  return (
    <section onMouseMove={onMove} className="grain relative isolate -mt-[76px] min-h-[100svh] overflow-hidden bg-ink text-paper">
      {/* Фото проектов: новый слайд проявляется поверх предыдущего, медленно наезжая */}
      <motion.div style={parallax ? { x: bgX, y: bgY } : undefined} className="absolute -inset-6" aria-hidden="true">
        {slides.map((s, i) => {
          if (!mounted.has(i)) return null;
          const active = i === index;
          // Предыдущий слайд остаётся как есть под новым, пока тот проявляется — иначе виден рывок.
          const shown = active || i === prev;
          return (
            <motion.div
              key={s.image}
              className="absolute inset-0"
              style={{ zIndex: active ? 2 : i === prev ? 1 : 0 }}
              initial={false}
              animate={{
                opacity: shown ? 1 : 0,
                scale: shown && !reduce ? 1.16 : 1.06,
                x: shown && !reduce ? (i % 2 ? "-1.5%" : "1.5%") : "0%",
              }}
              transition={{
                opacity: { duration: active ? 1.2 : 0, ease: "easeInOut" },
                scale: { duration: shown ? DURATION / 1000 + 1.6 : 0, ease: "linear" },
                x: { duration: shown ? DURATION / 1000 + 1.6 : 0, ease: "linear" },
              }}
            >
              <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className="object-cover object-center" />
            </motion.div>
          );
        })}
      </motion.div>
      <div className="absolute inset-0 z-[3] bg-ink/30" aria-hidden="true" />
      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-ink via-ink/55 to-ink/20" aria-hidden="true" />
      <div className="absolute inset-0 z-[3] bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" aria-hidden="true" />
      {parallax && <motion.div style={{ backgroundImage: spotlight }} className="absolute inset-0 z-[3]" aria-hidden="true" />}
      <LedField />

      {/* Крупный номер слайда */}
      <div className="absolute right-6 top-24 z-[4] hidden select-none font-display text-[13rem] font-extrabold leading-none text-white/[0.06] lg:block" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={index} className="block" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease }}>
            {String(index + 1).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div style={parallax ? { x: fgX, y: fgY } : undefined} className="container-x relative z-[4] flex min-h-[100svh] flex-col justify-end pb-10 pt-32 sm:pb-14">
        <motion.p className="eyebrow flex items-center gap-3 text-white/80" {...fade(0)}>
          <span className="h-2 w-2 rounded-full bg-accent animate-pulseDot" aria-hidden="true" />
          {t("hero.eyebrow")}
        </motion.p>

        <motion.h1 className="mt-6 max-w-6xl text-[clamp(2.6rem,10.5vw,9.5rem)] font-extrabold leading-[0.88]" aria-label={t("hero.title")} {...fade(0.15)}>
          {before && <span className="block">{before}</span>}
          <span className="relative block h-[1em] overflow-hidden leading-none text-accent">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={slide.key}
                className="block whitespace-nowrap"
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                exit={{ y: "-105%" }}
                transition={{ duration: 0.7, ease }}
              >
                {word}
              </motion.span>
            </AnimatePresence>
          </span>
          {after && <span className="block">{after}</span>}
        </motion.h1>

        {/* Подзаголовок и описание меняются вместе со словом в заголовке */}
        <motion.div className="mt-5 min-h-[1.2em] font-display text-2xl font-bold uppercase leading-tight text-paper/90 sm:text-4xl" {...fade(0.4)}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={slide.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease }}>
              {tagline}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div className="mt-6 min-h-[4.5rem] max-w-2xl text-base text-white/75 sm:min-h-[5.25rem] sm:text-lg" {...fade(0.6)}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={slide.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease, delay: 0.08 }}>
              {subtitle}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div className="mt-9 flex flex-wrap gap-3" {...fade(0.75)}>
          <Link href="/contacts#form" className="btn-primary">
            {t("hero.primary")} <ArrowIcon />
          </Link>
          <Link href="/works" className="btn-ghost">{t("hero.secondary")}</Link>
        </motion.div>

        {/* Индикатор слайдов: полоски-прогресс и подпись проекта */}
        <motion.div
          className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            setPaused(false);
            setCycle((c) => c + 1);
          }}
          {...fade(0.9)}
        >
          <div className="flex flex-1 gap-1.5 sm:max-w-md" role="tablist" aria-label={t("hero.rotate.slidesLabel")}>
            {slides.map((s, i) => {
              const name = s.key === "general" ? t("hero.rotate.generalCaption") : t(`services.items.${s.key}.title`);
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={t("hero.rotate.slide", { n: i + 1, name })}
                  onClick={() => go(i)}
                  className="group relative h-6 flex-1"
                >
                  <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/20 transition-colors group-hover:bg-white/40">
                    <span
                      key={`${i}-${cycle}`}
                      className={`block h-full bg-accent ${i < index ? "w-full" : i === index ? (reduce ? "w-full" : "animate-progress") : "w-0"}`}
                      style={{ animationDuration: `${DURATION}ms`, animationPlayState: paused ? "paused" : "running" }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 items-center gap-4 text-sm">
            <span className="shrink-0 font-display text-xl font-bold tabular-nums text-accent">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={index} className="block truncate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease }}>
                  <Link href={slide.href} className="link-underline text-white/85 hover:text-white">
                    {caption} →
                  </Link>
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
        </motion.div>

        <motion.dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-8 md:grid-cols-4" {...fade(1.05)}>
          {stats.map((k) => (
            <div key={k} className="group">
              <dt className="stat-neon font-display text-5xl font-extrabold tabular-nums sm:text-6xl">
                <Counter value={t(`stats.${k}.value`)} />
              </dt>
              <dd className="mt-2 max-w-[22ch] text-sm leading-snug text-white/65">{t(`stats.${k}.label`)}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <div className="absolute bottom-10 right-8 z-[4] hidden flex-col items-center gap-3 lg:flex" aria-hidden="true">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 [writing-mode:vertical-rl]">{t("hero.scroll")}</span>
        <span className="relative h-16 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-0 animate-scrollHint bg-accent" />
        </span>
      </div>
    </section>
  );
}
