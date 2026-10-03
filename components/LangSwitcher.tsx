"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import { locales } from "@/lib/site";

export default function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("lang");

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
      {locales.map((l) => {
        const active = l === locale;
        const cls = active ? "bg-paper text-ink" : "text-paper/60 hover:text-paper";
        return (
          <Link key={l} href={pathname} locale={l} hrefLang={l} aria-current={active ? "true" : undefined} className={`rounded-full px-2.5 py-1 transition-colors ${cls}`}>
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
