"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track, type Goal } from "@/lib/analytics";
import { site } from "@/lib/site";

const { yandexMetrika: ymId, googleAnalytics: gaId } = site.analytics;

// Клики по контактам считаем в одном месте, чтобы не размечать каждую ссылку на сайте.
function goalFor(href: string): Goal | null {
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (/^https?:\/\/(t\.me|telegram\.me)\//.test(href)) return "telegram_click";
  return null;
}

// Счётчики посещаемости. Работают только на собранном сайте: визиты с localhost в статистику не попадают.
// Вебвизор выключен намеренно: он записывает действия посетителя, включая ввод в форме заявки.
export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const href = (e.target as Element).closest?.("a")?.getAttribute("href");
      const goal = href && goalFor(href);
      if (goal) track(goal, ymId);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Переходы внутри сайта идут без перезагрузки страницы: Метрике о них сообщаем сами (Google считает их автоматически).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ymId && window.ym) window.ym(Number(ymId), "hit", window.location.href, { title: document.title });
  }, [pathname]);

  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {ymId && (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${Number(ymId)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
        </Script>
      )}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config","${gaId}");`}
          </Script>
        </>
      )}
    </>
  );
}
