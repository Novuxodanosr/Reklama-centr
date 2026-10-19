import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { catalogMessages } from "@/lib/client-messages";

// Каталог: в браузер уходят только тексты каталога, формы и общий минимум (см. lib/client-messages.ts).
export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const all = await getMessages();
  return <NextIntlClientProvider messages={catalogMessages(all as Record<string, any>)}>{children}</NextIntlClientProvider>;
}
