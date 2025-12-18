<?php
// Reset products: truncate tables so IDs start from 1, then run seeding
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

try {
    $pdo = getDBConnection();

    // Disable FKs to allow truncation order
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');

    // Truncate child first, then parent tables
    $pdo->exec('TRUNCATE TABLE product_images');
    $pdo->exec('TRUNCATE TABLE products');
    $pdo->exec('TRUNCATE TABLE categories');

    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');

    // Now trigger seeding to reinsert pupuk & obat products and copy assets
    $seedUrl = sprintf('http://%s/database/seed_products.php', $_SERVER['HTTP_HOST'] ?? 'localhost:5176');
    $seedRaw = @file_get_contents($seedUrl);
    if ($seedRaw === false) {
        jsonResponse(['ok' => false, 'error' => 'Gagal menjalankan seeding. Pastikan server PHP aktif di port 5176.'], 500);
    }
    $seed = json_decode($seedRaw, true);
    if (!is_array($seed) || empty($seed['ok'])) {
        jsonResponse(['ok' => false, 'error' => 'Seeding gagal atau respons tidak valid', 'seed_response' => $seedRaw], 500);
    }

    // Report current AUTO_INCREMENT after reset & seeding
    $statusStmt = $pdo->query("SHOW TABLE STATUS LIKE 'products'");
    $status = $statusStmt->fetch(PDO::FETCH_ASSOC);
    $nextId = isset($status['Auto_increment']) ? (int)$status['Auto_increment'] : null;

    jsonResponse([
        'ok' => true,
        'reset' => true,
        'seeded' => true,
        'inserted' => $seed['inserted'] ?? null,
        'next_id' => $nextId,
        'message' => 'Reset selesai: ID kembali dari 1, data pupuk & obat diisi ulang.'
    ]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>