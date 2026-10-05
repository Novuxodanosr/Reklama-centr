import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { serviceImages, type ServiceId } from "@/lib/services";
import Reveal from "./motion/Reveal";
import { ArrowIcon } from "./icons";

export default function ServiceCard({ id, index }: { id: ServiceId; index: number }) {
  const t = useTranslations("services");
  const body = t.raw(`items.${id}.body`) as string[];
  const products = t.raw(`items.${id}.products`) as string[];
  const image = serviceImages[id];
  const title = t(`items.${id}.title`);
  const flip = index % 2 === 1;
  const num = String(index + 1).padStart(2, "0");

  return (
    <article id={id} className="scroll-mt-32 grid gap-8 border-t border-line py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
      <Reveal className={`relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-coal ${flip ? "lg:order-2" : ""}`}>
        {image ? (
          <Image src={image} alt={title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="tile-grid absolute inset-0 flex items-end p-6">
            <span className="absolute -right-6 -top-10 select-none font-display text-[16rem] font-extrabold leading-none text-white/[0.05]">{title.slice(0, 1)}</span>
            <p className="relative eyebrow text-white/60">{t("photoSoon")}</p>
          </div>
        )}
        <span className="absolute left-5 top-5 font-display text-lg font-bold text-accent">{num}</span>
      </Reveal>

      <Reveal delay={0.1} className={flip ? "lg:order-1" : ""}>
        <p className="eyebrow">{t(`items.${id}.tagline`)}</p>
        <h2 className="mt-3 text-5xl font-extrabold leading-[0.9] sm:text-6xl">
          <Link href={`/services/${id}`} className="transition-colors hover:text-accentHover">{title}</Link>
        </h2>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-paper/80">
          {body.map((p) => <p key={p}>{p}</p>)}
        </div>
        <h3 className="eyebrow-muted mt-8 font-sans normal-case tracking-[0.24em]">{t("productsTitle")}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {products.map((p) => (
            <li key={p} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-paper/85 transition-colors hover:border-accent hover:text-white">{p}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contacts#form" className="btn-primary">
            {t("quote")} <ArrowIcon />
          </Link>
          <Link href={`/services/${id}`} className="btn-ghost">{t("more")}</Link>
        </div>
      </Reveal>
    </article>
  );
}
