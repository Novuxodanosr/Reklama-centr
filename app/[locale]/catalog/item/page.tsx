import { unstable_setRequestLocale } from "next-intl/server";
import ItemByUrl from "@/components/catalog/ItemByUrl";
import CatalogCta from "@/components/catalog/CatalogCta";

// Запасная страница для товаров, добавленных в админке после сборки сайта: .htaccess направляет сюда
// адреса /catalog/<категория>/<id>/, для которых нет статической страницы; товар берётся из живого каталога.
export const metadata = { robots: { index: false } };

export default function CatalogItemPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <ItemByUrl />
      <CatalogCta />
    </>
  );
}
