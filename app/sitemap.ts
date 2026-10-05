import type { MetadataRoute } from "next";

// Для статической сборки (PHP-хостинг) файл генерируется один раз при сборке.
export const dynamic = "force-static";
import { locales, localePath, siteUrl } from "@/lib/site";
import { serviceIds } from "@/lib/services";

const pages = ["/", "/services", ...serviceIds.map((id) => `/services/${id}`), "/works", "/about", "/contacts"];
// На хостинге адреса страниц всегда со слешем на конце (.htaccess) — в карте сайта указываем их так же, без переадресаций.
const slash = process.env.STATIC_EXPORT === "1";
const abs = (locale: (typeof locales)[number], page: string) => {
  const url = `${siteUrl}${localePath(locale, page)}`;
  return slash && !url.endsWith("/") ? `${url}/` : url;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: abs(locale, page),
      lastModified,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, abs(l, page)])),
      },
    })),
  );
}
