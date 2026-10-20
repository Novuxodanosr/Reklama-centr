import type { MetadataRoute } from "next";

// Для статической сборки (PHP-хостинг) файл генерируется один раз при сборке.
export const dynamic = "force-static";
import { catalogPublic, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: catalogPublic ? ["/api/", "/admin/"] : ["/api/", "/admin/", "/catalog/", "/en/catalog/", "/uz/catalog/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
