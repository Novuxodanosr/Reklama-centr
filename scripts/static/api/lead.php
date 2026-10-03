<?php
// Заявка с формы сайта → Telegram. PHP-двойник app/api/lead/route.ts для обычного хостинга (webname.uz).
// Сайт шлёт на /api/lead, .htaccess передаёт сюда. Данные бота — в api/config.php (шаблон: config.sample.php).

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok' => false]);

// Простейший лимит: не больше 5 заявок с одного IP за минуту (метки времени — во временном файле).
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$hitsFile = sys_get_temp_dir() . '/rc-lead-' . md5($ip);
$now = time();
$hits = array_filter(
    array_map('intval', @file($hitsFile, FILE_IGNORE_NEW_LINES) ?: []),
    fn($t) => $now - $t < 60
);
$hits[] = $now;
@file_put_contents($hitsFile, implode("\n", $hits));
if (count($hits) > 5) reply(429, ['ok' => false]);

// Форма шлёт multipart (с файлом), старые интеграции могут слать JSON.
$fields = $_POST;
if (!$fields && stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $fields = json_decode(file_get_contents('php://input'), true);
}
if (!is_array($fields)) reply(400, ['ok' => false]);

// Honeypot: заполненное скрытое поле — бот, отвечаем «успех» и молчим.
if (!empty($fields['company_url'])) reply(200, ['ok' => true]);

$cut = fn($key, $len) => mb_substr(trim((string)($fields[$key] ?? '')), 0, $len);
$name = $cut('name', 100);
$phone = $cut('phone', 40);
$service = $cut('service', 40);
$message = $cut('message', 2000);
$locale = mb_substr((string)($fields['locale'] ?? 'ru'), 0, 2);
$page = mb_substr((string)($fields['page'] ?? ''), 0, 200);

if ($name === '' || $phone === '') reply(422, ['ok' => false]);

$file = null;
if (!empty($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['file'];
    // UPLOAD_ERR_INI_SIZE/FORM_SIZE — файл больше лимита хостинга; для формы это та же ошибка «файл».
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 10 * 1024 * 1024 || !preg_match('/\.(pdf|jpe?g|png|webp|ai|cdr|eps|svg)$/i', $f['name'])) {
        reply(413, ['ok' => false, 'error' => 'file']);
    }
    $file = $f;
}

$configPath = __DIR__ . '/config.php';
$config = is_file($configPath) ? require $configPath : [];
$token = $config['TELEGRAM_BOT_TOKEN'] ?? '';
$chatId = $config['TELEGRAM_CHAT_ID'] ?? '';
$threadId = (int)($config['TELEGRAM_THREAD_ID'] ?? 0);
if ($token === '' || $chatId === '') {
    error_log('lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в api/config.php');
    reply(503, ['ok' => false]);
}

// Названия направлений для сообщения менеджерам (всегда по-русски, как в route.ts).
$titles = [
    'print' => 'Типография', 'promo' => 'Сувенирная продукция', 'textile' => 'Текстиль',
    'pos' => 'POS и торговое оборудование', 'exhibition' => 'Выставочные стенды', 'heraldry' => 'Геральдика',
    'outdoor' => 'Наружная реклама', 'interior' => 'Интерьерное оформление', 'custom' => 'Нестандартные проекты',
];

$text = implode("\n", array_filter([
    '🔶 Заявка с сайта Reklama Centr',
    "Имя: $name",
    "Телефон: $phone",
    'Направление: ' . ($titles[$service] ?? ($service !== '' ? $service : '—')),
    "Язык: $locale" . ($page !== '' ? " · страница $page" : ''),
    $message !== '' ? "\n$message" : null,
    $file ? "\n📎 Файл: " . $file['name'] : null,
], fn($line) => $line !== null));

function telegram(string $token, string $method, array $data): array {
    $ch = curl_init("https://api.telegram.org/bot$token/$method");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$status, $body];
}

$base = ['chat_id' => $chatId];
if ($threadId) $base['message_thread_id'] = $threadId;

[$status, $body] = telegram($token, 'sendMessage', $base + ['text' => $text]);
if ($status !== 200) {
    error_log("lead: telegram $status $body");
    reply(502, ['ok' => false]);
}

if ($file) {
    [$status, $body] = telegram($token, 'sendDocument', $base + [
        'caption' => "📎 $name · $phone",
        'document' => new CURLFile($file['tmp_name'], $file['type'] ?: 'application/octet-stream', $file['name']),
    ]);
    if ($status !== 200) error_log("lead: telegram document $status $body");
}

reply(200, ['ok' => true]);
