"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { formatUzs, l10n, type CatalogSettings, type Product } from "@/lib/catalog";
import type { Locale } from "@/lib/site";

export function Price({ product, settings, className = "" }: { product: Product; settings: CatalogSettings; className?: string }) {
  const t = useTranslations("catalog");
  if (!settings.showPrices || !product.priceUzs) return <span className={`text-sm text-mist ${className}`}>{t("onRequest")}</span>;
  return (
    <span className={`font-display text-2xl font-bold ${className}`}>
      {t("from", { price: formatUzs(product.priceUzs) })} <span className="font-sans text-sm font-normal text-mist">{t("perUnit")}</span>
    </span>
  );
}

// Карточка товара в сетке категории.
export default function ProductCard({ product, settings }: { product: Product; settings: CatalogSettings }) {
  const locale = useLocale() as Locale;
  return (
    <Link href={`/catalog/${product.category}/${product.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-coal transition-colors hover:border-accent" data-clip>
      <div className="relative aspect-square overflow-hidden bg-white">
        {product.images[0] && (
          <Image src={product.images[0]} alt={l10n(product.title, locale)} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold leading-snug text-paper">{l10n(product.title, locale)}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-mist">{l10n(product.short, locale)}</p>
        <div className="mt-auto pt-4">
          <Price product={product} settings={settings} />
        </div>
      </div>
    </Link>
  );
}
