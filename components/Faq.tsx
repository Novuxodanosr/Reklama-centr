"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { safeJsonLd } from "@/lib/site";
import Reveal, { ease } from "./motion/Reveal";
import { ArrowIcon } from "./icons";


// Частые вопросы: аккордеон + разметка FAQPage для поисковиков.
export default function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };

  return (
    <section className="container-x py-24 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("title")}</h2>
          <p className="mt-6 max-w-md text-mist">{t("intro")}</p>
          <a href="#form" className="btn-ghost mt-8 !py-2.5">
            {t("ask")} <ArrowIcon />
          </a>
        </Reveal>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-accentHover"
                >
                  <span className="font-display text-xl font-bold uppercase leading-tight sm:text-2xl">{it.q}</span>
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xl leading-none transition-all duration-300 ${
                      isOpen ? "rotate-45 border-accent bg-accent text-white" : "border-white/20 text-paper"
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-[15px] leading-relaxed text-mist">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </section>
  );
}
