import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

// STATIC_EXPORT=1 — сборка для обычного PHP-хостинга (webname.uz): готовые HTML-страницы в папке out/,
// форма заявок — PHP (deploy/api/lead.php). Запуск: `node scripts/build-static.mjs`.
const isStatic = process.env.STATIC_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = isStatic
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      images: {
        formats: ["image/webp"],
      },
    };

export default withNextIntl(nextConfig);
