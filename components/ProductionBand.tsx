"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { serviceIds } from "@/lib/services";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Reveal, { RevealGroup, RevealItem } from "./motion/Reveal";
import { CheckBadgeIcon, GearIcon, InfinityIcon } from "./icons";

const highlightIcons = [InfinityIcon, GearIcon, CheckBadgeIcon];

// Блок производства: фоном — короткий немой ролик монтажа крышной установки (10 с, ~1,6 МБ),
// играет только пока блок на экране. Если пользователь просил меньше анимации — остаётся кадр-постер.
// catalog — показать полный перечень «Что производим» (только на странице «О компании»).
export default function ProductionBand({ catalog = false }: { catalog?: boolean }) {
  const t = useTranslations("production");
  const tAll = useTranslations();
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);
  const equipment = t.raw("equipment") as string[];
  const service = t.raw("service") as { title: string; items: string[] };
  // Полный перечень: 9 направлений (позиции — из services.items.<id>.products), технологии и сервис.
  const groups = [
    ...serviceIds.map((id) => ({ id, title: tAll(`services.items.${id}.title`), items: tAll.raw(`services.items.${id}.products`) as string[] })),
    { id: "tech", title: t("techTitle"), items: equipment },
    { id: "service", title: service.title, items: service.items },
  ];
  const highlights = t.raw("highlights") as { title: string; text: string }[];
  const facts = t.raw("facts") as { title: string; text: string }[];

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section ref={ref} className="grain relative isolate overflow-hidden bg-ink text-white">
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] -bottom-[12%]" aria-hidden="true">
        {/* Всегда один и тот же элемент на сервере и клиенте; при «меньше анимации» ролик просто не запускается — виден кадр-постер */}
        <video ref={videoRef} muted loop playsInline preload="metadata" poster="/works/rooftop-install.webp" className="h-full w-full object-cover opacity-30">
          <source src="/video/production.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" aria-hidden="true" />

      <div className="container-x relative grid gap-14 py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-32">
        <div className="flex flex-col justify-between gap-12">
          <Reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("title")}</h2>
            <p className="mt-6 max-w-xl text-lg text-white/70">{t("text")}</p>
          </Reveal>
          <Reveal>
            <ul className="grid gap-7 border-t border-white/15 pt-8 sm:grid-cols-3 sm:gap-6">
              {highlights.map((h, i) => {
                const Icon = highlightIcons[i] ?? CheckBadgeIcon;
                return (
                  <li key={h.title}>
                    <Icon className="h-10 w-10 text-accent" />
                    <p className="mt-4 font-display text-xl font-bold uppercase leading-tight">{h.title}</p>
                    <p className="mt-2 text-sm leading-snug text-white/65">{h.text}</p>
                  </li>
                );
              })}
            </ul>
            {!catalog && (
              <Link href="/about#catalog" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-accentHover">
                {t("more")} <span aria-hidden="true">→</span>
              </Link>
            )}
          </Reveal>
        </div>

        <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.1}>
          {facts.map((f, i) => (
            <RevealItem key={f.title} className="group rounded-xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm transition-colors duration-300 hover:border-accent/60 hover:bg-accent/10">
              <span className="font-display text-base font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-2xl font-bold leading-tight">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{f.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {catalog && (
      <div id="catalog" className="container-x relative scroll-mt-28 pb-24 lg:pb-32">
        <Reveal>
          <p className="eyebrow">{t("catalog")}</p>
        </Reveal>
        <RevealGroup className="mt-8 grid gap-x-10 gap-y-8 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
          {groups.map((g) => (
            <RevealItem key={g.id}>
              <h3 className="flex items-center gap-3 font-display text-xl font-bold uppercase leading-tight">
                <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" aria-hidden="true" />
                {g.id === "tech" || g.id === "service" ? g.title : <Link href={`/services#${g.id}`} className="transition-colors hover:text-accentHover">{g.title}</Link>}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{g.items.join(" · ")}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
      )}
    </section>
  );
}
