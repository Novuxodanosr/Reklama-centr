import { useTranslations } from "next-intl";
import { site, telegramLink } from "@/lib/site";
import LeadForm from "./LeadForm";
import { PhoneIcon, TelegramIcon } from "./icons";

export default function QuoteBand() {
  const t = useTranslations("cta");
  const tg = useTranslations("telegram");
  const nav = useTranslations("nav");
  const tgHref = telegramLink(tg("hello"));

  return (
    <section className="relative overflow-hidden border-t border-line bg-ink">
      <div className="absolute -right-20 top-10 h-[460px] w-[460px] rounded-full bg-accent/15 blur-[160px]" aria-hidden="true" />
      <div className="container-x relative grid gap-12 py-24 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:py-32">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("title")}</h2>
          <p className="mt-6 max-w-lg text-lg text-mist">{t("text")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={site.phoneHref} className="btn-ghost !py-2.5">
              <PhoneIcon className="h-4 w-4" /> {nav("call")}
            </a>
            {tgHref && (
              <a href={tgHref} rel="noopener" className="btn-ghost !py-2.5">
                <TelegramIcon className="h-4 w-4" /> Telegram
              </a>
            )}
            {site.email && <a href={`mailto:${site.email}`} className="btn-ghost !py-2.5">{site.email}</a>}
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}
