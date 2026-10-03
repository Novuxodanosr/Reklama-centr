import { useTranslations } from "next-intl";
import { site, telegramLink } from "@/lib/site";
import { PhoneIcon, TelegramIcon } from "./icons";

// Липкая панель на телефонах: «Позвонить» и «Telegram» всегда под большим пальцем.
// Пока нет реального Telegram — одна кнопка «Позвонить» на всю ширину.
export default function MobileBar() {
  const t = useTranslations();
  const tgHref = telegramLink(t("telegram.hello"));

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 grid ${tgHref ? "grid-cols-2" : "grid-cols-1"} gap-px border-t border-white/10 bg-ink/90 backdrop-blur-md lg:hidden`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <a href={site.phoneHref} className={`flex items-center justify-center gap-2 py-4 text-sm font-semibold ${tgHref ? "text-paper" : "bg-accent text-white"}`}>
        <PhoneIcon className={`h-4 w-4 ${tgHref ? "text-accent" : ""}`} /> {t("nav.call")}
      </a>
      {tgHref && (
        <a href={tgHref} rel="noopener" className="flex items-center justify-center gap-2 bg-accent py-4 text-sm font-semibold text-white">
          <TelegramIcon className="h-4 w-4" /> Telegram
        </a>
      )}
    </div>
  );
}
