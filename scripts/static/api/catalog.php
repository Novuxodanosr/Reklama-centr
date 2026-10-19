<?php
// Публичный каталог для сайта: /api/catalog (см. .htaccess). Отдаёт data/catalog.json без себестоимости
// и без скрытых товаров. Источник: api/data/catalog.json (правится в /admin/), пока его нет — catalog.seed.json из сборки.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

require __DIR__ . '/catalog-lib.php';
$data = catalog_load();
echo json_encode(catalog_public($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
