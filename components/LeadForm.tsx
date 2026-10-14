"use client";

import { useRef, useState, type FormEvent, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { serviceIcons, serviceIds, type ServiceId } from "@/lib/services";
import { site, telegramLink } from "@/lib/site";
import { ArrowIcon, CheckIcon, PaperclipIcon, TelegramIcon } from "./icons";
import { ease } from "./motion/Reveal";

type Status = "idle" | "sending" | "success" | "error";
// 50 МБ — предел, который Telegram принимает от ботов (файл летит менеджерам напрямую в группу).
const MAX_FILE = 50 * 1024 * 1024;
// Те же форматы, что принимает сервер (app/api/lead/route.ts).
const ALLOWED_FILE = /\.(pdf|jpe?g|png|webp|ai|cdr|eps|svg)$/i;
const steps = ["what", "details", "contact"] as const;

// Заявка в три шага: направление → описание и файл → контакты. Уходит в Telegram через /api/lead.
export default function LeadForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceId | "">("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<"" | "size" | "type">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const honeypot = useRef<HTMLInputElement>(null);

  const [needMessage, setNeedMessage] = useState(false);
  // Переход из конструктора вывески: направление и описание уже заполнены.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("service") as ServiceId | null;
    const m = q.get("message");
    if (s && (serviceIds as readonly string[]).includes(s)) { setService(s); setStep(1); }
    if (m) setMessage(m.slice(0, 1000));
  }, []);
  const next = () => {
    // Шаг «Детали»: без описания задачи дальше не пускаем — подсвечиваем поле и ставим в него курсор.
    if (step === 1 && !message.trim()) {
      setNeedMessage(true);
      document.querySelector<HTMLTextAreaElement>('textarea[name="message"]')?.focus();
      return;
    }
    setNeedMessage(false);
    setStep((s) => Math.min(s + 1, 2));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function pick(f: File | null) {
    if (f && f.size > MAX_FILE) {
      setFile(null);
      setFileError("size");
      return;
    }
    if (f && !ALLOWED_FILE.test(f.name)) {
      setFile(null);
      setFileError("type");
      return;
    }
    setFileError("");
    setFile(f);
  }
  const fileErrorText = fileError === "size" ? t("form.fileTooBig") : t("form.fileType");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("service", service);
      fd.set("message", message);
      fd.set("locale", locale);
      fd.set("page", window.location.pathname);
      fd.set("company_url", honeypot.current?.value ?? "");
      if (file) fd.set("file", file);
      const res = await fetch("/api/lead", { method: "POST", body: fd });
      if (res.status === 413) {
        // Сервер отверг файл — возвращаем на шаг с файлом и показываем причину, а не общую ошибку.
        setFile(null);
        setFileError("type");
        setStep(1);
        setStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setStep(0);
    setService("");
    setMessage("");
    setFile(null);
    setName("");
    setPhone("");
    setStatus("idle");
  }

  const field = "w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-accent";
  const slide = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.3, ease },
  };

  if (status === "success") {
    return (
      <div id="form" className="scroll-mt-28 rounded-2xl border border-white/10 bg-coal p-8 sm:p-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white"
        >
          <CheckIcon className="h-8 w-8" />
        </motion.div>
        <h3 className="mt-6 text-4xl font-extrabold">{t("form.successTitle")}</h3>
        <p className="mt-3 max-w-md text-mist">{t("form.success")}</p>
        <button type="button" onClick={reset} className="btn-ghost mt-8">{t("form.another")}</button>
      </div>
    );
  }

  return (
    <form id="form" onSubmit={onSubmit} className="scroll-mt-28 rounded-2xl border border-white/10 bg-coal p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{t("form.title")}</h2>
        <span className="shrink-0 text-xs text-mist">{t("form.step", { n: step + 1, total: 3 })}</span>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-2">
        {steps.map((s, i) => (
          <li key={s} className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]">
            <span className={`block h-[3px] rounded-full transition-colors duration-500 ${i <= step ? "bg-accent" : "bg-white/15"}`} />
            <span className={`mt-2 block ${i === step ? "text-paper" : "text-dim"}`}>{t(`form.steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      <div className="relative mt-7 min-h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div key="s0" {...slide}>
              <p className="text-sm text-mist">{t("form.chooseService")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {serviceIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setService(id);
                      next();
                    }}
                    aria-pressed={service === id}
                    className={`flex min-h-[84px] flex-col items-start justify-between gap-3 rounded-lg border p-3 text-left text-sm font-medium leading-tight transition-colors ${
                      service === id ? "border-accent bg-accent/15 text-white" : "border-white/15 text-paper/85 hover:border-white/50 hover:text-white"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={serviceIcons[id]} />
                    </svg>
                    {t(`services.items.${id}.title`)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" {...slide}>
              {service && (
                <p className="mb-4 text-sm text-mist">
                  {t("form.service")}: <span className="text-paper">{t(`services.items.${service}.title`)}</span>
                </p>
              )}
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">{t("form.message")}</span>
                <textarea name="message" rows={5} value={message} onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setNeedMessage(false); }} placeholder={t("form.messagePlaceholder")} aria-invalid={needMessage} className={`${field} ${needMessage ? "!border-accent" : ""}`} />
                {needMessage && <span role="alert" className="mt-2 block text-xs text-accentHover">{t("form.messageRequired")}</span>}
              </label>
              <label
                className={`mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors ${
                  fileError ? "border-accent text-accentHover" : "border-white/20 text-mist hover:border-white/50 hover:text-paper"
                }`}
              >
                <PaperclipIcon />
                <span className="min-w-0 flex-1 truncate">{file ? file.name : t("form.attach")}</span>
                <span className="hidden shrink-0 text-xs text-dim sm:block">{fileError ? fileErrorText : t("form.attachHint")}</span>
                <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,.ai,.cdr,.eps,.svg,.psd,.tif,.tiff,.zip,.rar,.doc,.docx,.xls,.xlsx" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              </label>
              {fileError && <p className="mt-2 text-xs text-accentHover sm:hidden">{fileErrorText}</p>}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={back} className="btn-ghost">{t("form.back")}</button>
                <button type="button" onClick={next} className="btn-primary">
                  {t("form.next")} <ArrowIcon />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" {...slide}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">{t("form.name")}</span>
                  <input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">{t("form.phone")}</span>
                  <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998" className={field} />
                </label>
              </div>
              {/* Ловушка для ботов: люди это поле не видят. */}
              <input ref={honeypot} type="text" name="company_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <button type="button" onClick={back} className="btn-ghost">{t("form.back")}</button>
                  <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-60">
                    {status === "sending" ? t("form.sending") : t("form.submit")}
                  </button>
                </div>
                <p className="max-w-[26ch] text-xs text-dim">{t("form.consent")}</p>
              </div>
              <p role="status" aria-live="polite" className="mt-4 text-sm">
                {status === "error" && (
                  <span className="text-accentHover">
                    {t("form.error")} <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Альтернатива форме: сразу в мессенджер, текст уже написан (только когда есть реальный Telegram) */}
      {site.telegram && (
      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-5 text-sm text-mist">
        {t("telegram.hint")}
        <a
          href={telegramLink(service ? t("telegram.service", { service: t(`services.items.${service}.title`) }) : t("telegram.hello"))!}
          rel="noopener"
          className="inline-flex items-center gap-2 font-semibold text-paper transition-colors hover:text-accent"
        >
          <TelegramIcon className="h-4 w-4 text-accent" /> {t("telegram.link")} →
        </a>
      </p>
      )}
    </form>
  );
}
