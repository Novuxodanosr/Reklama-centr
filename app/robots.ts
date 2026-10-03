import type { MetadataRoute } from "next";

// Для статической сборки (PHP-хостинг) файл генерируется один раз при сборке.
export const dynamic = "force-static";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
