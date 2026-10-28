import type { Locale } from "./site";

// Типы и мелкие функции каталога без данных — безопасно импортировать в клиентские компоненты
// (сами данные data/catalog.json подключает только серверный lib/catalog.ts, чтобы не раздувать страницы).
export type L10n = Record<Locale, string>;
export type Category = { id: string; parent: string | null; title: L10n; order: number };
export type Unit = "pcs" | "m2";
export type Currency = "usd" | "uzs";
// Наличие: stock — в наличии, order — под заказ (leadTime — срок, напр. «10–15»), none — нет; пусто — не показываем.
export type Availability = "stock" | "order" | "none";
export type Badge = "new" | "hit" | "sale";
export type Markup = { mode: "pct" | "abs"; value: number } | null;
export type Product = {
  id: string;
  category: string;
  codes: string[];
  title: L10n;
  short: L10n;
  features: Record<Locale, string[]>;
  specs: { k: L10n; v: L10n | string }[];
  included: L10n[];
  images: string[];
  unit?: Unit;
  availability?: Availability | null;
  leadTime?: string | null;   // срок под заказ, дней
  badges?: Badge[];
  minQty?: number | null;     // свой минимальный тираж (пусто — общий из настроек; 1 — не показываем)
  brand?: string | null;
  price: number | null;        // цена «от» в валюте settings.currency
  published: boolean;
  order: number;
};
export type CatalogSettings = { showPrices: boolean; currency: Currency; priceStep: number; minQty: number };
export type PublicCatalog = { settings: CatalogSettings; categories: Category[]; products: Product[] };
export const defaultSettings: CatalogSettings = { showPrices: true, currency: "usd", priceStep: 0.5, minQty: 50 };

export const l10n = (v: L10n | string, locale: Locale) => (typeof v === "string" ? v : v[locale] || v.ru);

// Цена в долларах: «$7.50» по-английски, «7,5 $» по-русски и по-узбекски; в сумах — «92 000 сум».
export function formatPrice(n: number, currency: Currency, locale: Locale) {
  if (currency === "uzs") return new Intl.NumberFormat("ru-RU").format(Math.round(n)).replace(/ /g, " ") + " сум";
  const num = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n).replace(/ /g, " ");
  return locale === "en" ? `$${num}` : `${num} $`;
}
