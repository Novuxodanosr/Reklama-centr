import type { MetadataRoute } from "next";

// Для статической сборки (PHP-хостинг) файл генерируется один раз при сборке.
export const dynamic = "force-static";
import { locales, localePath, siteUrl } from "@/lib/site";

const pages = ["/", "/services", "/works", "/about", "/contacts"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, page)}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}${localePath(l, page)}`])),
      },
    })),
  );
}
