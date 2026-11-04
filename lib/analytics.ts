// Цели для Яндекс.Метрики и Google Analytics. Сюда нельзя передавать имя, телефон и текст заявки — только названия действий.
declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export type Goal = "lead_sent" | "phone_click" | "telegram_click" | "email_click";

export function track(goal: Goal, id: string | null) {
  if (id && window.ym) window.ym(Number(id), "reachGoal", goal);
  window.gtag?.("event", goal);
}
