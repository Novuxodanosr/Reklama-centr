import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <section className="container-x py-24 sm:py-32">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-4 max-w-4xl text-6xl font-extrabold leading-[0.88] sm:text-8xl">{t("title")}</h1>
      <p className="mt-6 max-w-2xl text-lg text-mist">{t("text")}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">{t("home")}</Link>
        <Link href="/services" className="btn-ghost">{t("services")}</Link>
      </div>
    </section>
  );
}
