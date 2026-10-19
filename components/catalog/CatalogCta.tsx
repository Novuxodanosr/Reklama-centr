import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { site } from "@/lib/site";
import { ArrowIcon, PhoneIcon } from "@/components/icons";

// Компактный призыв на страницах товаров вместо полной формы (QuoteBand): страниц товаров сотни,
// и полная форма с девятью направлениями весила бы по 40 КБ на каждой.
export default async function CatalogCta() {
  const t = await getTranslations("cta");
  const nav = await getTranslations("nav");
  return (
    <section className="border-t border-line bg-ink">
      <div className="container-x flex flex-col gap-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-[0.9] sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 max-w-lg text-mist">{t("text")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contacts#form" className="btn-primary">{t("button")} <ArrowIcon /></Link>
          <a href={site.phoneHref} className="btn-ghost"><PhoneIcon className="h-4 w-4" /> {nav("call")}</a>
        </div>
      </div>
    </section>
  );
}
