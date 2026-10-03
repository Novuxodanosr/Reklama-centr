import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { serviceIds } from "@/lib/services";
import ServiceCard from "@/components/ServiceCard";
import QuoteBand from "@/components/QuoteBand";
import { alternatesFor, type Locale } from "@/lib/site";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "services" });
  return { title: t("title"), description: t("intro"), alternates: alternatesFor(locale as Locale, "/services") };
}

export default function ServicesPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations("services");

  return (
    <>
      <section className="container-x pt-16 sm:pt-24">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-4 text-6xl font-extrabold leading-[0.88] sm:text-8xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t("intro")}</p>
      </section>

      <nav className="sticky top-[76px] z-30 mt-12 border-y border-line bg-ink/85 backdrop-blur-md" aria-label={t("title")}>
        <div className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
          {serviceIds.map((id, i) => (
            <a key={id} href={`#${id}`} className="shrink-0 whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-paper/80 transition-colors hover:border-accent hover:text-white">
              <span className="mr-2 font-display text-xs font-bold text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {t(`items.${id}.title`)}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-x">
        {serviceIds.map((id, i) => <ServiceCard key={id} id={id} index={i} />)}
      </div>
      <QuoteBand />
    </>
  );
}
