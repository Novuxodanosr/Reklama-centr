import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { catalog, categoryById, l10n, productById, productsIn } from "@/lib/catalog";
import ProductView from "@/components/catalog/ProductView";
import CatalogCta from "@/components/catalog/CatalogCta";
import { localePath, pageMeta, safeJsonLd, site, siteUrl, type Locale } from "@/lib/site";
import { productSeo, schemaAvailability } from "@/lib/catalog-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.products.map((p) => ({ cat: p.category, id: p.id }));
}

type Params = { params: { locale: string; cat: string; id: string } };

export async function generateMetadata({ params: { locale, cat, id } }: Params): Promise<Metadata> {
  const p = productById(id);
  if (!p || p.category !== cat) return {};
  const L = locale as Locale;
  const { title, description } = productSeo(p, L);
  const meta = pageMeta(L, `/catalog/${cat}/${id}`, title, description);
  if (p.images[0]) meta.openGraph = { ...meta.openGraph, images: [{ url: p.images[0], width: 1000, height: 1000 }] };
  return meta;
}

export default async function ProductPage({ params: { locale, cat, id } }: Params) {
  const p = productById(id);
  if (!p || p.category !== cat) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const L = locale as Locale;
  const c = categoryById(cat);
  const url = (path: string) => `${siteUrl}${localePath(L, path)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l10n(p.title, L),
      description: l10n(p.short, L),
      image: p.images.map((i) => `${siteUrl}${i}`),
      sku: p.codes[0] ?? p.id,
      brand: { "@type": "Brand", name: p.brand || site.name },
      ...(catalog.settings.showPrices && p.price
        ? { offers: { "@type": "Offer", priceCurrency: catalog.settings.currency.toUpperCase(), price: p.price, availability: schemaAvailability(p), url: url(`/catalog/${cat}/${id}`) } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.name, item: url("/") },
        { "@type": "ListItem", position: 2, name: t("title"), item: url("/catalog") },
        ...(c ? [{ "@type": "ListItem", position: 3, name: l10n(c.title, L), item: url(`/catalog/${cat}`) }] : []),
        { "@type": "ListItem", position: c ? 4 : 3, name: l10n(p.title, L), item: url(`/catalog/${cat}/${id}`) },
      ],
    },
  ];

  return (
    <>
      <ProductView id={id} product={p} category={c} similar={productsIn(cat).filter((x) => x.id !== id).slice(0, 4)} settings={catalog.settings} />
      <CatalogCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  );
}
