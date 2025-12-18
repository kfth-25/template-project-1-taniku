<?php
require_once __DIR__ . '/../config/config.php';
setCORSHeaders();
try {
    $pdo = getDBConnection();
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NULL,
        email VARCHAR(120) NULL,
        password VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB');
    $sqlFile = __DIR__ . '/setup_orders.sql';
    if (!file_exists($sqlFile)) {
        jsonResponse(['ok' => false, 'error' => 'File setup_orders.sql tidak ditemukan'], 404);
    }
    $raw = file_get_contents($sqlFile);
    if ($raw === false) {
        jsonResponse(['ok' => false, 'error' => 'Gagal membaca setup_orders.sql'], 500);
    }
    $statements = array_filter(array_map(function($s){ return trim($s); }, explode(';', $raw)));
    $executed = 0;
    foreach ($statements as $stmt) {
        if ($stmt === '') continue;
        try {
            $pdo->exec($stmt);
            $executed++;
        } catch (Throwable $e) {}
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    $checks = ['orders', 'order_items', 'customers'];
    $missing = [];
    foreach ($checks as $t) {
        try {
            $pdo->query("SELECT 1 FROM `$t` LIMIT 1");
        } catch (Throwable $e) {
            $missing[] = $t;
        }
    }
    if ($missing) {
        jsonResponse(['ok' => false, 'error' => 'Tabel belum siap', 'missing' => $missing, 'executed' => $executed], 500);
    }
    jsonResponse(['ok' => true, 'message' => 'Setup orders selesai', 'executed' => $executed]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
