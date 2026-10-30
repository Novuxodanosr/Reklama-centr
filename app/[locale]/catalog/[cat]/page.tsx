import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { catalog, categoryById, filledCategories, l10n, productsIn } from "@/lib/catalog";
import { categorySeo } from "@/lib/catalog-seo";
import CategoryGrid from "@/components/catalog/CategoryGrid";
import QuoteBand from "@/components/QuoteBand";
import { localePath, pageMeta, safeJsonLd, site, siteUrl, type Locale } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.categories.filter((c) => c.parent).map((c) => ({ cat: c.id }));
}

type Params = { params: { locale: string; cat: string } };

export async function generateMetadata({ params: { locale, cat } }: Params): Promise<Metadata> {
  const c = categoryById(cat);
  if (!c) return {};
  const L = locale as Locale;
  const { title, description } = categorySeo(c, L);
  const meta = pageMeta(L, `/catalog/${cat}`, title, description);
  // Пустой раздел (товары ещё не добавлены) — не индексируем.
  return productsIn(cat).length ? meta : { ...meta, robots: { index: false, follow: true } };
}

export default async function CategoryPage({ params: { locale, cat } }: Params) {
  const c = categoryById(cat);
  if (!c) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const L = locale as Locale;
  const parent = c.parent ? categoryById(c.parent) : null;
  const siblings = c.parent ? filledCategories(c.parent) : [];
  const url = (p: string) => `${siteUrl}${localePath(L, p)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.name, item: url("/") },
        { "@type": "ListItem", position: 2, name: t("title"), item: url("/catalog") },
        { "@type": "ListItem", position: 3, name: l10n(c.title, L), item: url(`/catalog/${cat}`) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: l10n(c.title, L),
      itemListElement: productsIn(cat).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: l10n(p.title, L), url: url(`/catalog/${cat}/${p.id}`) })),
    },
  ];

  return (
    <>
      <section className="container-x pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-dim">
          <Link href="/catalog" className="hover:text-white">{t("breadcrumbCatalog")}</Link>
          {parent && (<><span aria-hidden="true">/</span><span>{l10n(parent.title, L)}</span></>)}
        </nav>
        <h1 className="mt-6 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{l10n(c.title, L)}</h1>
        {siblings.length > 1 && (
          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
            {siblings.map((s) => (
              <Link key={s.id} href={`/catalog/${s.id}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${s.id === cat ? "border-accent bg-accent text-white" : "border-white/20 text-paper/80 hover:border-white hover:text-white"}`}>
                {l10n(s.title, L)}
              </Link>
            ))}
          </div>
        )}
        <CategoryGrid category={cat} products={productsIn(cat)} settings={catalog.settings} />
      </section>
      <div className="h-16" />
      <QuoteBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  );
}
