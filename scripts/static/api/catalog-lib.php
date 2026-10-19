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
    $data['settings'] += ['showPrices' => false, 'usdRate' => 12300, 'markupPct' => 60, 'priceStep' => 1000, 'minQty' => 50];
    return $data;
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
    foreach ($prods as &$p) unset($p['costUsd']);
    return [
        'settings' => ['showPrices' => (bool)$s['showPrices'], 'priceStep' => (int)$s['priceStep'], 'minQty' => (int)$s['minQty']],
        'categories' => $cats,
        'products' => $prods,
    ];
}

// Цена из себестоимости: USD × курс × (1 + наценка) с округлением до шага.
function catalog_price(array $s, ?float $costUsd): ?int {
    if (!$costUsd) return null;
    $step = max(1, (int)$s['priceStep']);
    return (int)(ceil($costUsd * (float)$s['usdRate'] * (1 + (float)$s['markupPct'] / 100) / $step) * $step);
}
