"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { serviceIds, type ServiceId } from "@/lib/services";
import { industryIds, type IndustryId } from "@/lib/industries";
import { works as manualWorks } from "@/lib/works";
import { useInstagramWorks } from "@/lib/instagram";
import WorkCard from "./WorkCard";
import Lightbox, { lightboxItems, lightboxStart } from "./Lightbox";
import { ease } from "./motion/Reveal";


// Страница «Работы»: фильтры по направлениям и отраслям, лайтбокс, ссылки вида /works#industry-<id>.
export default function WorksGrid() {
  const t = useTranslations();
  const [filter, setFilter] = useState<ServiceId | "all">("all");
  const [industry, setIndustry] = useState<IndustryId | "all">("all");
  const [index, setIndex] = useState<number | null>(null);
  // Свежие работы из Instagram — первыми, затем ручное портфолио.
  const works = [...useInstagramWorks(), ...manualWorks];
  // Направления и отрасли, у которых есть хотя бы одна работа.
  const withWorks = serviceIds.filter((id) => works.some((w) => w.service === id));
  const withIndustry = industryIds.filter((id) => works.some((w) => w.industries?.includes(id)));
  const visible = works.filter((w) => (filter === "all" || w.service === filter) && (industry === "all" || w.industries?.includes(industry)));

  // Ссылки вида /works#industry-retail (из блока «Решения по отраслям») сразу включают фильтр отрасли.
  useEffect(() => {
    const apply = () => {
      const m = window.location.hash.match(/^#industry-([a-z]+)$/);
      if (m && (industryIds as readonly string[]).includes(m[1])) setIndustry(m[1] as IndustryId);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const items = lightboxItems(visible, t);
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-accent bg-accent text-white" : "border-white/20 text-paper/80 hover:border-white hover:text-white"}`;

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label={t("works.eyebrow")}>
        <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={chip(filter === "all")}>
          {t("works.filterAll")} <span className="ml-1 text-white/50">{works.length}</span>
        </button>
        {withWorks.map((id) => (
          <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={chip(filter === id)}>
            {t(`services.items.${id}.title`)} <span className="ml-1 text-white/50">{works.filter((w) => w.service === id).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("works.filterIndustry")}>
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.2em] text-dim">{t("works.filterIndustry")}</span>
        <button type="button" onClick={() => setIndustry("all")} aria-pressed={industry === "all"} className={chip(industry === "all")}>
          {t("works.filterAll")}
        </button>
        {withIndustry.map((id) => (
          <button key={id} type="button" onClick={() => setIndustry(id)} aria-pressed={industry === id} className={chip(industry === id)}>
            {t(`industries.items.${id}.title`)}
          </button>
        ))}
      </div>

      <motion.div className="mt-8 grid auto-rows-[260px] gap-3 sm:grid-cols-2 sm:auto-rows-[300px] lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease }}
              className={`relative ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            >
              <WorkCard work={w} sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : undefined} onOpen={() => setIndex(lightboxStart(visible, i))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="mt-8 rounded-xl border border-white/10 p-10 text-center">
          <p className="text-mist">{t("works.empty")}</p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setIndustry("all");
            }}
            className="btn-ghost mt-5"
          >
            {t("works.reset")}
          </button>
        </div>
      )}

      <Lightbox
        items={items}
        index={index}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
        labels={{ close: t("works.lightbox.close"), prev: t("works.lightbox.prev"), next: t("works.lightbox.next") }}
      />
    </>
  );
}
