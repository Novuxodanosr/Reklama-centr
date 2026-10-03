"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Work } from "@/lib/works";
import { ArrowUpRightIcon } from "./icons";

// Карточка работы: фото, направление, название, клиент. С onOpen превращается в кнопку лайтбокса.
export default function WorkCard({
  work,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  onOpen,
}: {
  work: Work;
  className?: string;
  sizes?: string;
  onOpen?: () => void;
}) {
  const t = useTranslations();
  const title = work.title ?? t(`works.items.${work.id}.title`);

  const inner = (
    <>
      <Image src={work.image} alt={title} fill sizes={sizes} className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white sm:p-6">
        <p className="eyebrow">{t(`services.items.${work.service}.title`)}</p>
        <p className="mt-1.5 font-display text-2xl font-bold uppercase leading-none sm:text-3xl">{title}</p>
        <p className="mt-1.5 text-sm text-white/60">{work.client ?? t(`works.items.${work.id}.client`)}</p>
      </div>
      {(work.video || work.gallery?.length) && (
        <span className="absolute left-4 top-4 flex gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
          {work.video && <span className="rounded-full bg-accent px-2.5 py-1">▶ {t("works.video")}</span>}
          {!!work.gallery?.length && <span className="rounded-full border border-white/25 bg-ink/60 px-2.5 py-1 backdrop-blur">+{work.gallery.length} {t("works.photos")}</span>}
        </span>
      )}
      {onOpen && (
        <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-ink/40 text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100" aria-hidden="true">
          <ArrowUpRightIcon />
        </span>
      )}
    </>
  );

  const cls = `group relative isolate block h-full w-full overflow-hidden rounded-xl bg-coal outline-none ring-accent focus-visible:ring-2 ${className}`;

  return onOpen ? (
    <button type="button" onClick={onOpen} className={cls} aria-label={`${t("works.open")}: ${title}`} data-tilt data-clip>
      {inner}
    </button>
  ) : (
    <figure className={cls} data-tilt data-clip>{inner}</figure>
  );
}
