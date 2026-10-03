import { notFound } from "next/navigation";
import { unstable_setRequestLocale } from "next-intl/server";

// Любой адрес, для которого нет страницы, → фирменная 404 (app/[locale]/not-found.tsx)
// внутри обычной шапки и подвала, на языке посетителя.
export default function CatchAllPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  notFound();
}
