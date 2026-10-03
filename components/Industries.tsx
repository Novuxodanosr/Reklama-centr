"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/lib/navigation";
import { industryIds, industryMeta, type IndustryId } from "@/lib/industries";
import { works } from "@/lib/works";
import Reveal, { ease } from "./motion/Reveal";
import { ArrowIcon } from "./icons";


// «Решения по отраслям»: клиент ищет «как у похожих на меня». Слева список отраслей,
// справа карточка: фото проекта, что делаем и какие направления подходят этой сфере.
// На главной идёт сразу после FAQ, поэтому верхнего отступа нет (его даёт FAQ).
export default function Industries() {
  const t = useTranslations();
  const [active, setActive] = useState<IndustryId>(industryIds[0]);
  const meta = industryMeta[active];
  const work = works.find((w) => w.id === meta.work);

  return (
    <section className="container-x pb-24 lg:pb-32">
      <Reveal>
        <p className="eyebrow">{t("industries.eyebrow")}</p>
        <h2 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("industries.title")}</h2>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t("industries.intro")}</p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.4fr] lg:gap-10">
        {/* Список отраслей: на десктопе вертикальный, на телефоне — лента */}
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0" role="tablist" aria-label={t("industries.eyebrow")}>
          {industryIds.map((id, i) => {
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(id)}
                className={`group relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors lg:flex lg:w-full lg:items-center lg:justify-between lg:gap-4 lg:whitespace-normal lg:rounded-none lg:border-x-0 lg:border-b lg:border-t-0 lg:px-0 lg:py-5 lg:text-left ${
                  on ? "border-accent bg-accent text-white lg:bg-transparent lg:text-paper" : "border-white/20 text-paper/70 hover:text-white lg:border-white/10"
                }`}
              >
                <span className="hidden lg:block lg:absolute lg:-left-0 lg:top-0 lg:h-full lg:w-[3px] lg:bg-accent lg:transition-transform lg:duration-500" style={{ transform: on ? "scaleY(1)" : "scaleY(0)" }} aria-hidden="true" />
                <span className="lg:pl-6 lg:font-display lg:text-2xl lg:font-bold lg:uppercase lg:leading-none">
                  <span className="mr-2 hidden font-display text-xs font-bold text-accent lg:inline">{String(i + 1).padStart(2, "0")}</span>
                  {t(`industries.items.${id}.title`)}
                </span>
                <ArrowIcon className={`hidden h-4 w-4 transition-all lg:block ${on ? "translate-x-0 text-accent opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"}`} />
              </button>
            );
          })}
        </div>

        {/* Карточка отрасли */}
        <div className="relative isolate min-h-[520px] overflow-hidden rounded-2xl bg-coal">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease }}
              aria-hidden="true"
            >
              {work && <Image src={work.image} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/20" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              className="relative flex h-full min-h-[520px] flex-col justify-end p-6 sm:p-10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
            >
              <h3 className="text-4xl font-extrabold leading-[0.9] sm:text-5xl">{t(`industries.items.${active}.title`)}</h3>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">{t(`industries.items.${active}.text`)}</p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {meta.services.map((s) => (
                  <li key={s}>
                    <Link href={`/services#${s}`} className="block rounded-full border border-white/25 bg-ink/40 px-3.5 py-1.5 text-sm text-paper backdrop-blur transition-colors hover:border-accent hover:bg-accent hover:text-white">
                      {t(`services.items.${s}.title`)}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex justify-end border-t border-white/15 pt-6">
                <Link href={`/works#industry-${active}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-accentHover">
                  {t("industries.all")} <ArrowIcon />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
