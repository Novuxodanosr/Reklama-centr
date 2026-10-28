"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { formatPrice, l10n, type CatalogSettings, type Product } from "@/lib/catalog-shared";
import type { Locale } from "@/lib/site";

export function Price({ product, settings, className = "" }: { product: Product; settings: CatalogSettings; className?: string }) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  if (!settings.showPrices || !product.price) return <span className={`text-sm text-mist ${className}`}>{t("onRequest")}</span>;
  return (
    <span className={`font-display text-2xl font-bold ${className}`}>
      {t("from", { price: formatPrice(product.price, settings.currency, locale) })} <span className="font-sans text-sm font-normal text-mist">{product.unit === "m2" ? t("perM2") : t("perUnit")}</span>
    </span>
  );
}

// Наличие: «В наличии» / «Под заказ · 10–15 дн.» / «Нет в наличии».
export function Stock({ product, className = "" }: { product: Product; className?: string }) {
  const t = useTranslations("catalog");
  const a = product.availability;
  if (!a) return null;
  const color = a === "stock" ? "bg-emerald-400" : a === "order" ? "bg-amber-400" : "bg-white/30";
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-mist ${className}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
      {t(`availability.${a}`)}
      {a === "order" && product.leadTime ? ` · ${t("leadTime", { days: product.leadTime })}` : ""}
    </span>
  );
}

// Плашки на фото: «Новинка», «Хит», «Акция» и «Под заказ».
export function Badges({ product }: { product: Product }) {
  const t = useTranslations("catalog");
  const list: { key: string; text: string; cls: string }[] = [...(product.badges ?? []).map((b) => ({ key: b as string, text: t(`badge.${b}`), cls: b === "hit" ? "bg-accent text-white" : b === "sale" ? "bg-amber-400 text-ink" : "bg-ink text-white" }))];
  if (product.availability === "order") list.push({ key: "order", text: t("availability.order"), cls: "bg-white text-ink ring-1 ring-ink/15" });
  if (list.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
      {list.map((b) => <span key={b.key} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${b.cls}`}>{b.text}</span>)}
    </div>
  );
}

// Подпись под ценами: цены в долларах, оплата в сумах по курсу на день оплаты (в сумах подпись не нужна).
export function PayNote({ settings, className = "" }: { settings: CatalogSettings; className?: string }) {
  const t = useTranslations("catalog");
  if (!settings.showPrices || settings.currency !== "usd") return null;
  return <p className={`text-sm text-dim ${className}`}>{t("payNote")}</p>;
}

// Карточка товара в сетке категории.
export default function ProductCard({ product, settings }: { product: Product; settings: CatalogSettings }) {
  const locale = useLocale() as Locale;
  return (
    <Link href={`/catalog/${product.category}/${product.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-coal transition-colors hover:border-accent" data-clip>
      <div className="relative aspect-square overflow-hidden bg-white">
        <Badges product={product} />
        {product.images[0] && (
          <Image src={product.images[0]} alt={l10n(product.title, locale)} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold leading-snug text-paper">{l10n(product.title, locale)}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-mist">{l10n(product.short, locale)}</p>
        <div className="mt-auto pt-4">
          <Price product={product} settings={settings} />
          {product.availability && product.availability !== "order" && <Stock product={product} className="mt-1 flex" />}
        </div>
      </div>
    </Link>
  );
}
