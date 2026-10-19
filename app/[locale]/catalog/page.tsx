import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { catalog, childCategories, l10n, productsIn, rootCategories } from "@/lib/catalog";
import QuoteBand from "@/components/QuoteBand";
import { pageMeta, type Locale } from "@/lib/site";

// Каталог: разделы и подразделы (данные — data/catalog.json, правятся в админке).
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo.pages.catalog" });
  return pageMeta(locale as Locale, "/catalog", t("title"), t("description"));
}

export default async function CatalogPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const L = locale as Locale;

  return (
    <>
      <section className="container-x pt-16 sm:pt-24">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-4 text-6xl font-extrabold leading-[0.88] sm:text-8xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t("intro")}</p>
      </section>

      {rootCategories.map((root) => (
        <section key={root.id} className="container-x py-14 lg:py-20">
          <h2 className="text-4xl font-extrabold leading-[0.9] sm:text-5xl">{l10n(root.title, L)}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {childCategories(root.id).map((c) => {
              const items = productsIn(c.id);
              const cover = items.find((p) => p.images[0])?.images[0];
              return (
                <Link key={c.id} href={`/catalog/${c.id}`} className="group flex items-center gap-5 rounded-xl border border-white/10 bg-coal p-4 transition-colors hover:border-accent" data-clip>
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white">
                    {cover && <Image src={cover} alt="" fill sizes="96px" className="object-contain p-2 transition-transform duration-500 group-hover:scale-105" />}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold uppercase leading-none">{l10n(c.title, L)}</h3>
                    <p className="mt-2 text-sm text-mist">{t("items", { n: items.length })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {catalog.products.length === 0 && <p className="container-x py-16 text-mist">…</p>}
      <QuoteBand />
    </>
  );
}
