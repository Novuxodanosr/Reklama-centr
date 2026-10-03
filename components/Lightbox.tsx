"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Work } from "@/lib/works";
import { ease } from "./motion/Reveal";
import { ArrowIcon, CloseIcon } from "./icons";

export type LightboxItem = { src: string; title: string; caption?: string; video?: string };

// Общий способ превратить список работ в элементы лайтбокса (используют лента на главной и сетка работ).
export function lightboxItems(list: Work[], t: (key: string) => string): LightboxItem[] {
  return list.flatMap((w) => {
    const base = { title: w.title ?? t(`works.items.${w.id}.title`), caption: w.client ?? t(`works.items.${w.id}.client`) };
    return [{ ...base, src: w.image }, ...(w.video ? [{ ...base, src: w.image, video: w.video }] : []), ...(w.gallery ?? []).map((src) => ({ ...base, src }))];
  });
}

// Номер первого кадра работы в общем списке просмотра.
export function lightboxStart(list: Work[], workIndex: number): number {
  return list.slice(0, workIndex).reduce((n, w) => n + 1 + (w.video ? 1 : 0) + (w.gallery?.length ?? 0), 0);
}

// Просмотр фото на весь экран: стрелки, Esc, клик по фону.
export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
  labels,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
  labels: { close: string; prev: string; next: string };
}) {
  const open = index !== null;
  const prev = useCallback(() => onIndex(((index ?? 0) - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex(((index ?? 0) + 1) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prev, next]);

  const item = open ? items[index] : null;
  const btn = "grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:border-accent hover:bg-accent";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <button type="button" onClick={onClose} aria-label={labels.close} className={`${btn} absolute right-4 top-4 z-10`}>
            <CloseIcon />
          </button>
          {items.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label={labels.prev} className={`${btn} absolute left-3 top-1/2 z-10 -translate-y-1/2 sm:left-6`}>
                <ArrowIcon className="h-5 w-5 rotate-180" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} aria-label={labels.next} className={`${btn} absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-6`}>
                <ArrowIcon className="h-5 w-5" />
              </button>
            </>
          )}
          <motion.figure
            key={item.video ?? item.src}
            className="relative flex h-full w-full max-w-6xl flex-col"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1">
              {item.video ? (
                <video src={item.video} poster={item.src} className="absolute inset-0 h-full w-full object-contain" autoPlay muted loop playsInline controls />
              ) : (
                <Image src={item.src} alt={item.title} fill sizes="100vw" className="object-contain" priority />
              )}
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-white">
              <span className="font-display text-lg">{item.title}</span>
              <span className="text-sm text-white/60">{item.caption}{items.length > 1 ? ` · ${(index ?? 0) + 1}/${items.length}` : ""}</span>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
