import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Sofia_Sans_Extra_Condensed, Onest } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBar from "@/components/MobileBar";
import Effects from "@/components/fx/Effects";
import { alternatesFor, locales, ogLocale, safeJsonLd, siteUrl, site, type Locale } from "@/lib/site";
import "../globals.css";

// Заголовки: узкий плотный гротеск, как на вывесках. Текст: Onest с родной кириллицей.
const display = Sofia_Sans_Extra_Condensed({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });
const body = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-body", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#0B0B0D", colorScheme: "dark" };

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: `%s — ${site.name}` },
    description: t("description"),
    alternates: alternatesFor(locale as Locale, "/"),
    openGraph: { type: "website", siteName: site.name, title: t("title"), description: t("description"), locale: ogLocale(locale as Locale) },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    slogan: `${site.slogan.short} — ${site.slogan.full}`,
    url: siteUrl,
    telephone: site.phone,
    ...(site.email ? { email: site.email } : {}),
    ...(site.instagram || site.telegram ? { sameAs: [site.instagram, site.telegram].filter(Boolean) } : {}),
    address: { "@type": "PostalAddress", streetAddress: site.streetAddress, addressLocality: "Tashkent", addressCountry: "UZ" },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lon },
  };

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main" className="flex-1 pb-16 pt-[76px] lg:pb-0">{children}</main>
          <Footer />
          <MobileBar />
          <Effects />
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      </body>
    </html>
  );
}
