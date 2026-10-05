import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { serviceIds, serviceImages, type ServiceId } from "@/lib/services";
import { works } from "@/lib/works";
import ServiceWorks from "@/components/ServiceWorks";
import QuoteBand from "@/components/QuoteBand";
import { ArrowIcon } from "@/components/icons";
import { localePath, pageMeta, safeJsonLd, site, siteUrl, type Locale } from "@/lib/site";

// Отдельная страница направления: под неё поисковики показывают сайт по запросам вида «наружная реклама Ташкент».
// Заголовки и описания для поиска — messages/*.json → seo.services.<id>; сами тексты — services.items.<id>.
export const dynamicParams = false;

export function generateStaticParams() {
  return serviceIds.map((id) => ({ id }));
}

type Params = { params: { locale: string; id: string } };

export async function generateMetadata({ params: { locale, id } }: Params): Promise<Metadata> {
  if (!(serviceIds as readonly string[]).includes(id)) return {};
  const t = await getTranslations({ locale, namespace: "seo.services" });
  return pageMeta(locale as Locale, `/services/${id}`, t(`${id}.title`), t(`${id}.description`));
}

export default function ServicePage({ params: { locale, id } }: Params) {
  if (!(serviceIds as readonly string[]).includes(id)) notFound();
  unstable_setRequestLocale(locale);
  const sid = id as ServiceId;
  const t = useTranslations();
  const body = t.raw(`services.items.${sid}.body`) as string[];
  const products = t.raw(`services.items.${sid}.products`) as string[];
  const title = t(`services.items.${sid}.title`);
  const image = serviceImages[sid];
  const hasWorks = works.some((w) => w.service === sid);
  // На хостинге адреса страниц со слешем на конце — в разметке указываем их так же.
  const url = (path: string) => `${siteUrl}${localePath(locale as Locale, path)}`.replace(/([^/])$/, process.env.STATIC_EXPORT === "1" ? "$1/" : "$1");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: t(`seo.services.${sid}.h1`),
      serviceType: title,
      description: t(`seo.services.${sid}.description`),
      url: url(`/services/${sid}`),
      ...(image ? { image: `${siteUrl}${image}` } : {}),
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: [{ "@type": "City", name: "Tashkent" }, { "@type": "Country", name: "Uzbekistan" }],
      hasOfferCatalog: { "@type": "OfferCatalog", name: title, itemListElement: products.map((p) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: p } })) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.name, item: url("/") },
        { "@type": "ListItem", position: 2, name: t("nav.services"), item: url("/services") },
        { "@type": "ListItem", position: 3, name: title, item: url(`/services/${sid}`) },
      ],
    },
  ];

  return (
    <>
      <section className="container-x pt-16 sm:pt-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-dim">
          <Link href="/" className="hover:text-white">{t("nav.home")}</Link>
          <span aria-hidden="true">/</span>
          <Link href="/services" className="hover:text-white">{t("nav.services")}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-paper/80">{title}</span>
        </nav>
        <p className="eyebrow mt-8">{t(`services.items.${sid}.tagline`)}</p>
        <h1 className="mt-4 max-w-5xl text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t(`seo.services.${sid}.h1`)}</h1>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t(`services.items.${sid}.short`)}</p>
      </section>

      <section className="container-x grid gap-8 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {image && (
          <div className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-coal">
            <Image src={image} alt={t(`seo.services.${sid}.h1`)} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
        <div>
          <div className="space-y-4 text-[15px] leading-relaxed text-paper/80">
            {body.map((p) => <p key={p}>{p}</p>)}
          </div>
          <h2 className="eyebrow-muted mt-8 font-sans normal-case tracking-[0.24em]">{t("services.productsTitle")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {products.map((p) => (
              <li key={p} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-paper/85">{p}</li>
            ))}
          </ul>
          <Link href="/contacts#form" className="btn-primary mt-8">
            {t("services.quote")} <ArrowIcon />
          </Link>
        </div>
      </section>

      {hasWorks && (
        <section className="container-x pb-16 lg:pb-24">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-5xl font-extrabold leading-[0.9] sm:text-6xl">{t("seo.ui.works")}</h2>
            <Link href="/works" className="btn-ghost shrink-0">{t("seo.ui.allWorks")}</Link>
          </div>
          <div className="mt-10">
            <ServiceWorks id={sid} />
          </div>
        </section>
      )}

      <section className="container-x pb-24 lg:pb-32">
        <h2 className="eyebrow-muted font-sans normal-case tracking-[0.24em]">{t("seo.ui.others")}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {serviceIds.filter((s) => s !== sid).map((s) => (
            <li key={s}>
              <Link href={`/services/${s}`} className="block rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-paper/80 transition-colors hover:border-accent hover:text-white">
                {t(`services.items.${s}.title`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <QuoteBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  );
}
