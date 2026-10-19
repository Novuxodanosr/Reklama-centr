import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

// Основные страницы сайта (главная, услуги, работы, о компании, контакты): клиентским компонентам нужны
// многие разделы текстов — отдаём все. Корневой layout даёт только общий минимум (lib/client-messages.ts).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
