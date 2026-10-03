<?php
// Скопировать этот файл в config.php (в той же папке api/) и вписать данные бота из .env.local.
// config.php в сборку не попадает и закрыт от скачивания правилами .htaccess.
return [
    'TELEGRAM_BOT_TOKEN' => '',
    'TELEGRAM_CHAT_ID'   => '',
    // Тема «ЗАЯВКИ» в группе «Менеджеры»; пусто — сообщения идут в общий чат группы.
    'TELEGRAM_THREAD_ID' => '',
    // Ключ Instagram API (Instagram Login) для работ из Instagram — api/instagram.php.
    'INSTAGRAM_TOKEN' => '',
];
