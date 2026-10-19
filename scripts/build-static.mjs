// Сборка сайта для обычного PHP-хостинга (webname.uz, DirectAdmin): `node scripts/build-static.mjs`.
// Результат — папка deploy/ и архив deploy.zip: их содержимое заливается в корень сайта (public_html).
//
// Что происходит:
// 1. Проект копируется в .static-build/ без частей, которым нужен Node-сервер (middleware, app/api, [...rest]).
// 2. `next build` со STATIC_EXPORT=1 (см. next.config.mjs) складывает готовые страницы в out/.
// 3. out/ копируется в deploy/ вместе с PHP-формой и правилами Apache из scripts/static/,
//    данные Telegram-бота берутся из .env.local и кладутся в deploy/api/config.php.
//
// Запущенный `npm run dev` можно не останавливать: исходники и папка .next не затрагиваются.
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
// Сборка идёт в копии проекта: исходники не трогаем, а Windows не даёт двигать папки,
// которые держит запущенный dev-сервер. node_modules находятся уровнем выше — Node ищет их вверх по дереву.
const work = join(root, ".static-build");
const copy = ["app", "components", "lib", "messages", "public", "data", "i18n.ts", "next.config.mjs", "tailwind.config.ts", "postcss.config.mjs", "tsconfig.json", "package.json", "next-env.d.ts"];
// Частям, которым нужен Node-сервер, в копии не место: форма → Telegram (app/api) и «ловушка» несуществующих
// адресов [...rest] — их заменяют api/lead.php и .htaccess. middleware.ts не копируется вовсе.
const skip = [join("app", "api"), join("app", "[locale]", "[...rest]")];

rmSync(work, { recursive: true, force: true });
mkdirSync(work);
for (const item of copy) {
  if (!existsSync(join(root, item))) continue;
  cpSync(join(root, item), join(work, item), { recursive: true, filter: (src) => !skip.some((s) => src.endsWith(s)) });
}

// Вместо «ловушки» — обычная страница /404/ на каждом языке: Apache отдаёт её на любой несуществующий адрес.
mkdirSync(join(work, "app/[locale]/404"), { recursive: true });
writeFileSync(
  join(work, "app/[locale]/404/page.tsx"),
  `import { unstable_setRequestLocale } from "next-intl/server";
import NotFound from "../not-found";

export const metadata = { robots: { index: false } };

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <NotFound />;
}
`,
);

let ok = false;
try {
  execSync("npx next build", { cwd: work, stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" } });
  ok = true;
} finally {
  if (ok) {
    rmSync(join(root, "out"), { recursive: true, force: true });
    cpSync(join(work, "out"), join(root, "out"), { recursive: true });
  }
  rmSync(work, { recursive: true, force: true });
}

if (ok) {
  const deploy = join(root, "deploy");
  rmSync(deploy, { recursive: true, force: true });
  // Страницы русской версии лежат в out/ru/, но открываются без префикса (/about/) — это делает .htaccess.
  cpSync(join(root, "out"), deploy, { recursive: true });
  cpSync(join(root, "scripts/static"), deploy, { recursive: true });
  // Каталог: снимок данных для хостинга (api/catalog.php и /admin/ читают его, пока нет своего catalog.json).
  mkdirSync(join(deploy, "api/data"), { recursive: true });
  cpSync(join(root, "data/catalog.json"), join(deploy, "api/data/catalog.seed.json"));
  // Прототипы дизайна (v2 и др.) — только для показа заказчику на localhost, на боевой сайт не идут.
  rmSync(join(deploy, "prototypes"), { recursive: true, force: true });

  // Без middleware next-intl на сервере пишет ссылки русской версии с префиксом (/ru/about/); в браузере скрипты
  // их исправляют, но поисковики и посетители без JS увидели бы лишнюю переадресацию. Правим готовый HTML.
  const fixLinks = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) fixLinks(p);
      else if (f.endsWith(".html")) {
        const html = readFileSync(p, "utf8");
        const fixed = html.replace(/href="\/ru\/"/g, 'href="/"').replace(/href="\/ru\//g, 'href="/');
        if (fixed !== html) writeFileSync(p, fixed);
      }
    }
  };
  fixLinks(deploy);

  // Данные бота для PHP-формы — из .env.local (в git не попадает). Файл закрыт от скачивания правилами .htaccess.
  const env = existsSync(join(root, ".env.local")) ? readFileSync(join(root, ".env.local"), "utf8") : "";
  const val = (key) => (env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  const php = (v) => "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  if (val("TELEGRAM_BOT_TOKEN")) {
    const lines = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_THREAD_ID", "INSTAGRAM_TOKEN"].map((k) => `    '${k}' => ${php(val(k))},`);
    writeFileSync(join(deploy, "api/config.php"), ["<?php", "// Создано scripts/build-static.mjs из .env.local.", "return [", ...lines, "];", ""].join("\n"));
  } else {
    console.warn("Внимание: в .env.local нет TELEGRAM_BOT_TOKEN — форма заявок на сайте работать не будет.");
  }

  // Один архив для загрузки через «Файловый менеджер» DirectAdmin: загрузить в public_html и распаковать.
  const zip = join(root, "deploy.zip");
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${join(root, "scripts/zip.ps1")}" "${deploy}" "${zip}"`, { stdio: "inherit" });

  const size = (dir) => readdirSync(dir).reduce((s, f) => {
    const p = join(dir, f);
    return s + (statSync(p).isDirectory() ? size(p) : statSync(p).size);
  }, 0);
  console.log(`\nГотово: deploy/ (${(size(deploy) / 1024 / 1024).toFixed(1)} МБ) и deploy.zip — залить в корень сайта (public_html).`);
}
