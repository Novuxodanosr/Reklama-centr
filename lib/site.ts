export const locales = ["ru", "en", "uz"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

// Основной домен (куплен 02.10.2026 на webname.uz); reklama-center.uz (опечатка) и .com-варианты — переадресация сюда же.
export const siteUrl = "https://reklama-centr.uz";
// Каталог товаров ещё не заполнен: false — ссылок в меню и подвале нет, поисковикам закрыт (robots, noindex, нет в sitemap),
// но страницы /catalog/ открываются по прямой ссылке для проверки. Поставить true, когда каталог готов.
export const catalogPublic = false;

// Менеджеры (телефоны реальные, заказчик 11.09.2026).
// Имена и должности — в messages/*.json → contacts.managers.<id>.
export const managers = [
  { id: "javohir", phone: "+998 87 000 61 61", href: "tel:+998870006161" },
  { id: "shahina", phone: "+998 88 001 46 46", href: "tel:+998880014646" },
  { id: "tatyana", phone: "+998 88 001 34 34", href: "tel:+998880013434" },
] as const;

export type ManagerId = (typeof managers)[number]["id"];

export const site = {
  // Написание названия — как на логотипе: REKLAMA CENTR (не «Center»).
  name: "Reklama Centr",
  // Слоган бренда (заказчик, 20.09.2026). Одинаковый на всех языках, не переводится.
  slogan: { short: "WBB", full: "Will Be Branded" },
  // Основной телефон в шапке, футере и блоке расчёта — первый менеджер.
  phone: managers[0].phone,
  phoneHref: managers[0].href,
  // Почта и соцсети: пока заказчик не дал реальные — null, и кнопки с ними на сайте не показываются
  // (фальшивые адреса вели в никуда). Вписать настоящий адрес или ссылку — кнопки появятся сами.
  email: null as string | null,
  telegram: null as string | null, // например "https://t.me/ник_менеджера"
  instagram: "https://www.instagram.com/reklama.centr.uz/" as string | null, // заведён 02.10.2026
  // Адрес и точка на карте — как на ps.com.uz (та же группа компаний), 02.10.2026. Сменить здесь — поменяется везде.
  address: {
    ru: "Ташкент, ул. Бешёгоч, 71",
    en: "71 Beshyog‘och St, Tashkent",
    uz: "Toshkent, Beshyog‘och ko‘chasi, 71",
  },
  streetAddress: "Beshyog‘och ko‘chasi 71",
  geo: { lat: 41.304631, lon: 69.248478 },
  // Часы работы для поисковиков и карт — те же, что в messages → contacts.hours («Пн–Сб, 9:00–19:00»). Менять в обоих местах.
  hours: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "19:00" },
  // Коды подтверждения прав на сайт: Google Search Console и Яндекс Вебмастер выдают их при добавлении сайта
  // (способ «метатег»). Вписать сюда значение content="…" — тег появится на всех страницах после сборки.
  verification: { google: "d-ThJjkk0YuCGHhBd0Nm-rVDAvROiz5fVe7aL24lA9E" as string | null, yandex: "319be5a9cadee2e0" as string | null },
};

export function localePath(locale: Locale, path = "") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean === "/" ? "" : clean}`;
}

// Карта: встраиваемый виджет Яндекса (без ключа API) и ссылки «открыть в приложении карт».
export const mapLinks = (locale: Locale) => {
  const { lat, lon } = site.geo;
  const lang = { ru: "ru_RU", en: "en_US", uz: "uz_UZ" }[locale];
  return {
    embed: `https://yandex.uz/map-widget/v1/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2rdm&lang=${lang}`,
    // Маршрут от текущего места посетителя (на телефоне открывается приложение Яндекс Карт / Навигатора).
    yandex: `https://yandex.uz/maps/?rtext=~${lat}%2C${lon}&rtt=auto`,
    // Яндекс Go: такси с уже заданной точкой назначения (официальная ссылка-переход Яндекса в приложение).
    taxi: `https://3.redirect.appmetrica.yandex.com/route?end-lat=${lat}&end-lon=${lon}&appmetrica_tracking_id=1178268795219780156`,
    // Google Карты: маршрут на машине — на телефоне сразу предлагает навигацию.
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lon}&travelmode=driving`,
  };
};

// Ссылка на Telegram с уже написанным сообщением: клиенту остаётся нажать «отправить».
// null — пока нет реального Telegram (кнопки скрываются).
export function telegramLink(text?: string) {
  if (!site.telegram) return null;
  return text ? `${site.telegram}?text=${encodeURIComponent(text)}` : site.telegram;
}

// Канонический адрес и hreflang-альтернативы для конкретной страницы (а не только для корня).
export function alternatesFor(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: { ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])), "x-default": localePath(defaultLocale, path) },
  };
}

// Локаль в формате Open Graph (ru_RU, а не ru).
export const ogLocale = (l: Locale) => ({ ru: "ru_RU", en: "en_US", uz: "uz_UZ" })[l];

// Метаданные страницы целиком: заголовок и описание для поиска, канонический адрес и карточка для соцсетей
// и мессенджеров (иначе при пересылке ссылки на любую страницу показывался бы заголовок главной).
export function pageMeta(locale: Locale, path: string, title: string, description: string) {
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: { type: "website" as const, siteName: site.name, title, description, url: localePath(locale, path), locale: ogLocale(locale), images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }] },
  };
}

// JSON-LD внутри <script>: экранируем «<», чтобы текст никогда не закрыл тег раньше времени.
export const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
