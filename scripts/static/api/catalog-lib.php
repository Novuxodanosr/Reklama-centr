<?php
// Общие функции каталога для api/catalog.php и admin/index.php.
define('CATALOG_DIR', __DIR__ . '/data');
define('CATALOG_FILE', CATALOG_DIR . '/catalog.json');
define('CATALOG_SEED', CATALOG_DIR . '/catalog.seed.json');
define('CATALOG_IMG_DIR', dirname(__DIR__) . '/catalog-img');   // загруженные в админке фото → /catalog-img/...
define('CATALOG_IMG_URL', '/catalog-img');

function catalog_load(): array {
    @mkdir(CATALOG_DIR, 0755, true);
    $file = is_file(CATALOG_FILE) ? CATALOG_FILE : CATALOG_SEED;
    $data = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    if (!is_array($data)) $data = ['settings' => [], 'categories' => [], 'products' => []];
    $data['settings'] += ['showPrices' => true, 'currency' => 'usd', 'usdRate' => 12300, 'markupMode' => 'pct', 'markupValue' => 30, 'priceStep' => 0.5, 'minQty' => 50];
    if ($data['settings']['currency'] !== 'uzs') $data['settings']['currency'] = 'usd';
    if (isset($data['settings']['markupPct']) && !isset($data['settings']['markupValue'])) $data['settings']['markupValue'] = $data['settings']['markupPct'];
    // Старое поле priceUzs (цена в сумах) → price.
    foreach ($data['products'] as &$p) {
        if (!array_key_exists('price', $p)) $p['price'] = $p['priceUzs'] ?? null;
        unset($p['priceUzs']);
    }
    unset($p);
    return $data;
}

function catalog_currency_label(array $s): string { return ($s['currency'] ?? 'usd') === 'uzs' ? 'сум' : '$'; }
function catalog_format_price(array $s, ?float $n): string {
    if (!$n) return '—';
    return ($s['currency'] ?? 'usd') === 'uzs' ? number_format((int)$n, 0, '', ' ') . ' сум' : rtrim(rtrim(number_format($n, 2, ',', ' '), '0'), ',') . ' $';
}

// Сохранение с блокировкой и дневной резервной копией (api/data/backup/catalog-ГГГГ-ММ-ДД.json).
function catalog_save(array $data): void {
    @mkdir(CATALOG_DIR . '/backup', 0755, true);
    $backup = CATALOG_DIR . '/backup/catalog-' . date('Y-m-d') . '.json';
    if (is_file(CATALOG_FILE) && !is_file($backup)) copy(CATALOG_FILE, $backup);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    file_put_contents(CATALOG_FILE, $json, LOCK_EX);
}

// Публичная форма: без costUsd, только опубликованные, по порядку. Та же логика — в lib/catalog.ts.
function catalog_public(array $data): array {
    $s = $data['settings'];
    $cats = $data['categories'];
    usort($cats, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    $prods = array_values(array_filter($data['products'], fn($p) => !empty($p['published'])));
    usort($prods, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    // Цена, не введённая вручную, считается по формуле из себестоимости (как в lib/catalog.ts).
    foreach ($prods as &$p) {
        if (($p['price'] ?? null) === null) $p['price'] = catalog_price($s, isset($p['costUsd']) ? (float)$p['costUsd'] : null, $p['markup'] ?? null);
        unset($p['costUsd'], $p['markup']);
    }
    unset($p);
    return [
        'settings' => ['showPrices' => (bool)$s['showPrices'], 'currency' => $s['currency'], 'priceStep' => (float)$s['priceStep'], 'minQty' => (int)$s['minQty']],
        'categories' => $cats,
        'products' => $prods,
    ];
}

// Цена из себестоимости: в долларах база = себестоимость, в сумах — себестоимость × курс; затем наценка товара
// (если задана) или общая — в % или суммой в валюте цен; округление вверх до шага (0.5 $ или 1000 сум).
function catalog_price(array $s, ?float $costUsd, ?array $markup = null): ?float {
    if (!$costUsd) return null;
    $mode = $markup['mode'] ?? $s['markupMode'] ?? 'pct';
    $value = (float)($markup['value'] ?? $s['markupValue'] ?? 0);
    $base = ($s['currency'] ?? 'usd') === 'uzs' ? $costUsd * (float)$s['usdRate'] : $costUsd;
    $price = $mode === 'abs' ? $base + $value : $base * (1 + $value / 100);
    $step = (float)($s['priceStep'] ?? 0) > 0 ? (float)$s['priceStep'] : 1;
    return round(ceil($price / $step - 1e-9) * $step, 2);
}
