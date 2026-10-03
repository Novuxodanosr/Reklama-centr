import { useTranslations } from "next-intl";
import { site } from "@/lib/site";

// Слоган бренда: знак WBB (акцент) + фраза на языке страницы (messages → slogan).
// lockup — мелкая подпись с разрядкой под логотипом в шапке и подвале: WBB ровно светится красным,
// по фразе раз в несколько секунд проходит блик (стили .slogan-lux в globals.css).
export default function Slogan({ lockup = false, className = "" }: { lockup?: boolean; className?: string }) {
  const t = useTranslations();
  if (lockup)
    return (
      <span className={`block whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-paper/60 slogan-lux ${className}`}>
        <span className="slogan-mark notranslate text-accent" translate="no">{site.slogan.short}</span>
        <span className="mx-1.5 text-white/25" aria-hidden="true">·</span>
        <span className="slogan-shine">{t("slogan")}</span>
      </span>
    );
  return (
    <span className={className}>
      <span className="font-semibold text-accent">{site.slogan.short}</span>
      <span className="mx-2 text-white/30" aria-hidden="true">·</span>
      {t("slogan")}
    </span>
  );
}
