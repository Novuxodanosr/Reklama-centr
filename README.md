# Reklama Centr — сайт производственного направления

> **Полная инструкция: [ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md)** · история и правила заказчика: [HANDOFF.md](HANDOFF.md)
> Сайт: https://reklama-centr.uz

Отдельный сайт для производства рекламы (наружная реклама, вывески, печать,
брендирование, выставочные стенды, сувениры). Отдельный сайт производственного направления;
маркетинг, дизайн, IT и события остаются на `ps.com.uz`.

## Стек

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- next-intl — три языка: RU (корень `/`), EN (`/en`), UZ (`/uz`)
- Форма заявки → `/api/lead` → Telegram-бот

## Запуск

```bash
npm install
cp .env.example .env.local   # вписать токен бота и chat_id
npm run dev                  # http://localhost:3000
```

Сборка: `npm run build`, запуск: `npm start`.

## Структура

```
app/[locale]/          страницы: главная, services, works, about, contacts
app/api/lead/          обработчик формы (лимит 5 заявок/мин с IP, honeypot)
app/sitemap.ts         sitemap с hreflang на все языки
components/            шапка, футер, карточки, форма
messages/{ru,en,uz}    все тексты сайта — правятся здесь
lib/site.ts            домен, телефон, почта, адрес — правятся здесь
lib/services.ts        список направлений (id + иконки)
lib/clients.ts         логотипы клиентов (файлы в public/clients/)
lib/works.ts           портфолио (пока без фото — цветные плитки)
```

## Что подставить перед запуском

1. **Домен** — `lib/site.ts`, поле `siteUrl` (сейчас заглушка `reklama-center.uz`).
2. **Контакты** — там же: почта, Telegram, Instagram, адрес (телефоны менеджеров уже реальные).
3. **Telegram** — `.env.local`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
4. **Фото работ** — `lib/works.ts`: добавить поле `image`, в `components/WorkCard.tsx`
   заменить градиент на `<Image>`.
5. **Цифры на главной** (лет, объектов, площадь, команда) — `messages/*.json`, блок `stats`.
6. **Аналитика** — добавить счётчики в `app/[locale]/layout.tsx`.

## Хостинг

Next.js нужен Node.js. Варианты: Vercel (нулевая настройка), либо VPS с
`npm run build && npm start` за nginx. На shared-хостинге с Apache/PHP
(как у ps.com.uz) запустить не получится — либо другой тариф, либо
статический экспорт (`output: "export"` в `next.config.mjs`), но тогда
`/api/lead` придётся вынести на отдельный сервер.
