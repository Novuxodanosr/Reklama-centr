"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ServiceId } from "@/lib/services";
import { works } from "@/lib/works";
import WorkCard from "./WorkCard";
import Lightbox, { lightboxItems, lightboxStart } from "./Lightbox";

// Работы одного направления на его отдельной странице (/services/<id>): сетка + просмотр на весь экран.
export default function ServiceWorks({ id }: { id: ServiceId }) {
  const t = useTranslations();
  const [index, setIndex] = useState<number | null>(null);
  const list = works.filter((w) => w.service === id);
  const items = lightboxItems(list, t);

  return (
    <>
      <div className="grid auto-rows-[260px] gap-3 sm:grid-cols-2 sm:auto-rows-[300px] lg:grid-cols-3">
        {list.map((w, i) => (
          <div key={w.id} className="relative">
            <WorkCard work={w} onOpen={() => setIndex(lightboxStart(list, i))} />
          </div>
        ))}
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
