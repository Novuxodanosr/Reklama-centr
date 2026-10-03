"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Reveal from "./motion/Reveal";
import { works } from "@/lib/works";
import Lightbox, { lightboxItems } from "./Lightbox";
import { ArrowIcon, ColumnsIcon } from "./icons";

const project = works.filter((w) => w.id === "infinity-letters");

// Флагманский проект: ролик «подготовка → монтаж → результат», факты и короткая история.
// Видео не грузится, пока блок не появился на экране; при «уменьшенном движении» остаётся постер.
export default function FeaturedCase() {
  const t = useTranslations("case");
  const tAll = useTranslations();
  const [index, setIndex] = useState<number | null>(null);
  const facts = t.raw("facts") as [string, string][];
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (play) el.play().catch(() => {});
    else el.pause();
  }, [play]);

  return (
    <section className="relative overflow-hidden border-y border-line bg-coal">
      <div className="absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[150px]" aria-hidden="true" />
      <div className="container-x relative grid gap-10 py-24 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:py-32">
        <Reveal>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-ink" data-tilt data-clip>
            <video ref={ref} src="/video/infinity-story.mp4" poster="/works/infinity-result.webp" muted loop playsInline preload="none" className="h-full w-full object-cover" aria-label={t("title")} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden="true" />
            <p className="absolute bottom-4 left-5 font-display text-lg font-bold uppercase tracking-wide text-white/90">INFI∞ITY · Golden House</p>
          </div>
        </Reveal>
        <Reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-6xl">{t("title")}</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-mist">{t("text")}</p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8">
            {facts.map(([n, label]) => (
              <div key={label}>
                <dt className="font-display text-5xl font-extrabold leading-none text-accent">{n || <ColumnsIcon className="h-12 w-12" />}</dt>
                <dd className="mt-2 text-sm text-mist">{label}{!n && <span className="mt-0.5 block text-xs text-dim">{t("factSub")}</span>}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={() => setIndex(1)} className="btn-primary mt-9">{t("cta")} <ArrowIcon /></button>
        </Reveal>
      </div>
      <Lightbox
        items={lightboxItems(project, tAll)}
        index={index}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
        labels={{ close: tAll("works.lightbox.close"), prev: tAll("works.lightbox.prev"), next: tAll("works.lightbox.next") }}
      />
    </section>
  );
}
