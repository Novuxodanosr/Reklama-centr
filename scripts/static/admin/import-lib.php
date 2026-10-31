<?php
// Импорт товаров из Excel в админке: прайс → строки → для каждой строки Claude ищет товар в интернете
// (официальный сайт производителя или крупный магазин), пишет тексты RU/EN/UZ и даёт адреса фото;
// фото скачиваются и ужимаются здесь же. Ключ Claude API хранится в api/data/secrets.json (закрыт от веба).
// Claude API вызывается обычным HTTP (curl): на хостинге нет composer, поэтому без SDK.
declare(strict_types=1);
if (!defined('CATALOG_DIR')) { http_response_code(404); exit; } // подключается только из admin/index.php
// На хостинге для этого домена PHP 7.4 — функций PHP 8 там нет, добавляем их сами.
if (!function_exists('str_contains')) { function str_contains(string $h, string $n): bool { return $n === '' || strpos($h, $n) !== false; } }
if (!function_exists('str_starts_with')) { function str_starts_with(string $h, string $n): bool { return strncmp($h, $n, strlen($n)) === 0; } }
define('IMPORT_DIR', CATALOG_DIR . '/imports');
define('SECRETS_FILE', CATALOG_DIR . '/secrets.json');
define('CLAUDE_MODEL', 'claude-opus-5-5');
// Ориентир для подсчёта расходов в админке, $ за 1 млн токенов и за 1000 поисков.
define('CLAUDE_PRICE', ['in' => 4.0, 'out' => 20.0, 'search' => 10.0]);

function secrets(): array { return is_file(SECRETS_FILE) ? (json_decode((string)file_get_contents(SECRETS_FILE), true) ?: []) : []; }
function secret_set(string $k, ?string $v): void {
    $s = secrets();
    if ($v === null || $v === '') unset($s[$k]); else $s[$k] = $v;
    file_put_contents(SECRETS_FILE, json_encode($s), LOCK_EX);
}
function mask_key(string $k): string { return strlen($k) > 12 ? substr($k, 0, 10) . '…' . substr($k, -4) : '…'; }

// --- Excel (.xlsx) без библиотек: первый лист, ячейки — строки ---------------------------------
function xlsx_rows(string $file): array {
    $zip = new ZipArchive();
    if ($zip->open($file) !== true) throw new RuntimeException('Не удалось открыть файл — нужен Excel .xlsx.');
    $shared = [];
    if (($xml = $zip->getFromName('xl/sharedStrings.xml')) !== false) {
        $sx = simplexml_load_string($xml);
        foreach ($sx->si as $si) {
            $t = isset($si->t) ? (string)$si->t : '';
            foreach ($si->r as $r) $t .= (string)$r->t;
            $shared[] = $t;
        }
    }
    // Первый лист по порядку в книге (не обязательно sheet1.xml).
    $sheet = 'xl/worksheets/sheet1.xml';
    $wb = $zip->getFromName('xl/workbook.xml'); $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
    if ($wb !== false && $rels !== false) {
        $w = simplexml_load_string($wb); $w->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $first = $w->sheets->sheet[0] ?? null;
        $rid = $first ? (string)$first->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships')['id'] : '';
        foreach (simplexml_load_string($rels)->Relationship as $rel) if ((string)$rel['Id'] === $rid) $sheet = 'xl/' . ltrim(preg_replace('#^/xl/#', '', (string)$rel['Target']), '/');
    }
    $xml = $zip->getFromName($sheet);
    $zip->close();
    if ($xml === false) throw new RuntimeException('В файле нет листа с данными.');
    $rows = [];
    foreach (simplexml_load_string($xml)->sheetData->row as $r) {
        $row = [];
        foreach ($r->c as $c) {
            $ref = (string)$c['r']; $col = 0;
            foreach (str_split(preg_replace('/\d+/', '', $ref)) as $ch) $col = $col * 26 + (ord($ch) - 64);
            $type = (string)$c['t'];
            $v = $type === 's' ? ($shared[(int)$c->v] ?? '') : ($type === 'inlineStr' ? (string)$c->is->t : (string)$c->v);
            $row[$col - 1] = trim(preg_replace('/\s+/u', ' ', $v));
        }
        if (array_filter($row, fn($x) => $x !== '')) {
            $max = max(array_keys($row)); $full = [];
            for ($i = 0; $i <= $max; $i++) $full[] = $row[$i] ?? '';
            $rows[] = $full;
        }
    }
    return $rows;
}

// Угадываем строку заголовков и столбцы по словам в заголовке и по виду значений.
function import_guess(array $rows): array {
    $head = -1; // -1 — заголовков нет, данные с первой строки
    foreach (array_slice($rows, 0, 10) as $i => $r) { if (count(array_filter($r, fn($x) => $x !== '' && !is_numeric(str_replace([',', ' '], ['.', ''], $x)))) >= 2) { $head = $i; break; } }
    $h = $head >= 0 ? array_map(fn($x) => mb_strtolower($x), $rows[$head]) : [];
    $data = array_slice($rows, $head + 1, 200);
    $cols = $rows ? max(array_map('count', $rows)) : 0;
    $map = ['title' => null, 'ean' => null, 'code' => null, 'cost' => null, 'qty' => null, 'brand' => null];
    $words = ['title' => '/назв|наимен|name|товар|product|описан/u', 'ean' => '/штрих|ean|barcode|bar code/u', 'code' => '/артик|код|sku|model|модел/u', 'cost' => '/цен|price|cost|себест|стоим|usd|\$/u', 'qty' => '/кол|qty|остат|шт|stock|amount/u', 'brand' => '/бренд|brand|марка|производ/u'];
    foreach ($words as $k => $re) for ($c = 0; $c < $cols; $c++) if ($map[$k] === null && !in_array($c, $map, true) && preg_match($re, $h[$c] ?? '')) $map[$k] = $c;
    $stat = function (int $c) use ($data) {
        $vals = array_values(array_filter(array_map(fn($r) => $r[$c] ?? '', $data), fn($x) => $x !== ''));
        $n = max(1, count($vals));
        return [
            'ean' => count(array_filter($vals, fn($x) => preg_match('/^\d{12,14}$/', $x))) / $n,
            'num' => count(array_filter($vals, fn($x) => is_numeric(str_replace([',', ' '], ['.', ''], $x)))) / $n,
            'dec' => count(array_filter($vals, fn($x) => preg_match('/^\d+[.,]\d+$/', $x))) / $n,
            'len' => array_sum(array_map('mb_strlen', $vals)) / $n,
        ];
    };
    $st = []; for ($c = 0; $c < $cols; $c++) $st[$c] = $stat($c);
    $free = fn() => array_values(array_filter(array_keys($st), fn($c) => !in_array($c, $map, true)));
    if ($map['ean'] === null) foreach ($free() as $c) if ($st[$c]['ean'] > .6) { $map['ean'] = $c; break; }
    if ($map['title'] === null) { $best = null; foreach ($free() as $c) if ($st[$c]['num'] < .3 && ($best === null || $st[$c]['len'] > $st[$best]['len'])) $best = $c; $map['title'] = $best; }
    if ($map['cost'] === null) foreach ($free() as $c) if ($st[$c]['dec'] > .3) { $map['cost'] = $c; break; }
    if ($map['qty'] === null) foreach ($free() as $c) if ($st[$c]['num'] > .8 && $st[$c]['ean'] < .2) { $map['qty'] = $c; break; }
    return ['head' => $head, 'map' => $map];
}

function import_rows(array $rows, int $head, array $map): array {
    $out = []; $n = 0;
    $num = fn($x) => is_numeric($v = str_replace([',', ' ', ' ', '$'], ['.', '', '', ''], (string)$x)) ? (float)$v : null;
    foreach (array_slice($rows, $head + 1) as $r) {
        $get = fn($k) => $map[$k] === null || $map[$k] === '' ? '' : trim((string)($r[(int)$map[$k]] ?? ''));
        $title = $get('title');
        if ($title === '') continue;
        $ean = preg_replace('/\D/', '', $get('ean'));
        // Штрихкод бывает прямо в названии: «CASE WIWU … 6977703658507».
        if ($ean === '' && preg_match('/(?<!\d)(\d{12,14})(?!\d)/', $title, $m)) { $ean = $m[1]; $title = trim(str_replace($m[1], '', $title)); }
        $out[] = ['n' => ++$n, 'title' => $title, 'ean' => $ean, 'code' => $get('code'), 'brand' => $get('brand'), 'cost' => $num($get('cost')), 'qty' => $num($get('qty'))];
    }
    return $out;
}

// --- Задания импорта: api/data/imports/<id>.json -------------------------------------------
function job_file(string $id): string { return IMPORT_DIR . '/' . preg_replace('/[^a-z0-9-]/', '', $id) . '.json'; }
function job_load(string $id): ?array { $f = job_file($id); return is_file($f) ? json_decode((string)file_get_contents($f), true) : null; }
function job_save(array $job): void { @mkdir(IMPORT_DIR, 0755, true); file_put_contents(job_file($job['id']), json_encode($job, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX); }
function job_list(): array {
    $jobs = [];
    foreach (glob(IMPORT_DIR . '/*.json') ?: [] as $f) { $j = json_decode((string)file_get_contents($f), true); if ($j) $jobs[] = $j; }
    usort($jobs, fn($a, $b) => strcmp($b['created'], $a['created']));
    return $jobs;
}

// --- Claude API -------------------------------------------------------------------------------
function claude_request(string $key, array $body): array {
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 280, CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_HTTPHEADER => array_merge(['content-type: application/json', 'anthropic-version: 2026-10-21', 'anthropic-beta: server-side-fallback-2026-07-01'], claude_auth($key, secrets()['claude_auth'] ?? 'x-api-key', secrets()['claude_ws'] ?? '')),
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $err = curl_error($ch); curl_close($ch);
    if ($res === false) throw new RuntimeException('Нет связи с Claude API: ' . $err);
    $j = json_decode((string)$res, true);
    if ($code !== 200) {
        $msg = $j['error']['message'] ?? substr((string)$res, 0, 300);
        if ($code === 401) $msg = 'Ключ Claude API не подходит — проверьте его в «Настройках».';
        elseif ($code === 429) $msg = 'Слишком много запросов к Claude — подождите минуту и продолжите.';
        elseif ($code === 400 && stripos($msg, 'credit') !== false) $msg = 'На балансе Claude API закончились деньги — пополните в console.anthropic.com.';
        throw new RuntimeException("Claude API ($code): $msg");
    }
    return $j;
}

// Способ передачи ключа: обычный ключ — заголовком x-api-key; если API его так не принял,
// пробуем как Bearer-токен (ключи нового вида из Console). Рабочий способ запоминается в secrets.json.
// Ключ на всю организацию (не привязан к рабочему пространству) требует ID пространства в заголовке.
function claude_auth(string $key, string $mode, string $ws = ''): array {
    $h = $mode === 'bearer' ? ['authorization: Bearer ' . $key] : ['x-api-key: ' . $key];
    if ($ws !== '') $h[] = 'anthropic-workspace-id: ' . $ws;
    return $h;
}
function claude_models(string $key, string $mode, string $ws = ''): array {
    $ch = curl_init('https://api.anthropic.com/v1/models?limit=1');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => array_merge(['anthropic-version: 2026-10-21'], claude_auth($key, $mode, $ws))]);
    $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $err = curl_error($ch); curl_close($ch);
    return [$code, $res === false ? null : (json_decode((string)$res, true)['error']['message'] ?? substr((string)$res, 0, 200)), $err];
}
// Проверка ключа: список моделей — бесплатный запрос. Возвращает [причина или '', способ].
function claude_check_key(string $key, string $ws = ''): array {
    $key = preg_replace('/\s+/', '', $key);
    if (strpos($key, '...') !== false || strpos($key, '…') !== false) return ['это сокращённый ключ из списка — полный показывается только при создании, создайте новый', ''];
    $why = [];
    foreach (['x-api-key', 'bearer'] as $mode) {
        [$code, $msg, $err] = claude_models($key, $mode, $ws);
        if ($code === 400 && stripos((string)$msg, 'workspace') !== false) return ['ключ рабочий, но он на всю организацию — впишите ниже ID рабочего пространства (Console → Workspaces → Default, начинается с wrkspc_) или создайте ключ внутри пространства Default', ''];
        if ($code === 200) return ['', $mode];
        if ($code === 0) return ['хостинг не может связаться с Claude API (' . $err . ')', ''];
        $why[] = "$code: $msg";
    }
    return ['Claude API ответил ' . implode(' / ', array_unique($why)), ''];
}
// Связь хостинга с Claude без ключа: 401 значит «сервер доступен».
function claude_reachable(): string {
    [$code, , $err] = claude_models('none', 'x-api-key');
    return $code === 0 ? 'нет связи с Claude API: ' . $err : '';
}

function claude_find_product(string $key, array $row, array $cats, string $brand): array {
    $catList = implode("\n", array_map(fn($c) => "- {$c['id']}: {$c['title']}", $cats));
    $system = <<<TXT
You prepare product cards for the online catalog of a shop in Tashkent, Uzbekistan. You get one line from a price list. Find exactly this product on the internet - preferably on the manufacturer's official website, otherwise on a large retailer - and describe it.

Rules:
- Match the exact model and variant (model code, capacity, size, color). If the barcode or model code can be checked, check it. If you cannot confirm the exact model, still fill in what you found but set "confident" to false and say why in "note" - in Russian, one or two short sentences for the shop owner (what exactly is unconfirmed).
- Write only facts you saw on the product page. Do not invent specifications.
- Never mention suppliers, price lists, purchase prices or other shops in the texts.
- Texts in three languages: Russian (ru), English (en), Uzbek in Latin script (uz). The title is the brand + product name + model code, without color unless the line names one.
- "short": one sentence for the product card. "features": 3-6 short points. "specs": 4-10 key characteristics (key in three languages, value as a string; translate the value only if it is words).
- "image_urls": direct links to image files of this exact product from its page (product photos, best quality available), up to 6, main photo first. No banners, logos, icons, payment badges, lifestyle collages with text, or photos of other models.
- "category_id": the best fitting id from the list below, or "" if none fits.

Categories:
$catList

Answer with one JSON object and nothing else:
{"found": bool, "confident": bool, "note": string, "brand": string, "model_code": string, "source_url": string,
 "title": {"ru": "", "en": "", "uz": ""}, "short": {"ru": "", "en": "", "uz": ""},
 "features": {"ru": [], "en": [], "uz": []}, "specs": [{"k": {"ru": "", "en": "", "uz": ""}, "v": ""}],
 "included": [{"ru": "", "en": "", "uz": ""}], "image_urls": [], "category_id": ""}
TXT;
    $line = "Price list line: {$row['title']}";
    if ($row['code'] !== '') $line .= "\nModel code: {$row['code']}";
    if ($row['ean'] !== '') $line .= "\nBarcode (EAN): {$row['ean']}";
    $b = $row['brand'] !== '' ? $row['brand'] : $brand;
    if ($b !== '') $line .= "\nBrand: $b";
    $messages = [['role' => 'user', 'content' => $line]];
    $body = [
        'model' => CLAUDE_MODEL, 'max_tokens' => 16000, 'system' => $system,
        'output_config' => ['effort' => 'medium'], 'fallbacks' => 'default',
        'tools' => [['type' => 'web_search_20260209', 'name' => 'web_search', 'max_uses' => 5], ['type' => 'web_fetch_20260209', 'name' => 'web_fetch', 'max_uses' => 4]],
    ];
    $usage = ['in' => 0, 'out' => 0, 'search' => 0];
    for ($turn = 0; $turn < 5; $turn++) {
        $res = claude_request($key, $body + ['messages' => $messages]);
        $u = $res['usage'] ?? [];
        $usage['in'] += (int)($u['input_tokens'] ?? 0) + (int)($u['cache_read_input_tokens'] ?? 0) + (int)($u['cache_creation_input_tokens'] ?? 0);
        $usage['out'] += (int)($u['output_tokens'] ?? 0);
        $usage['search'] += (int)($u['server_tool_use']['web_search_requests'] ?? 0);
        if (($res['stop_reason'] ?? '') === 'refusal') throw new RuntimeException('Claude отказался обрабатывать эту строку.');
        if (($res['stop_reason'] ?? '') !== 'pause_turn') break;
        // Длинный поиск: возвращаем ответ как есть, сервер продолжит с того же места.
        $messages = [$messages[0], ['role' => 'assistant', 'content' => $res['content']]];
    }
    $text = '';
    foreach ($res['content'] ?? [] as $blk) if (($blk['type'] ?? '') === 'text') $text .= $blk['text'];
    $a = strpos($text, '{'); $z = strrpos($text, '}');
    $j = $a !== false && $z !== false ? json_decode(substr($text, $a, $z - $a + 1), true) : null;
    if (!is_array($j)) throw new RuntimeException('Claude не вернул описание товара.');
    $j['_usage'] = $usage;
    return $j;
}

function usage_cost(array $u): float { $p = CLAUDE_PRICE; return $u['in'] / 1e6 * $p['in'] + $u['out'] / 1e6 * $p['out'] + $u['search'] / 1000 * $p['search']; }

// --- Фото: с найденной страницы и из ответа Claude, проверка размера, WebP ----------------------
function http_get(string $url, int $max = 15_000_000): ?string {
    if (!preg_match('#^https?://#i', $url)) return null;
    $ch = curl_init($url);
    $buf = '';
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => false, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 5, CURLOPT_TIMEOUT => 30, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$buf, $max) { $buf .= $chunk; return strlen($buf) > $max ? 0 : strlen($chunk); },
    ]);
    $ok = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    return $ok && $code === 200 ? $buf : null;
}

function page_images(string $url): array {
    $out = [];
    // Магазины на Shopify отдают товар в JSON: /products/<handle>.js — там все фото в полном размере.
    if (preg_match('~^(https?://[^/]+/(?:[a-z-]+/)?products/[^/?#]+)~i', $url, $m) && ($js = http_get($m[1] . '.js', 3_000_000))) {
        foreach ((json_decode($js, true)['images'] ?? []) as $u) $out[] = str_starts_with($u, '//') ? 'https:' . $u : $u;
    }
    if (!$out && ($html = http_get($url, 5_000_000))) {
        if (preg_match_all('#<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)#i', $html, $mm)) $out = array_merge($out, $mm[1]);
    }
    return $out;
}

function save_remote_images(array $urls, string $id, int $limit = 6): array {
    @mkdir(CATALOG_IMG_DIR, 0755, true);
    $saved = []; $seen = [];
    foreach ($urls as $u) {
        if (count($saved) >= $limit) break;
        $u = html_entity_decode(trim((string)$u));
        if ($u === '' || isset($seen[$u])) continue;
        $seen[$u] = true;
        $bin = http_get($u);
        if (!$bin || !($info = @getimagesizefromstring($bin))) continue;
        [$w, $hh] = $info;
        if (min($w, $hh) < 300 || max($w, $hh) / max(1, min($w, $hh)) > 2.2) continue; // мелочь и баннеры не берём
        $hash = md5($bin); if (isset($seen[$hash])) continue; $seen[$hash] = true;
        $im = @imagecreatefromstring($bin); if (!$im) continue;
        $scale = min(1, 1200 / max($w, $hh)); $nw = (int)round($w * $scale); $nh = (int)round($hh * $scale);
        $out = imagecreatetruecolor($nw, $nh);
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $im, 0, 0, 0, 0, $nw, $nh, $w, $hh);
        $file = $id . '-' . (count($saved) + 1) . (function_exists('imagewebp') ? '.webp' : '.jpg');
        function_exists('imagewebp') ? imagewebp($out, CATALOG_IMG_DIR . '/' . $file, 84) : imagejpeg($out, CATALOG_IMG_DIR . '/' . $file, 86);
        imagedestroy($im); imagedestroy($out);
        $saved[] = CATALOG_IMG_URL . '/' . $file;
    }
    return $saved;
}

function slug(string $s): string { return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s)), '-'); }

// Одна строка прайса → товар в каталоге. Возвращает результат для таблицы задания.
function import_process_row(array &$data, array $job, array $row, string $key): array {
    $o = $job['options'];
    $brand = $row['brand'] !== '' ? $row['brand'] : (string)$o['brand'];
    $id = substr(slug($brand ?: 'item') ?: 'item', 0, 20) . '-' . ($row['ean'] !== '' ? $row['ean'] : substr(md5(mb_strtolower($row['title'])), 0, 10));
    $old = null; foreach ($data['products'] as $p) if ($p['id'] === $id) $old = $p;
    if ($old && !empty($o['skipExisting'])) return ['status' => 'skip', 'id' => $id, 'msg' => 'уже есть в каталоге'];
    $cats = [];
    foreach ($data['categories'] as $c) if ($c['parent']) $cats[] = ['id' => $c['id'], 'title' => $c['title']['ru'] ?? $c['id']];
    $j = claude_find_product($key, $row, $cats, $brand);
    $cost = usage_cost($j['_usage']);
    if (empty($j['found'])) return ['status' => 'error', 'id' => $id, 'msg' => 'не найден: ' . ($j['note'] ?? ''), 'cost' => $cost];
    // Сначала фото, которые Claude выбрал под этот вариант, затем остальные со страницы товара.
    $urls = array_merge((array)($j['image_urls'] ?? []), !empty($j['source_url']) ? page_images((string)$j['source_url']) : []);
    $images = save_remote_images($urls, $id);
    if (!$images && $old) $images = $old['images'];
    $catIds = array_column($cats, 'id');
    $category = $o['category'] !== '' ? $o['category'] : (in_array($j['category_id'] ?? '', $catIds, true) ? $j['category_id'] : ($old['category'] ?? ($catIds[0] ?? '')));
    $L = fn($v) => ['ru' => trim((string)($v['ru'] ?? '')), 'en' => trim((string)($v['en'] ?? '')), 'uz' => trim((string)($v['uz'] ?? ''))];
    $specs = [['k' => ['ru' => 'Бренд', 'en' => 'Brand', 'uz' => 'Brend'], 'v' => $j['brand'] ?: $brand]];
    foreach ((array)($j['specs'] ?? []) as $s) if (!empty($s['k']['ru'])) $specs[] = ['k' => $L($s['k']), 'v' => (string)($s['v'] ?? '')];
    if ($row['ean'] !== '') $specs[] = ['k' => ['ru' => 'Штрихкод', 'en' => 'Barcode (EAN)', 'uz' => 'Shtrixkod'], 'v' => $row['ean']];
    $confident = !empty($j['confident']);
    $p = [
        'id' => $id, 'category' => $category,
        'codes' => array_values(array_unique(array_filter([trim((string)($j['model_code'] ?? '')) ?: $row['code'], $row['ean']]))),
        'title' => $L($j['title'] ?? []), 'short' => $L($j['short'] ?? []),
        'features' => ['ru' => array_values((array)($j['features']['ru'] ?? [])), 'en' => array_values((array)($j['features']['en'] ?? [])), 'uz' => array_values((array)($j['features']['uz'] ?? []))],
        'specs' => $specs, 'included' => array_map($L, (array)($j['included'] ?? [])), 'images' => $images,
        'unit' => 'pcs', 'brand' => ($j['brand'] ?? '') ?: ($brand ?: null),
        'availability' => $o['availability'], 'leadTime' => $old['leadTime'] ?? null, 'badges' => $old['badges'] ?? [],
        'minQty' => $o['availability'] === 'stock' ? 1 : null,
        'costUsd' => $row['cost'], 'markup' => $o['markup'] === '' ? ($old['markup'] ?? null) : ['mode' => 'pct', 'value' => (float)$o['markup']],
        'price' => $old['price'] ?? null,
        // На сайт сразу — только уверенно найденный товар с фото и только если так выбрано; остальное — скрытый черновик.
        'published' => $old ? !empty($old['published']) : (!empty($o['publish']) && $confident && $images),
        'order' => $old['order'] ?? (max(array_merge([0], array_column($data['products'], 'order'))) + 1),
    ];
    if ($old) { foreach ($data['products'] as &$q) if ($q['id'] === $id) $q = $p; unset($q); } else $data['products'][] = $p;
    $why = [];
    if (!$confident) $why[] = 'модель не подтверждена' . (!empty($j['note']) ? ': ' . $j['note'] : '');
    if (!$images) $why[] = 'нет фото';
    return ['status' => $p['published'] ? 'ok' : 'draft', 'id' => $id, 'title' => $p['title']['ru'], 'img' => $images[0] ?? '', 'msg' => implode('; ', $why) ?: ($p['published'] ? 'на сайте' : 'черновик'), 'cost' => $cost, 'source' => (string)($j['source_url'] ?? '')];
}
