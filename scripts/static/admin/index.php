<?php
// Админка каталога: https://reklama-centr.uz/admin/ — товары, цены, фото, категории, настройки.
// Данные: api/data/catalog.json (резервные копии — api/data/backup/). Пароль задаётся при первом входе
// и хранится хешем в api/data/admin.json. Один файл, без библиотек.
declare(strict_types=1);
session_name('rc_admin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
require dirname(__DIR__) . '/api/catalog-lib.php';
define('ADMIN_FILE', CATALOG_DIR . '/admin.json');
define('LANGS', ['ru' => 'Русский', 'en' => 'English', 'uz' => 'O‘zbekcha']);

function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function csrf(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(16)); }
function check_csrf(): void { if (($_POST['csrf'] ?? '') !== ($_SESSION['csrf'] ?? null)) { http_response_code(403); exit('Сессия устарела — откройте страницу заново.'); } }
function redirect(string $to): never { header('Location: ' . $to); exit; }
function flash(string $msg): void { $_SESSION['flash'] = $msg; }
function admin_conf(): ?array { return is_file(ADMIN_FILE) ? json_decode((string)file_get_contents(ADMIN_FILE), true) : null; }

$action = $_GET['a'] ?? 'list';
$conf = admin_conf();

// --- Вход -----------------------------------------------------------------
if ($action === 'logout') { session_destroy(); redirect('./'); }
if (!$conf) {
    // Первый запуск: задать пароль (только с этого экрана; повторно — удалить api/data/admin.json).
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_password'])) {
        $p = (string)$_POST['new_password'];
        if (mb_strlen($p) < 8) { $err = 'Пароль не короче 8 знаков.'; }
        elseif ($p !== ($_POST['new_password2'] ?? '')) { $err = 'Пароли не совпадают.'; }
        else {
            @mkdir(CATALOG_DIR, 0755, true);
            file_put_contents(ADMIN_FILE, json_encode(['hash' => password_hash($p, PASSWORD_DEFAULT), 'created' => date('c')]));
            $_SESSION['auth'] = true; redirect('./');
        }
    }
    page_start('Первый вход');
    echo '<div class="card login"><h1>Админка каталога</h1><p class="muted">Пароль ещё не задан. Придумайте пароль для входа (не короче 8 знаков).</p>';
    if (!empty($err)) echo '<p class="err">' . h($err) . '</p>';
    echo '<form method="post"><label>Новый пароль<input type="password" name="new_password" required minlength="8" autocomplete="new-password"></label><label>Ещё раз<input type="password" name="new_password2" required minlength="8" autocomplete="new-password"></label><button class="btn">Сохранить и войти</button></form></div>';
    page_end(); exit;
}
if (empty($_SESSION['auth'])) {
    $lockFile = CATALOG_DIR . '/admin-attempts.json';
    $att = is_file($lockFile) ? json_decode((string)file_get_contents($lockFile), true) : ['n' => 0, 't' => 0];
    if ($att['n'] >= 5 && time() - $att['t'] < 900) { $err = 'Слишком много попыток. Подождите 15 минут.'; }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
        if (password_verify((string)$_POST['password'], $conf['hash'])) { @unlink($lockFile); session_regenerate_id(true); $_SESSION['auth'] = true; redirect('./'); }
        $att = ['n' => (time() - $att['t'] < 900 ? $att['n'] : 0) + 1, 't' => time()];
        file_put_contents($lockFile, json_encode($att));
        sleep(1); $err = 'Неверный пароль.';
    }
    page_start('Вход');
    echo '<div class="card login"><h1>Админка каталога</h1>';
    if (!empty($err)) echo '<p class="err">' . h($err) . '</p>';
    echo '<form method="post"><label>Пароль<input type="password" name="password" required autocomplete="current-password" autofocus></label><button class="btn">Войти</button></form></div>';
    page_end(); exit;
}

// --- Данные -----------------------------------------------------------------
$data = catalog_load();
$find = fn(string $id) => array_values(array_filter($data['products'], fn($p) => $p['id'] === $id))[0] ?? null;
$l10n = fn($v) => is_array($v) ? ($v['ru'] ?? reset($v)) : (string)$v;
$catTitle = function (string $id) use ($data): string { foreach ($data['categories'] as $c) if ($c['id'] === $id) return $c['title']['ru'] ?? $id; return $id; };

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $post = $action;
    if ($post === 'save-product') {
        $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($_POST['id'] ?? '')));
        if ($id === '') $id = 'p' . substr(md5((string)microtime(true)), 0, 6);
        $p = $find($id) ?? ['id' => $id, 'images' => [], 'order' => count($data['products']) + 1];
        $lines = fn(string $s) => array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $s)), fn($x) => $x !== ''));
        foreach (['title', 'short'] as $f) foreach (LANGS as $l => $_) $p[$f][$l] = trim((string)($_POST[$f][$l] ?? ''));
        foreach (LANGS as $l => $_) $p['features'][$l] = $lines((string)($_POST['features'][$l] ?? ''));
        // Характеристики: строки «Название | значение» на каждом языке; значение общее, если во всех языках одинаково.
        $specs = [];
        $rows = [];
        foreach (LANGS as $l => $_) $rows[$l] = $lines((string)($_POST['specs'][$l] ?? ''));
        $n = max(array_map('count', $rows));
        for ($i = 0; $i < $n; $i++) {
            $k = []; $v = [];
            foreach (LANGS as $l => $_) { [$kk, $vv] = array_pad(explode('|', $rows[$l][$i] ?? ($rows['ru'][$i] ?? ''), 2), 2, ''); $k[$l] = trim($kk); $v[$l] = trim($vv); }
            if ($k['ru'] === '' && $v['ru'] === '') continue;
            $specs[] = ['k' => $k, 'v' => count(array_unique($v)) === 1 ? $v['ru'] : $v];
        }
        $p['specs'] = $specs;
        $inc = [];
        foreach (LANGS as $l => $_) $rows[$l] = $lines((string)($_POST['included'][$l] ?? ''));
        $n = max(array_map('count', $rows));
        for ($i = 0; $i < $n; $i++) { $row = []; foreach (LANGS as $l => $_) $row[$l] = $rows[$l][$i] ?? ($rows['ru'][$i] ?? ''); $inc[] = $row; }
        $p['included'] = $inc;
        $p['category'] = (string)($_POST['category'] ?? '');
        $p['codes'] = $lines(str_replace(',', "\n", (string)($_POST['codes'] ?? '')));
        $p['costUsd'] = ($_POST['costUsd'] ?? '') === '' ? null : (float)str_replace(',', '.', (string)$_POST['costUsd']);
        $p['price'] = ($_POST['price'] ?? '') === '' ? null : (float)str_replace([',', ' ', ' '], ['.', '', ''], (string)$_POST['price']);
        $p['published'] = !empty($_POST['published']);
        $p['unit'] = ($_POST['unit'] ?? 'pcs') === 'm2' ? 'm2' : 'pcs';
        $av = (string)($_POST['availability'] ?? '');
        $p['availability'] = in_array($av, ['stock', 'order', 'none'], true) ? $av : null;
        $p['leadTime'] = trim((string)($_POST['leadTime'] ?? '')) ?: null;
        $p['badges'] = array_values(array_intersect(['new', 'hit', 'sale'], (array)($_POST['badges'] ?? [])));
        $p['markup'] = ($_POST['markupValue'] ?? '') === '' ? null : ['mode' => ($_POST['markupMode'] ?? 'pct') === 'abs' ? 'abs' : 'pct', 'value' => (float)str_replace(',', '.', (string)$_POST['markupValue'])];
        $p['order'] = (int)($_POST['order'] ?? $p['order']);
        // Фото: порядок и удаление
        $keep = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', (string)($_POST['images'] ?? ''))), fn($x) => $x !== ''));
        foreach ($p['images'] as $old) if (!in_array($old, $keep, true) && str_starts_with($old, CATALOG_IMG_URL . '/')) @unlink(dirname(__DIR__) . $old);
        $p['images'] = $keep;
        // Загрузка новых фото (несколько), уменьшение до 1200 px через GD
        if (!empty($_FILES['photos']['name'][0])) {
            @mkdir(CATALOG_IMG_DIR, 0755, true);
            foreach ($_FILES['photos']['tmp_name'] as $i => $tmp) {
                if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                $url = save_image($tmp, $id);
                if ($url) $p['images'][] = $url;
            }
        }
        $found = false;
        foreach ($data['products'] as &$q) if ($q['id'] === $id) { $q = $p; $found = true; }
        unset($q);
        if (!$found) $data['products'][] = $p;
        catalog_save($data); flash('Сохранено: ' . ($p['title']['ru'] ?: $id)); redirect('?a=edit&id=' . $id);
    }
    if ($post === 'delete-product') {
        $id = (string)($_POST['id'] ?? '');
        $data['products'] = array_values(array_filter($data['products'], fn($p) => $p['id'] !== $id));
        catalog_save($data); flash('Товар удалён.'); redirect('./');
    }
    if ($post === 'toggle') {
        $id = (string)($_POST['id'] ?? '');
        foreach ($data['products'] as &$q) if ($q['id'] === $id) $q['published'] = empty($q['published']);
        unset($q); catalog_save($data); redirect('./' . (isset($_POST['back']) ? '?' . $_POST['back'] : ''));
    }
    if ($post === 'settings') {
        $s = &$data['settings'];
        $s['showPrices'] = !empty($_POST['showPrices']);
        $s['currency'] = ($_POST['currency'] ?? 'usd') === 'uzs' ? 'uzs' : 'usd';
        $s['usdRate'] = (float)str_replace(',', '.', (string)$_POST['usdRate']);
        $s['markupMode'] = ($_POST['markupMode'] ?? 'pct') === 'abs' ? 'abs' : 'pct';
        $s['markupValue'] = (float)str_replace(',', '.', (string)$_POST['markupValue']);
        unset($s['markupPct']);
        $step = (float)str_replace(',', '.', (string)$_POST['priceStep']);
        $s['priceStep'] = $step > 0 ? $step : ($s['currency'] === 'uzs' ? 1000 : 0.5);
        $s['minQty'] = max(1, (int)$_POST['minQty']);
        unset($s);
        if (!empty($_POST['recalc'])) {
            // Сбрасываем ручные цены: сайт и выгрузка считают цену по формуле сами, когда она не задана.
            $n = 0;
            foreach ($data['products'] as &$q) { if (($q['price'] ?? null) !== null) { $q['price'] = null; $n++; } }
            unset($q); flash("Настройки сохранены, $n ручных цен сброшены — теперь все цены по формуле.");
        } else flash('Настройки сохранены.');
        catalog_save($data); redirect('?a=settings');
    }
    if ($post === 'categories') {
        $cats = [];
        foreach ((array)($_POST['cat'] ?? []) as $row) {
            $cid = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($row['id'] ?? '')));
            if ($cid === '' || !empty($row['delete'])) continue;
            $cats[] = ['id' => $cid, 'parent' => ($row['parent'] ?? '') === '' ? null : (string)$row['parent'], 'title' => ['ru' => trim((string)$row['ru']), 'en' => trim((string)$row['en']), 'uz' => trim((string)$row['uz'])], 'order' => (int)($row['order'] ?? 0)];
        }
        $data['categories'] = $cats; catalog_save($data); flash('Категории сохранены.'); redirect('?a=categories');
    }
    if ($post === 'change-password') {
        if (!password_verify((string)$_POST['old'], $conf['hash'])) flash('Старый пароль неверный.');
        elseif (mb_strlen((string)$_POST['new']) < 8) flash('Новый пароль не короче 8 знаков.');
        else { file_put_contents(ADMIN_FILE, json_encode(['hash' => password_hash((string)$_POST['new'], PASSWORD_DEFAULT), 'created' => $conf['created'] ?? date('c')])); flash('Пароль изменён.'); }
        redirect('?a=settings');
    }
}

// Сохранение фото: GD уменьшает до 1200 px по длинной стороне; формат — WebP, если поддерживается, иначе JPEG.
function save_image(string $tmp, string $id): ?string {
    $info = @getimagesize($tmp);
    if (!$info || !function_exists('imagecreatefromstring')) {
        $ext = strtolower(pathinfo((string)($_FILES['photos']['name'][0] ?? 'x.jpg'), PATHINFO_EXTENSION)) ?: 'jpg';
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) return null;
        $name = $id . '-' . substr(md5((string)microtime(true)), 0, 6) . '.' . $ext;
        return move_uploaded_file($tmp, CATALOG_IMG_DIR . '/' . $name) ? CATALOG_IMG_URL . '/' . $name : null;
    }
    $im = @imagecreatefromstring((string)file_get_contents($tmp));
    if (!$im) return null;
    [$w, $hgt] = [imagesx($im), imagesy($im)];
    $max = 1200; $scale = min(1, $max / max($w, $hgt));
    $nw = (int)round($w * $scale); $nh = (int)round($hgt * $scale);
    $out = imagecreatetruecolor($nw, $nh);
    $white = imagecolorallocate($out, 255, 255, 255); imagefill($out, 0, 0, $white);
    imagecopyresampled($out, $im, 0, 0, 0, 0, $nw, $nh, $w, $hgt);
    $base = $id . '-' . substr(md5((string)microtime(true)), 0, 6);
    if (function_exists('imagewebp')) { $file = "$base.webp"; imagewebp($out, CATALOG_IMG_DIR . '/' . $file, 86); }
    else { $file = "$base.jpg"; imagejpeg($out, CATALOG_IMG_DIR . '/' . $file, 86); }
    imagedestroy($im); imagedestroy($out);
    return CATALOG_IMG_URL . '/' . $file;
}

// --- Страницы ---------------------------------------------------------------
function page_start(string $title): void {
    echo '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' . h($title) . ' — Reklama Centr</title><style>
:root{--bg:#0B0B0D;--card:#131316;--line:rgba(255,255,255,.1);--text:#F5F4F0;--mist:#A6A6AD;--dim:#6E6E76;--accent:#E4142F}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,Segoe UI,Roboto,sans-serif}
a{color:#fff}.wrap{max-width:1180px;margin:0 auto;padding:20px}
header.top{display:flex;gap:18px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--line);flex-wrap:wrap}
header.top b{font-size:17px}header.top nav a{margin-right:14px;color:var(--mist);text-decoration:none}header.top nav a.on,header.top nav a:hover{color:#fff}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:16px}
.login{max-width:420px;margin:60px auto}h1{font-size:24px;margin:0 0 10px}h2{font-size:18px;margin:0 0 10px}
label{display:block;font-size:13px;color:var(--mist);margin:10px 0 4px}input[type=text],input[type=number],input[type=password],select,textarea{width:100%;background:#0B0B0D;border:1px solid var(--line);color:#fff;border-radius:9px;padding:9px 11px;font:inherit}
textarea{min-height:92px;resize:vertical}.btn{display:inline-block;background:var(--accent);color:#fff;border:0;border-radius:999px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none}
.btn.ghost{background:transparent;border:1px solid var(--line)}.btn.sm{padding:6px 12px;font-size:13px}.muted{color:var(--mist)}.err{color:#FF2D48}.flash{background:rgba(228,20,47,.15);border:1px solid rgba(228,20,47,.4);padding:10px 14px;border-radius:10px;margin-bottom:14px}
table{width:100%;border-collapse:collapse}td,th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle;font-size:14px}th{color:var(--mist);font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.thumb{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:8px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media(max-width:900px){.grid3{grid-template-columns:1fr}}
.tabs{display:flex;gap:6px;margin:8px 0}.tabs button{background:transparent;border:1px solid var(--line);color:var(--mist);border-radius:999px;padding:6px 12px;cursor:pointer}.tabs button.on{border-color:var(--accent);color:#fff}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;border:1px solid var(--line);color:var(--mist)}.pill.on{border-color:#2ecc71;color:#2ecc71}
.imgs{display:flex;flex-wrap:wrap;gap:10px}.imgs figure{margin:0;width:120px}.imgs img{width:120px;height:120px;object-fit:contain;background:#fff;border-radius:10px}.imgs input{width:100%;font-size:11px;margin-top:4px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}.toolbar input,.toolbar select{width:auto;min-width:200px}
</style></head><body>';
}
function page_end(): void { echo '</body></html>'; }
function nav(string $cur): void {
    $items = ['list' => 'Товары', 'new' => '+ Новый товар', 'categories' => 'Категории', 'settings' => 'Настройки и цены'];
    echo '<header class="top"><b>Reklama Centr · каталог</b><nav>';
    foreach ($items as $k => $v) echo '<a href="?a=' . $k . '" class="' . ($cur === $k ? 'on' : '') . '">' . $v . '</a>';
    echo '<a href="/catalog/" target="_blank">Открыть сайт ↗</a><a href="?a=logout">Выйти</a></nav></header><div class="wrap">';
    if (!empty($_SESSION['flash'])) { echo '<div class="flash">' . h($_SESSION['flash']) . '</div>'; unset($_SESSION['flash']); }
}
$C = csrf();

if ($action === 'list') {
    $q = trim((string)($_GET['q'] ?? '')); $cat = (string)($_GET['cat'] ?? '');
    $rows = array_filter($data['products'], function ($p) use ($q, $cat, $l10n) {
        if ($cat !== '' && $p['category'] !== $cat) return false;
        if ($q === '') return true;
        $hay = mb_strtolower($l10n($p['title']) . ' ' . implode(' ', $p['codes'] ?? []) . ' ' . $p['id']);
        return str_contains($hay, mb_strtolower($q));
    });
    usort($rows, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    page_start('Товары'); nav('list');
    echo '<form class="toolbar" method="get"><input type="hidden" name="a" value="list"><input type="text" name="q" placeholder="Поиск по названию или коду" value="' . h($q) . '"><select name="cat"><option value="">Все категории</option>';
    foreach ($data['categories'] as $c) if ($c['parent']) echo '<option value="' . h($c['id']) . '"' . ($cat === $c['id'] ? ' selected' : '') . '>' . h($c['title']['ru']) . '</option>';
    echo '</select><button class="btn ghost sm">Найти</button><span class="muted">Всего: ' . count($rows) . ' · Цены на сайте: ' . ($data['settings']['showPrices'] ? '<span class="pill on">показаны</span>' : '<span class="pill">скрыты</span>') . '</span></form>';
    echo '<div class="card"><table><tr><th></th><th>Название</th><th>Код</th><th>Категория</th><th>Цена, ' . catalog_currency_label($data['settings']) . '</th><th>Статус</th><th></th></tr>';
    foreach ($rows as $p) {
        echo '<tr><td>' . ($p['images'][0] ?? '' ? '<img class="thumb" src="' . h($p['images'][0]) . '" alt="">' : '') . '</td>';
        echo '<td><a href="?a=edit&id=' . h($p['id']) . '">' . h($l10n($p['title']) ?: $p['id']) . '</a></td><td class="muted">' . h(implode(', ', $p['codes'] ?? [])) . '</td><td class="muted">' . h($catTitle($p['category'])) . '</td>';
        $pr = ($p['price'] ?? null) !== null ? (float)$p['price'] : catalog_price($data['settings'], !empty($p['costUsd']) ? (float)$p['costUsd'] : null, $p['markup'] ?? null);
        echo '<td>' . ($pr ? h(catalog_format_price($data['settings'], $pr)) . (($p['price'] ?? null) === null ? '' : ' <span class="muted" title="введена вручную">✎</span>') : '<span class="muted">—</span>') . '</td>';
        echo '<td><form method="post" action="?a=toggle"><input type="hidden" name="csrf" value="' . $C . '"><input type="hidden" name="id" value="' . h($p['id']) . '"><input type="hidden" name="back" value="' . h(http_build_query(['a' => 'list', 'q' => $q, 'cat' => $cat])) . '"><button class="pill ' . (!empty($p['published']) ? 'on' : '') . '" style="cursor:pointer;background:none">' . (!empty($p['published']) ? 'на сайте' : 'скрыт') . '</button></form></td>';
        echo '<td><a class="btn ghost sm" href="?a=edit&id=' . h($p['id']) . '">Изменить</a></td></tr>';
    }
    echo '</table></div>'; page_end(); exit;
}

if ($action === 'edit' || $action === 'new') {
    $p = $action === 'edit' ? $find((string)($_GET['id'] ?? '')) : null;
    if ($action === 'edit' && !$p) { flash('Товар не найден.'); redirect('./'); }
    $p ??= ['id' => '', 'category' => $data['categories'][1]['id'] ?? '', 'codes' => [], 'title' => [], 'short' => [], 'features' => [], 'specs' => [], 'included' => [], 'images' => [], 'costUsd' => null, 'price' => null, 'published' => true, 'order' => count($data['products']) + 1];
    $specLines = function (string $l) use ($p): string {
        $out = [];
        foreach ($p['specs'] as $s) { $k = is_array($s['k']) ? ($s['k'][$l] ?? $s['k']['ru'] ?? '') : $s['k']; $v = is_array($s['v']) ? ($s['v'][$l] ?? $s['v']['ru'] ?? '') : $s['v']; $out[] = "$k | $v"; }
        return implode("\n", $out);
    };
    $inclLines = fn(string $l) => implode("\n", array_map(fn($s) => is_array($s) ? ($s[$l] ?? $s['ru'] ?? '') : $s, $p['included']));
    $suggest = catalog_price($data['settings'], $p['costUsd'] ? (float)$p['costUsd'] : null, $p['markup'] ?? null);
    $mk = $p['markup'] ?? null;
    page_start($p['id'] ? 'Товар ' . $p['id'] : 'Новый товар'); nav($action === 'new' ? 'new' : 'list');
    echo '<form method="post" action="?a=save-product" enctype="multipart/form-data"><input type="hidden" name="csrf" value="' . $C . '"><input type="hidden" name="id" value="' . h($p['id']) . '">';
    echo '<div class="card"><h1>' . ($p['id'] ? h($l10n($p['title']) ?: $p['id']) : 'Новый товар') . '</h1><div class="grid3">';
    echo '<div><label>Категория<select name="category">'; foreach ($data['categories'] as $c) if ($c['parent']) echo '<option value="' . h($c['id']) . '"' . ($p['category'] === $c['id'] ? ' selected' : '') . '>' . h($c['title']['ru']) . '</option>'; echo '</select></label>';
    echo '<label>Коды модели (через запятую)<input type="text" name="codes" value="' . h(implode(', ', $p['codes'])) . '"></label><label>Порядок в списке<input type="number" name="order" value="' . (int)$p['order'] . '"></label></div>';
    echo '<div><label>Себестоимость, USD (видно только здесь)<input type="text" name="costUsd" value="' . h((string)($p['costUsd'] ?? '')) . '"></label>';
    $cur = catalog_currency_label($data['settings']);
    echo '<label>Наценка этого товара (пусто — общая из настроек)<div style="display:flex;gap:6px"><input type="text" name="markupValue" value="' . h((string)($mk['value'] ?? '')) . '" placeholder="' . h((string)$data['settings']['markupValue']) . '"><select name="markupMode" style="width:120px"><option value="pct"' . (($mk['mode'] ?? $data['settings']['markupMode']) === 'pct' ? ' selected' : '') . '>%</option><option value="abs"' . (($mk['mode'] ?? $data['settings']['markupMode']) === 'abs' ? ' selected' : '') . '>' . $cur . '</option></select></div></label>';
    echo '<label>Цена на сайте, ' . $cur . ' («от»; пусто — по формуле)<div style="display:flex;gap:6px"><input type="text" name="price" id="price" value="' . h(($p['price'] ?? null) === null ? '' : (string)$p['price']) . '" placeholder="' . ($suggest ? h((string)$suggest) : '') . '"><select name="unit" style="width:120px"><option value="pcs"' . (($p['unit'] ?? 'pcs') === 'pcs' ? ' selected' : '') . '>за шт.</option><option value="m2"' . (($p['unit'] ?? '') === 'm2' ? ' selected' : '') . '>за м²</option></select></div></label>';
    if ($suggest) echo '<p class="muted" style="margin:6px 0 0">По формуле (' . ($data['settings']['currency'] === 'uzs' ? 'курс ' . h((string)$data['settings']['usdRate']) . ', ' : '') . 'наценка ' . h((string)($mk['value'] ?? $data['settings']['markupValue'])) . (($mk['mode'] ?? $data['settings']['markupMode']) === 'abs' ? ' ' . $cur : '%') . '): ' . h(catalog_format_price($data['settings'], $suggest)) . ' — так и показывается на сайте, пока поле цены пустое.</p>';
    echo '</div><div><label style="display:flex;gap:8px;align-items:center;margin-top:28px"><input type="checkbox" name="published" ' . (!empty($p['published']) ? 'checked' : '') . '> Показывать на сайте</label>';
    $av = $p['availability'] ?? '';
    echo '<label>Наличие<select name="availability">';
    foreach (['' => '— не показывать', 'stock' => 'В наличии', 'order' => 'Под заказ', 'none' => 'Нет в наличии'] as $k => $v) echo '<option value="' . $k . '"' . ($av === $k ? ' selected' : '') . '>' . $v . '</option>';
    echo '</select></label><label>Срок под заказ, дней (например 10–15)<input type="text" name="leadTime" value="' . h((string)($p['leadTime'] ?? '')) . '"></label>';
    echo '<div style="display:flex;gap:14px;margin:6px 0 10px">';
    foreach (['new' => 'Новинка', 'hit' => 'Хит', 'sale' => 'Акция'] as $k => $v) echo '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="badges[]" value="' . $k . '"' . (in_array($k, $p['badges'] ?? [], true) ? ' checked' : '') . '> ' . $v . '</label>';
    echo '</div>';
    echo '<p class="muted">Фото: до 1200 px, WebP/JPG/PNG. Первое — главное. Чтобы удалить — сотрите строку ниже.</p></div></div></div>';

    echo '<div class="card"><h2>Фото</h2><div class="imgs">';
    foreach ($p['images'] as $src) echo '<figure><img src="' . h($src) . '" alt=""></figure>';
    echo '</div><label>Список фото (по одному адресу в строке; порядок = порядок на сайте)<textarea name="images">' . h(implode("\n", $p['images'])) . '</textarea></label><label>Добавить фото<input type="file" name="photos[]" multiple accept="image/*"></label></div>';

    echo '<div class="card"><h2>Тексты</h2><div class="tabs">'; foreach (LANGS as $l => $n) echo '<button type="button" data-lang="' . $l . '" class="' . ($l === 'ru' ? 'on' : '') . '">' . $n . '</button>'; echo '</div>';
    foreach (LANGS as $l => $n) {
        echo '<div class="lang" data-lang="' . $l . '"' . ($l !== 'ru' ? ' style="display:none"' : '') . '>';
        echo '<label>Название<input type="text" name="title[' . $l . ']" value="' . h($p['title'][$l] ?? '') . '"></label>';
        echo '<label>Короткое описание (карточка)<textarea name="short[' . $l . ']" style="min-height:60px">' . h($p['short'][$l] ?? '') . '</textarea></label>';
        echo '<label>Особенности (по одной в строке)<textarea name="features[' . $l . ']">' . h(implode("\n", $p['features'][$l] ?? [])) . '</textarea></label>';
        echo '<label>Характеристики (строка: Название | Значение)<textarea name="specs[' . $l . ']" style="min-height:160px">' . h($specLines($l)) . '</textarea></label>';
        echo '<label>В комплекте (по одной в строке)<textarea name="included[' . $l . ']" style="min-height:60px">' . h($inclLines($l)) . '</textarea></label></div>';
    }
    echo '</div><p><button class="btn">Сохранить</button> <a class="btn ghost" href="./">Назад к списку</a>';
    if ($p['id']) echo ' <button class="btn ghost" formaction="?a=delete-product" onclick="return confirm(\'Удалить товар?\')">Удалить</button>';
    echo '</p></form><script>document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("on",x===b));document.querySelectorAll(".lang").forEach(d=>d.style.display=d.dataset.lang===b.dataset.lang?"":"none")})</script>';
    page_end(); exit;
}

if ($action === 'categories') {
    page_start('Категории'); nav('categories');
    echo '<form method="post" action="?a=categories"><input type="hidden" name="csrf" value="' . $C . '"><div class="card"><table><tr><th>ID (латиницей)</th><th>Родитель</th><th>Русский</th><th>English</th><th>O‘zbekcha</th><th>Порядок</th><th>Удалить</th></tr>';
    $rows = $data['categories']; for ($k = 1; $k <= 3; $k++) $rows[] = ['id' => '', 'parent' => null, 'title' => [], 'order' => count($data['categories']) + $k];
    foreach ($rows as $i => $c) {
        echo '<tr><td><input type="text" name="cat[' . $i . '][id]" value="' . h($c['id']) . '"></td><td><select name="cat[' . $i . '][parent]"><option value="">— раздел —</option>';
        foreach ($data['categories'] as $pc) if (!$pc['parent']) echo '<option value="' . h($pc['id']) . '"' . (($c['parent'] ?? '') === $pc['id'] ? ' selected' : '') . '>' . h($pc['title']['ru']) . '</option>';
        echo '</select></td>';
        foreach (['ru', 'en', 'uz'] as $l) echo '<td><input type="text" name="cat[' . $i . '][' . $l . ']" value="' . h($c['title'][$l] ?? '') . '"></td>';
        echo '<td><input type="number" name="cat[' . $i . '][order]" value="' . (int)$c['order'] . '" style="width:70px"></td><td>' . ($c['id'] ? '<input type="checkbox" name="cat[' . $i . '][delete]">' : '<span class="muted">новая</span>') . '</td></tr>';
    }
    echo '</table><p class="muted">Раздел — строка без родителя (например «Наружная реклама»), подраздел — с родителем; товары лежат в подразделах. Чтобы добавить раздел и сразу подразделы к нему: сначала сохраните раздел, затем добавьте подразделы. Товары ссылаются на ID подраздела; меняя ID, перепривяжите товары. Новые подразделы появляются на сайте сразу, отдельная страница раздела — после пересборки сайта.</p></div><button class="btn">Сохранить</button></form>';
    page_end(); exit;
}

if ($action === 'settings') {
    $s = $data['settings'];
    page_start('Настройки'); nav('settings');
    echo '<form method="post" action="?a=settings"><input type="hidden" name="csrf" value="' . $C . '"><div class="card"><h2>Цены</h2><div class="grid3">';
    $cur = catalog_currency_label($s);
    echo '<div><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="showPrices" ' . ($s['showPrices'] ? 'checked' : '') . '> Показывать цены на сайте</label><p class="muted">Выключено — вместо цены «Цена по запросу».</p>';
    echo '<label>Валюта цен на сайте<select name="currency"><option value="usd"' . ($s['currency'] === 'usd' ? ' selected' : '') . '>Доллары США (оплата в сумах по курсу на день оплаты)</option><option value="uzs"' . ($s['currency'] === 'uzs' ? ' selected' : '') . '>Сумы (себестоимость × курс)</option></select></label></div>';
    echo '<div><label>Наценка к себестоимости (общая)<div style="display:flex;gap:6px"><input type="text" name="markupValue" value="' . h((string)$s['markupValue']) . '"><select name="markupMode" style="width:120px"><option value="pct"' . ($s['markupMode'] === 'pct' ? ' selected' : '') . '>%</option><option value="abs"' . ($s['markupMode'] === 'abs' ? ' selected' : '') . '>' . $cur . '</option></select></div></label>';
    echo '<label>Курс доллара, сум (нужен только для цен в сумах)<input type="text" name="usdRate" value="' . h((string)$s['usdRate']) . '"></label></div>';
    echo '<div><label>Округление цены вверх, ' . $cur . '<input type="text" name="priceStep" value="' . h((string)$s['priceStep']) . '"></label><label>Минимальный тираж, шт.<input type="number" name="minQty" value="' . (int)$s['minQty'] . '"></label></div></div>';
    echo '<p class="muted">Цена товара = себестоимость' . ($s['currency'] === 'uzs' ? ' × курс' : '') . ' + наценка (общая или своя у товара), округлённая вверх до шага. Считается автоматически у всех товаров, где поле «Цена на сайте» пустое. Себестоимость и наценки на сайт не уходят.</p>';
    echo '<p><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="recalc"> Сбросить цены, введённые вручную, чтобы все товары считались по формуле.</label></p><button class="btn">Сохранить</button></div></form>';
    echo '<form method="post" action="?a=change-password"><input type="hidden" name="csrf" value="' . $C . '"><div class="card"><h2>Пароль</h2><div class="grid3"><label>Старый<input type="password" name="old" required></label><label>Новый (от 8 знаков)<input type="password" name="new" required minlength="8"></label><div><br><button class="btn ghost">Сменить пароль</button></div></div></div></form>';
    echo '<div class="card"><h2>Данные</h2><p class="muted">Файл каталога: api/data/catalog.json · резервные копии: api/data/backup/ (по одной на день). <a href="?a=export">Скачать catalog.json</a></p></div>';
    page_end(); exit;
}

if ($action === 'export') {
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="catalog-' . date('Y-m-d') . '.json"');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT); exit;
}
redirect('./');
