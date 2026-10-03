import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import WorksGrid from "@/components/WorksGrid";
import FeaturedCase from "@/components/FeaturedCase";
import ClientsMarquee from "@/components/ClientsMarquee";
import QuoteBand from "@/components/QuoteBand";
import { alternatesFor, type Locale } from "@/lib/site";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "works" });
  return { title: t("title"), description: t("intro"), alternates: alternatesFor(locale as Locale, "/works") };
}

export default function WorksPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations("works");

  return (
    <>
      <section className="container-x pb-24 pt-16 sm:pt-24 lg:pb-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-4 text-6xl font-extrabold leading-[0.88] sm:text-8xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-mist">{t("intro")}</p>
        <WorksGrid />
      </section>
      <FeaturedCase />
      <ClientsMarquee />
      <QuoteBand />
    </>
  );
}
