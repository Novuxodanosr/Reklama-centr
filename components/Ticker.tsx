import { useTranslations } from "next-intl";
import { serviceIds } from "@/lib/services";

// Бегущая строка: направления вперемешку с фактами доверия. Останавливается при наведении.
export default function Ticker() {
  const t = useTranslations();
  const names = serviceIds.map((id) => t(`services.items.${id}.title`));
  const facts = t.raw("hero.trust") as string[];
  const row: { text: string; accent: boolean }[] = [];
  names.forEach((n, i) => {
    row.push({ text: n, accent: false });
    if (facts[i % facts.length]) row.push({ text: facts[i % facts.length], accent: true });
  });
  const doubled = [...row, ...row];

  return (
    <div className="overflow-hidden border-y border-line bg-coal py-5" aria-hidden="true">
      <div className="mask-fade-x led-screen">
        <div className="flex w-max animate-ticker gap-12 whitespace-nowrap font-display text-3xl font-bold uppercase tracking-wide hover:[animation-play-state:paused] sm:text-4xl">
          {doubled.map((item, i) => (
            <span key={i} className={`flex items-center gap-12 ${item.accent ? "text-accent" : "text-paper/80"}`}>
              {item.text}
              <span className="h-2.5 w-2.5 rotate-45 bg-white/30" />
            </span>
          ))}
        </div>
      </div>
      <div className="ruler mt-4 opacity-60" />
    </div>
  );
}
