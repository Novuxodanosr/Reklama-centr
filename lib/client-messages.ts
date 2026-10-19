// Какие тексты уходят в браузер (NextIntlClientProvider). Клиентским компонентам нужна лишь часть messages/*.json,
// а всё остальное — серверные компоненты, им хватает getTranslations. Это держит страницы лёгкими:
// каталог — сотни страниц, и полные тексты (~45 КБ) на каждой давали десятки мегабайт.
type Messages = Record<string, any>;

// Общий минимум: шапка, футер, мобильная панель, переключатель языка (app/[locale]/layout.tsx).
export function coreMessages(all: Messages): Messages {
  const items = all.services?.items ?? {};
  return {
    nav: all.nav,
    footer: all.footer,
    telegram: all.telegram,
    lang: all.lang,
    contacts: { managers: all.contacts?.managers },
    services: { items: Object.fromEntries(Object.entries(items).map(([id, v]: [string, any]) => [id, { title: v.title }])) },
  };
}

// Каталог: общий минимум + тексты каталога и формы заявки (QuoteBand на странице разделов).
export function catalogMessages(all: Messages): Messages {
  return { ...coreMessages(all), catalog: all.catalog, form: all.form, cta: all.cta };
}
