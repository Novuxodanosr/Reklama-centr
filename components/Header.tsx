"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/lib/navigation";
import { managers, site, telegramLink } from "@/lib/site";
import Logo from "./Logo";
import Slogan from "./Slogan";
import { ease } from "./motion/Reveal";
import LangSwitcher from "./LangSwitcher";
import { CloseIcon, MenuIcon, PhoneIcon, TelegramIcon } from "./icons";

const items = [
  { href: "/services", key: "services" },
  { href: "/works", key: "works" },
  { href: "/about", key: "about" },
  { href: "/contacts", key: "contacts" },
] as const;

// Шапка: прозрачная над первым экраном, после прокрутки становится тёмной и остаётся на месте.
// Телефон и кнопка расчёта всегда под рукой.
export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white">
        {t("nav.skip")}
      </a>
      <div className={`border-b transition-colors duration-500 ${solid ? "border-line bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent"}`}>
        <div className="container-x flex h-[76px] items-center justify-between gap-6">
          <Link href="/" aria-label={t("nav.home")} className="flex shrink-0 flex-col items-start gap-1.5">
            <Logo className="h-9 text-paper" />
            <Slogan lockup className="hidden sm:block" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label={t("nav.menu")}>
            {items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                aria-current={pathname.startsWith(it.href) ? "page" : undefined}
                className={`link-underline text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-white ${
                  pathname.startsWith(it.href) ? "text-white" : "text-paper/70"
                }`}
              >
                {t(`nav.${it.key}`)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href={site.phoneHref} className="font-display text-[22px] font-bold tabular-nums tracking-wide text-paper transition-colors hover:text-accent">
              {site.phone}
            </a>
            {site.telegram && (
              <a href={telegramLink(t("telegram.hello"))!} rel="noopener" aria-label="Telegram" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-paper transition hover:border-accent hover:bg-accent">
                <TelegramIcon className="h-4 w-4" />
              </a>
            )}
            <LangSwitcher />
            <Link href="/contacts#form" className="btn-primary !py-2.5">
              {t("nav.cta")}
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <a href={site.phoneHref} aria-label={t("nav.call")} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-paper">
              <PhoneIcon className="h-5 w-5" />
            </a>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-paper"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("nav.close") : t("nav.menu")}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-ink lg:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease }}
          >
            <nav className="container-x flex flex-col pb-10 pt-4" aria-label={t("nav.menu")}>
              {items.map((it, i) => (
                <motion.div key={it.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.05 }}>
                  <Link href={it.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line py-5 font-display text-4xl font-bold uppercase">
                    {t(`nav.${it.key}`)}
                    <span className="text-dim">→</span>
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8 space-y-4">
                {managers.map((m) => (
                  <a key={m.id} href={m.href} className="block">
                    <span className="font-display text-2xl font-bold tabular-nums">{m.phone}</span>
                    <span className="ml-3 text-sm text-mist">{t(`contacts.managers.${m.id}.name`)}</span>
                  </a>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <LangSwitcher />
                {site.telegram && (
                  <a href={telegramLink(t("telegram.hello"))!} rel="noopener" className="btn-ghost !py-2.5">
                    <TelegramIcon className="h-4 w-4" /> Telegram
                  </a>
                )}
              </div>
              <Link href="/contacts#form" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">
                {t("nav.cta")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
