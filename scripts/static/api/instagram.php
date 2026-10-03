<?php
// Работы из Instagram @reklama.centr.uz → JSON для страницы «Работы» (components/WorksGrid.tsx).
// Сайт запрашивает /api/instagram, .htaccess передаёт сюда.
//
// Правила (02–03.10.2026, заказчик):
// - на сайт попадают только посты с хештегом направления (карта ниже); первый найденный хештег решает направление;
// - только посты не старше IG_SINCE — более ранние работы уже есть в портфолио вручную (без дублей);
// - видео (Reels) не берём — только фото и карусели.
// Ключ доступа — INSTAGRAM_TOKEN в api/config.php; раз в неделю продлевается сам и хранится в api/data/ig-token.json.
// Ответ кэшируется на 30 минут; если Instagram недоступен — отдаём последнюю удачную подборку.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

const IG_SINCE = '2026-10-03';
const CACHE_TTL = 1800;
const TOKEN_REFRESH_EVERY = 7 * 86400;

// Хештег (без #, в нижнем регистре) → направление сайта (lib/services.ts).
const TAGS = [
    'наружнаяреклама' => 'outdoor', 'вывески' => 'outdoor', 'вывеска' => 'outdoor', 'световыебуквы' => 'outdoor',
    'объемныебуквы' => 'outdoor', 'крышнаяустановка' => 'outdoor', 'стела' => 'outdoor', 'фасад' => 'outdoor',
    'интерьернаяреклама' => 'interior', 'интерьер' => 'interior', 'навигация' => 'interior',
    'выставочныйстенд' => 'exhibition', 'стенды' => 'exhibition', 'стенд' => 'exhibition',
    'pos' => 'pos', 'торговоеоборудование' => 'pos', 'промостойка' => 'pos',
    'сувениры' => 'promo', 'мерч' => 'promo', 'корпоративныеподарки' => 'promo', 'сувенирнаяпродукция' => 'promo',
    'текстиль' => 'textile', 'футболки' => 'textile',
    'полиграфия' => 'print', 'типография' => 'print', 'печать' => 'print',
    'геральдика' => 'heraldry', 'награды' => 'heraldry', 'наградыташкент' => 'heraldry', 'значки' => 'heraldry',
    'нестандартныепроекты' => 'custom', 'артобъект' => 'custom',
];

$dataDir = __DIR__ . '/data';
$imgDir = dirname(__DIR__) . '/ig';
@mkdir($dataDir, 0755, true);
@mkdir($imgDir, 0755, true);
$cacheFile = "$dataDir/ig.json";
$tokenFile = "$dataDir/ig-token.json";

function out(string $json): void { echo $json; exit; }

if (is_file($cacheFile) && time() - filemtime($cacheFile) < CACHE_TTL) out(file_get_contents($cacheFile));
$stale = is_file($cacheFile) ? file_get_contents($cacheFile) : '[]';

function http_get(string $url): ?array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200 || !$body) { error_log("instagram: $status " . substr((string)$body, 0, 300)); return null; }
    return json_decode($body, true);
}

// Ключ: сохранённый продлённый — или исходный из config.php.
$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$saved = is_file($tokenFile) ? json_decode(file_get_contents($tokenFile), true) : null;
$token = $saved['token'] ?? ($config['INSTAGRAM_TOKEN'] ?? '');
if ($token === '') out($stale);

// Долгоживущий ключ действует 60 дней; продлеваем раз в неделю, пока он жив.
if (!$saved || time() - ($saved['refreshed'] ?? 0) > TOKEN_REFRESH_EVERY) {
    $r = http_get('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' . urlencode($token));
    if (!empty($r['access_token'])) {
        $token = $r['access_token'];
        file_put_contents($tokenFile, json_encode(['token' => $token, 'refreshed' => time()]));
    }
}

$fields = 'id,caption,media_type,media_url,permalink,timestamp,children{media_type,media_url}';
$feed = http_get("https://graph.instagram.com/me/media?fields=$fields&limit=50&access_token=" . urlencode($token));
if (!$feed || !isset($feed['data'])) out($stale);

// Фото сохраняем у себя: ссылки Instagram со временем перестают работать.
function local_image(string $url, string $name, string $imgDir): ?string {
    $file = "$imgDir/$name.jpg";
    if (!is_file($file)) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_FOLLOWLOCATION => true]);
        $bin = curl_exec($ch);
        $ok = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
        curl_close($ch);
        if (!$ok || !$bin) return null;
        file_put_contents($file, $bin);
    }
    return "/ig/$name.jpg";
}

$works = [];
$keep = [];
foreach ($feed['data'] as $post) {
    if (($post['media_type'] ?? '') === 'VIDEO') continue;
    if (substr($post['timestamp'] ?? '', 0, 10) < IG_SINCE) continue;
    $caption = (string)($post['caption'] ?? '');
    preg_match_all('/#([\p{L}\p{N}_]+)/u', mb_strtolower($caption), $m);
    $service = null;
    foreach ($m[1] as $tag) if (isset(TAGS[$tag])) { $service = TAGS[$tag]; break; }
    if (!$service) continue;

    $id = preg_replace('/\D/', '', $post['id']);
    $urls = [];
    if (($post['media_type'] ?? '') === 'CAROUSEL_ALBUM') {
        foreach ($post['children']['data'] ?? [] as $child) if (($child['media_type'] ?? '') === 'IMAGE') $urls[] = $child['media_url'];
    } else {
        $urls[] = $post['media_url'];
    }
    $images = [];
    foreach (array_slice($urls, 0, 20) as $n => $url) {
        $local = local_image($url, "$id-$n", $imgDir);
        if ($local) { $images[] = $local; $keep[] = basename($local); }
    }
    if (!$images) continue;

    // Название — первая строка подписи без хештегов и эмодзи-флагов, до 70 знаков.
    $first = trim(preg_replace('/#[\p{L}\p{N}_]+/u', '', strtok($caption, "\n") ?: ''));
    $title = mb_substr(rtrim($first, " .—-"), 0, 70) ?: 'Новая работа';

    $works[] = [
        'id' => "ig-$id",
        'service' => $service,
        'title' => $title,
        'client' => 'Instagram',
        'image' => $images[0],
        'gallery' => array_slice($images, 1),
        'link' => $post['permalink'] ?? null,
    ];
}

// Фото удалённых из Instagram постов больше не храним.
foreach (glob("$imgDir/*.jpg") ?: [] as $file) if (!in_array(basename($file), $keep, true)) @unlink($file);

$json = json_encode($works, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
file_put_contents($cacheFile, $json);
out($json);
