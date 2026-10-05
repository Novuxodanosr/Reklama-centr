import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import LeadForm from "@/components/LeadForm";
import Faq from "@/components/Faq";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { PhoneIcon, TelegramIcon } from "@/components/icons";
import { pageMeta, managers, mapLinks, site, telegramLink, type Locale } from "@/lib/site";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo.pages.contacts" });
  return pageMeta(locale as Locale, "/contacts", t("title"), t("description"));
}

export default function ContactsPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations("contacts");
  const tg = useTranslations("telegram");
  const l = useLocale() as Locale;
  const map = mapLinks(l);

  return (
    <>
    <section className="container-x grid gap-12 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:pb-32">
      <div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-4 text-6xl font-extrabold leading-[0.88] sm:text-8xl">{t("title")}</h1>
        <p className="mt-6 text-lg text-mist">{t("lead")}</p>

        <h2 className="eyebrow-muted mt-12 font-sans normal-case tracking-[0.24em]">{t("managersTitle")}</h2>
        <RevealGroup className="mt-4 grid gap-3">
          {managers.map((m) => (
            <RevealItem key={m.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-coal p-4 sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent">
                {t(`managers.${m.id}.name`).slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-tight">{t(`managers.${m.id}.name`)}</span>
                <span className="mt-0.5 block text-xs text-mist">{t(`managers.${m.id}.role`)}</span>
              </span>
              <a href={m.href} className="flex w-full items-center gap-2 whitespace-nowrap pl-[3.75rem] font-display text-2xl font-bold tabular-nums transition-colors hover:text-accent sm:ml-auto sm:w-auto sm:pl-0">
                <PhoneIcon className="h-4 w-4 text-accent" /> {m.phone}
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="mt-4 text-sm text-mist">{t("hours")}</p>

        <dl className="mt-12 grid gap-8 sm:grid-cols-2">
          {site.email && (
            <div className="border-t border-white/15 pt-4">
              <dt className="eyebrow-muted">{t("email")}</dt>
              <dd className="mt-2 text-lg"><a href={`mailto:${site.email}`} className="hover:text-accent">{site.email}</a></dd>
            </div>
          )}
          <div className="border-t border-white/15 pt-4 sm:col-span-2">
            <dt className="eyebrow-muted">{t("address")}</dt>
            <dd className="mt-2 text-lg">{site.address[l]}</dd>
            {/* Карта грузится, только когда до неё долистали (loading="lazy") */}
            <dd className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-coal">
              <iframe src={map.embed} title={t("mapTitle")} loading="lazy" className="block h-72 w-full sm:h-80" allowFullScreen />
            </dd>
            <dd className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-mist">{t("route")}:</span>
              <a href={map.taxi} target="_blank" rel="noopener" className="btn-ghost !py-2">{t("openTaxi")}</a>
              <a href={map.yandex} target="_blank" rel="noopener" className="btn-ghost !py-2">{t("openYandex")}</a>
              <a href={map.google} target="_blank" rel="noopener" className="btn-ghost !py-2">{t("openGoogle")}</a>
            </dd>
          </div>
          {(site.telegram || site.instagram) && (
            <div className="border-t border-white/15 pt-4 sm:col-span-2">
              <dt className="eyebrow-muted">{t("messengers")}</dt>
              <dd className="mt-3 flex flex-wrap gap-3">
                {site.telegram && <a href={telegramLink(tg("hello"))!} className="btn-ghost !py-2" rel="noopener"><TelegramIcon className="h-4 w-4" /> Telegram</a>}
                {site.instagram && <a href={site.instagram} className="btn-ghost !py-2" rel="noopener">Instagram</a>}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <LeadForm />
    </section>
    <Faq />
    </>
  );
}
