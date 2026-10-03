import { NextResponse } from "next/server";
import ru from "@/messages/ru.json";

// Простейший лимит: не больше 5 заявок с одного IP за минуту.
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 60_000;
const MAX_FILE = 10 * 1024 * 1024;
const ALLOWED_FILE = /\.(pdf|jpe?g|png|webp|ai|cdr|eps|svg)$/i;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Чистим адреса, которые давно не писали, чтобы карта не росла бесконечно на долгоживущем сервере.
  if (hits.size > 500) {
    for (const [key, times] of hits) if (now - (times[times.length - 1] ?? 0) > WINDOW_MS) hits.delete(key);
  }
  return recent.length > LIMIT;
}

const serviceTitles = ru.services.items as Record<string, { title: string }>;

export async function POST(req: Request) {
  // За прокси (nginx, Vercel) реальный адрес — последний в списке x-forwarded-for; подделать его сложнее, чем первый.
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",").pop()?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  // Форма шлёт multipart (с файлом), старые интеграции могут слать JSON.
  let fields: Record<string, unknown> = {};
  let file: File | null = null;
  try {
    if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") fields[k] = v;
        else if (k === "file" && v.size > 0) file = v;
      }
    } else {
      fields = await req.json();
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Тело должно быть объектом: JSON вида null / "строка" / [] — некорректный запрос, а не ошибка сервера.
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return NextResponse.json({ ok: false }, { status: 400 });

  // Honeypot: заполненное скрытое поле — бот, отвечаем «успех» и молчим.
  if (fields.company_url) return NextResponse.json({ ok: true });

  const name = String(fields.name ?? "").trim().slice(0, 100);
  const phone = String(fields.phone ?? "").trim().slice(0, 40);
  const service = String(fields.service ?? "").trim().slice(0, 40);
  const message = String(fields.message ?? "").trim().slice(0, 2000);
  const locale = String(fields.locale ?? "ru").slice(0, 2);
  const page = String(fields.page ?? "").slice(0, 200);

  if (!name || !phone) return NextResponse.json({ ok: false }, { status: 422 });
  if (file && (file.size > MAX_FILE || !ALLOWED_FILE.test(file.name))) {
    return NextResponse.json({ ok: false, error: "file" }, { status: 413 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  // Тема («топик») в группе-форуме: без неё сообщения уходят в общий чат группы.
  const threadId = Number(process.env.TELEGRAM_THREAD_ID) || undefined;
  if (!token || !chatId) {
    console.error("lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const text = [
    "🔶 Заявка с сайта Reklama Centr",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Направление: ${serviceTitles[service]?.title || service || "—"}`,
    `Язык: ${locale}${page ? ` · страница ${page}` : ""}`,
    message ? `\n${message}` : "",
    file ? `\n📎 Файл: ${file.name}` : "",
  ].join("\n");

  const api = `https://api.telegram.org/bot${token}`;
  const sent = await fetch(`${api}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...(threadId ? { message_thread_id: threadId } : {}) }),
  });
  if (!sent.ok) {
    console.error("lead: telegram", sent.status, await sent.text());
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  if (file) {
    const out = new FormData();
    out.set("chat_id", chatId);
    if (threadId) out.set("message_thread_id", String(threadId));
    out.set("caption", `📎 ${name} · ${phone}`);
    out.set("document", file, file.name);
    const doc = await fetch(`${api}/sendDocument`, { method: "POST", body: out });
    if (!doc.ok) console.error("lead: telegram document", doc.status, await doc.text());
  }

  return NextResponse.json({ ok: true });
}
