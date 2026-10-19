"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { l10n, type CatalogSettings, type Category, type Product } from "@/lib/catalog-shared";
import type { Locale } from "@/lib/site";
import { ArrowIcon } from "@/components/icons";
import ProductCard, { Price } from "./ProductCard";
import { useLiveCatalog } from "./useLiveCatalog";

type Props = {
  id: string;
  product?: Product;          // из сборки; для товаров, добавленных в админке позже, — нет
  category?: Category;
  similar?: Product[];
  settings?: CatalogSettings;
};

// Страница товара: галерея, характеристики, кнопка «Запросить расчёт» (ведёт в форму с уже заполненным описанием).
// Данные со сборки показываются сразу, затем заменяются живыми из админки (/api/catalog).
export default function ProductView(props: Props) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const live = useLiveCatalog();
  const product = live?.products.find((p) => p.id === props.id) ?? props.product;
  const settings = live?.settings ?? props.settings ?? { showPrices: false, priceStep: 1000, minQty: 50 };
  const category = live ? live.categories.find((c) => c.id === product?.category) : props.category;
  const similar = (live ? live.products.filter((p) => p.category === product?.category && p.id !== props.id) : props.similar ?? []).slice(0, 4);
  const [img, setImg] = useState(0);
  if (!product) return <p className="container-x py-24 text-mist">{live ? t("notFound") : "…"}</p>;

  const title = l10n(product.title, locale);
  const lead = `/contacts?service=promo&message=${encodeURIComponent(t("leadMessage", { title, code: product.codes[0] ?? product.id }))}#form`;
  const images = product.images;

  return (
    <>
      <section className="container-x pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-dim">
          <Link href="/catalog" className="hover:text-white">{t("breadcrumbCatalog")}</Link>
          {category && (<><span aria-hidden="true">/</span><Link href={`/catalog/${category.id}`} className="hover:text-white">{l10n(category.title, locale)}</Link></>)}
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
              {images[img] && <Image key={images[img]} src={images[img]} alt={title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" />}
            </div>
            {images.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button key={src} type="button" onClick={() => setImg(i)} aria-label={`${t("gallery")} ${i + 1}`} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white ring-2 transition ${i === img ? "ring-accent" : "ring-transparent hover:ring-white/40"}`}>
                    <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-5xl">{title}</h1>
            {l10n(product.short, locale) && <p className="mt-5 text-lg text-mist">{l10n(product.short, locale)}</p>}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Price product={product} settings={settings} />
              {product.unit !== "m2" && <span className="text-sm text-dim">{t("minQty", { n: settings.minQty })}</span>}
            </div>
            <a href={lead} className="btn-primary mt-6">{t("request")} <ArrowIcon /></a>
            <p className="mt-3 max-w-md text-sm text-dim">{t("requestHint")}</p>

            {product.features[locale]?.length > 0 && (
              <>
                <h2 className="eyebrow-muted mt-10 font-sans normal-case tracking-[0.24em]">{t("features")}</h2>
                <ul className="mt-3 space-y-2 text-[15px] text-paper/85">
                  {product.features[locale].map((f) => (
                    <li key={f} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{f}</li>
                  ))}
                </ul>
              </>
            )}
            {product.unit !== "m2" && <p className="mt-8 rounded-xl border border-white/10 bg-coal p-4 text-sm text-mist">{t("branding")}</p>}
          </div>
        </div>
      </section>

      {(product.specs.length > 0 || product.included.length > 0) && (
        <section className="container-x grid gap-10 py-16 lg:grid-cols-2 lg:py-20">
          {product.specs.length > 0 && (
            <div>
              <h2 className="text-3xl font-extrabold">{t("specs")}</h2>
              <dl className="mt-5 divide-y divide-white/10 border-y border-white/10 text-sm">
                {product.specs.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1.3fr] gap-4 py-2.5">
                    <dt className="text-dim">{l10n(s.k, locale)}</dt>
                    <dd className="text-paper/90">{l10n(s.v, locale)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {product.included.length > 0 && (
            <div>
              <h2 className="text-3xl font-extrabold">{t("included")}</h2>
              <ul className="mt-5 space-y-2 text-sm text-paper/85">
                {product.included.map((s, i) => <li key={i}>{l10n(s, locale)}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {similar.length > 0 && (
        <section className="container-x pb-20">
          <h2 className="text-3xl font-extrabold">{t("similar")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}
          </div>
        </section>
      )}
    </>
  );
}
