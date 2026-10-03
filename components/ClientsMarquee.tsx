import Image from "next/image";
import { useTranslations } from "next-intl";
import { clients, clientImage } from "@/lib/clients";

// Логотипы клиентов: белая полоса на тёмном сайте, цветные логотипы без плашек.
// Две ленты едут навстречу друг другу, при наведении останавливаются.
export default function ClientsMarquee() {
  const t = useTranslations("clients");
  const half = Math.ceil(clients.length / 2);
  const rows = [clients.slice(0, half), clients.slice(half)];

  return (
    <section className="border-t border-line">
      <div className="container-x pb-10 pt-20 lg:pt-28">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-4 text-5xl font-extrabold leading-[0.9] sm:text-7xl">{t("title")}</h2>
      </div>

      <div className="bg-white py-10 text-ink sm:py-14">
        <div className="space-y-10">
          {rows.map((row, r) => (
            <div key={r} className="overflow-hidden">
              <div className={`flex w-max items-center gap-14 hover:[animation-play-state:paused] sm:gap-20 ${r === 0 ? "animate-ticker" : "animate-tickerReverse"}`}>
                {[...row, ...row].map((c, i) => (
                  <div key={`${c.id}-${i}`} className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-44">
                    <Image src={clientImage(c.id)} alt={c.name} fill sizes="(min-width: 640px) 176px, 144px" className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="container-x py-8 text-sm text-mist">{t("note")}</p>
    </section>
  );
}
