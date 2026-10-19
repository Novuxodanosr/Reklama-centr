import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Directions from "@/components/Directions";
import Industries from "@/components/Industries";
import WorksStrip from "@/components/WorksStrip";
import ProductionBand from "@/components/ProductionBand";
import ProcessStage from "@/components/ProcessStage";
import ClientsMarquee from "@/components/ClientsMarquee";
import Faq from "@/components/Faq";
import QuoteBand from "@/components/QuoteBand";
import Reveal from "@/components/motion/Reveal";

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations();

  return (
    <>
      <Hero />
      <Ticker />

      <section className="container-x py-24 lg:py-32">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t("services.eyebrow")}</p>
              <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("services.title")}</h2>
            </div>
            <Link href="/services" className="btn-ghost shrink-0">{t("services.all")}</Link>
          </div>
          <p className="mt-6 max-w-2xl text-lg text-mist">{t("services.intro")}</p>
        </Reveal>
        <div className="mt-12">
          <Directions />
        </div>
      </section>

      <section className="container-x pb-24 lg:pb-32">
        <Reveal>
          <p className="eyebrow">{t("works.eyebrow")}</p>
          <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("works.title")}</h2>
          <p className="mt-6 max-w-2xl text-lg text-mist">{t("works.intro")}</p>
        </Reveal>
        <div className="mt-12">
          <WorksStrip />
        </div>
      </section>

      <ProductionBand />
      <ProcessStage />
      <Industries />
      <ClientsMarquee />
      <Faq />
      <QuoteBand />
    </>
  );
}
