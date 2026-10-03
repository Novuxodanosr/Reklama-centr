"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { letters } from "@/lib/letters";
import { clients, clientImage } from "@/lib/clients";
import Reveal, { RevealGroup, RevealItem } from "./motion/Reveal";
import Lightbox from "./Lightbox";
import { ArrowUpRightIcon } from "./icons";

// Благодарственные письма: карточки-«бумага» с цитатой, по клику — письмо целиком на весь экран.
export default function Letters() {
  const t = useTranslations();
  const [index, setIndex] = useState<number | null>(null);
  const items = letters.map((l) => ({
    src: l.image,
    title: t(`testimonials.items.${l.id}.company`),
    caption: `${t(`testimonials.items.${l.id}.name`)} · ${t(`testimonials.items.${l.id}.role`)}`,
  }));

  return (
    <section className="container-x py-24 lg:py-32">
      <Reveal>
        <p className="eyebrow">{t("testimonials.eyebrow")}</p>
        <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("testimonials.title")}</h2>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t("testimonials.intro")}</p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {letters.map((l, i) => {
          const logo = l.client ? clients.find((c) => c.id === l.client) : undefined;
          return (
            <RevealItem key={l.id} as="article">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${t("testimonials.open")}: ${t(`testimonials.items.${l.id}.company`)}`}
                className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-coal text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/60"
              >
                {/* Верх письма: шапка и первые строки, снизу растворяется в карточку */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                  <Image src={l.image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-coal to-transparent" aria-hidden="true" />
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/70 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100" aria-hidden="true">
                    <ArrowUpRightIcon />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-display text-3xl font-extrabold leading-none text-accent" aria-hidden="true">“</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-paper/90">{t(`testimonials.items.${l.id}.quote`)}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                    {logo && (
                      <span className="relative h-8 w-16 shrink-0 rounded bg-white p-1">
                        <span className="relative block h-full w-full">
                          <Image src={clientImage(logo.id)} alt={logo.name} fill sizes="64px" className="object-contain" />
                        </span>
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{t(`testimonials.items.${l.id}.name`)}</span>
                      <span className="block truncate text-xs text-mist">{t(`testimonials.items.${l.id}.role`)}, {t(`testimonials.items.${l.id}.company`)}</span>
                    </span>
                  </div>
                </div>
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Lightbox
        items={items}
        index={index}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
        labels={{ close: t("works.lightbox.close"), prev: t("works.lightbox.prev"), next: t("works.lightbox.next") }}
      />
    </section>
  );
}
