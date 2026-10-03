"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { works } from "@/lib/works";
import WorkCard from "./WorkCard";
import Lightbox, { lightboxItems, lightboxStart } from "./Lightbox";

// На главной — только первые работы (самые сильные стоят в начале lib/works.ts), остальное — на странице «Работы».
const featured = works.slice(0, 16);
import { ArrowIcon } from "./icons";

// Лента работ на главной: листается пальцем/колесом, стрелками, карточки открываются на весь экран.
export default function WorksStrip() {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const items = lightboxItems(featured, t);
  // Листаем ровно на видимую ширину ленты (1 или 2 карточки) — следующая пара встаёт точно на место.
  const step = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth + 16), behavior: "smooth" });
  const btn = "grid h-12 w-12 place-items-center rounded-full border border-white/20 text-paper transition hover:border-accent hover:bg-accent hover:text-white";

  return (
    <>
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {featured.map((w, i) => (
          <div key={w.id} className="relative h-[380px] w-full shrink-0 snap-start sm:h-[440px] md:w-[calc((100%-1rem)/2)] lg:h-[540px]">
            <WorkCard work={w} sizes="(min-width: 768px) 50vw, 100vw" onOpen={() => setIndex(lightboxStart(featured, i))} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          <button type="button" onClick={() => step(-1)} aria-label={t("works.lightbox.prev")} className={btn}>
            <ArrowIcon className="h-4 w-4 rotate-180" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t("works.lightbox.next")} className={btn}>
            <ArrowIcon className="h-4 w-4" />
          </button>
        </div>
        <Link href="/works" className="btn-ghost">{t("works.all")}</Link>
      </div>
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
