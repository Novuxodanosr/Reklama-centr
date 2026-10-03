"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { serviceIds, serviceImages, type ServiceId } from "@/lib/services";
import { ArrowIcon } from "./icons";

// Девять направлений. На больших экранах — «гармошка»: наведение раскрывает панель с фото
// и описанием. На планшетах и телефонах — обычные карточки.
export default function Directions() {
  const t = useTranslations("services");
  const [active, setActive] = useState<ServiceId>(serviceIds[0]);

  return (
    <>
      <div className="hidden h-[580px] gap-2 lg:flex" role="list">
        {serviceIds.map((id, i) => {
          const open = id === active;
          const image = serviceImages[id];
          const title = t(`items.${id}.title`);
          return (
            <Link
              key={id}
              href={`/services#${id}`}
              role="listitem"
              onMouseEnter={() => setActive(id)}
              onFocus={() => setActive(id)}
              aria-label={title}
              className={`group relative isolate overflow-hidden rounded-xl bg-coal outline-none ring-accent transition-[flex] duration-700 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:ring-2 ${
                open ? "flex-[4.4]" : "flex-1"
              }`}
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className={`object-cover transition-all duration-700 ${open ? "scale-100 opacity-100" : "scale-110 opacity-35 grayscale"}`}
                />
              ) : (
                <div className={`tile-grid absolute inset-0 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-50"}`} aria-hidden="true">
                  <span className="absolute -right-6 -top-10 select-none font-display text-[14rem] font-extrabold leading-none text-white/[0.05]">{title.slice(0, 1)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/35 to-transparent" aria-hidden="true" />

              <span className="absolute left-5 top-5 font-display text-base font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>

              <span
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap font-display text-2xl font-bold uppercase [writing-mode:vertical-rl] transition-opacity duration-300 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
                aria-hidden="true"
              >
                {title}
              </span>

              <div className={`absolute inset-x-0 bottom-0 p-8 transition-all duration-500 ${open ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0"}`}>
                <p className="eyebrow">{t(`items.${id}.tagline`)}</p>
                <h3 className="mt-2 text-5xl font-extrabold leading-[0.9]">{title}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">{t(`items.${id}.short`)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {t("more")} <ArrowIcon />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {serviceIds.map((id, i) => {
          const image = serviceImages[id];
          const title = t(`items.${id}.title`);
          return (
            <Link key={id} href={`/services#${id}`} className="group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-coal p-5">
              {image ? (
                <Image src={image} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="tile-grid absolute inset-0" aria-hidden="true">
                  <span className="absolute -right-4 -top-8 select-none font-display text-[9rem] font-extrabold leading-none text-white/[0.05]">{title.slice(0, 1)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent" aria-hidden="true" />
              <span className="absolute left-5 top-5 font-display text-sm font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="relative text-3xl font-extrabold leading-[0.9]">{title}</h3>
              <p className="relative mt-2 text-sm text-white/70">{t(`items.${id}.short`)}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
