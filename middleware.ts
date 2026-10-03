import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/site";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  // Не трогаем API, служебные файлы Next, картинку для превью ссылок и любые файлы с расширением.
  matcher: ["/((?!api|_next|opengraph-image|.*\\..*).*)"],
};
