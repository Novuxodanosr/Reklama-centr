import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import ProductionBand from "@/components/ProductionBand";
import ProcessStage from "@/components/ProcessStage";
import ClientsMarquee from "@/components/ClientsMarquee";
import QuoteBand from "@/components/QuoteBand";
import { pageMeta, type Locale } from "@/lib/site";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo.pages.about" });
  return pageMeta(locale as Locale, "/about", t("title"), t("description"));
}

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations();
  const body = t.raw("about.body") as string[];
  const values = t.raw("about.values") as { title: string; text: string }[];
  const advantages = t.raw("advantages.items") as { title: string; text: string }[];
  const stats = ["line", "warranty", "sample", "scale"] as const;

  return (
    <>
      <section className="container-x grid gap-12 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <p className="eyebrow">{t("about.eyebrow")}</p>
          <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[0.9] sm:text-8xl">{t("about.title")}</h1>
          <p className="mt-6 text-lg leading-relaxed text-paper/90">{t("about.lead")}</p>
          <div className="mt-8 max-w-[62ch] space-y-4 leading-relaxed text-mist">
            {body.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-coal lg:mt-12">
          <Image src="/works/golden-house.webp" alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" aria-hidden="true" />
        </Reveal>
      </section>

      <section className="container-x mt-20">
        <RevealGroup className="grid grid-cols-2 gap-6 border-y border-line py-10 md:grid-cols-4">
          {stats.map((k) => (
            <RevealItem key={k} className="group">
              <p className="stat-neon font-display text-5xl font-extrabold tabular-nums sm:text-6xl">
                <Counter value={t(`stats.${k}.value`)} />
              </p>
              <p className="mt-2 max-w-[22ch] text-sm text-mist">{t(`stats.${k}.label`)}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="container-x py-24 lg:py-32">
        <Reveal>
          <p className="eyebrow">{t("advantages.eyebrow")}</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("about.valuesTitle")}</h2>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[...values, ...advantages].map((v, i) => (
            <RevealItem key={v.title} className="border-t border-white/15 pt-5">
              <span className="font-display text-base font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-2xl font-bold leading-tight">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{v.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <ProductionBand catalog />
      <ProcessStage />
      <ClientsMarquee />
      <QuoteBand />
    </>
  );
}
