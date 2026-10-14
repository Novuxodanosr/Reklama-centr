import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { managers, site, telegramLink, type Locale } from "@/lib/site";
import { serviceIds } from "@/lib/services";
import Logo from "./Logo";
import { TelegramIcon } from "./icons";
import Slogan from "./Slogan";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-ink">
      <div className="container-x">
        <div className="grid gap-12 py-14 md:grid-cols-[1.2fr_0.7fr_1fr_1.4fr] lg:py-20">
          <div>
            <Logo className="h-10 text-paper" />
            <Slogan lockup className="mt-3" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">{t("footer.tagline")}</p>
            {site.telegram && (
              <a href={telegramLink(t("telegram.hello"))!} rel="noopener" className="btn-ghost mt-8 !py-2.5">
                <TelegramIcon className="h-4 w-4" /> Telegram
              </a>
            )}
          </div>

          <div>
            <h3 className="eyebrow-muted font-sans normal-case tracking-[0.24em]">{t("footer.nav")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {(["services", "works", "about", "contacts"] as const).map((k) => (
                <li key={k}>
                  <Link href={`/${k}`} className="link-underline text-paper/80 hover:text-white">{t(`nav.${k}`)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow-muted font-sans normal-case tracking-[0.24em]">{t("footer.services")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {serviceIds.map((id) => (
                <li key={id}>
                  <Link href={`/services/${id}`} className="link-underline text-paper/80 hover:text-white">{t(`services.items.${id}.title`)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow-muted font-sans normal-case tracking-[0.24em]">{t("footer.contacts")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {managers.map((m) => (
                <li key={m.id} className="whitespace-nowrap">
                  <a href={m.href} className="tabular-nums text-paper/80 hover:text-white">{m.phone}</a>
                  <span className="text-dim"> · {t(`contacts.managers.${m.id}.name`)}</span>
                </li>
              ))}
              {site.email && <li><a href={`mailto:${site.email}`} className="text-paper/80 hover:text-white">{site.email}</a></li>}
              {site.instagram && <li><a href={site.instagram} rel="noopener" className="text-paper/80 hover:text-white">Instagram</a></li>}
              <li className="text-mist">{site.address[locale]}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {site.name}. {t("footer.rights")}</span>
          <a href="#main" className="link-underline hover:text-paper">{t("footer.top")} ↑</a>
        </div>
      </div>
    </footer>
  );
}
