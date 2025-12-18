<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

try {
    $pdo = getDBConnection();

    // Check required tables exist
    $required = ['categories', 'products', 'product_images'];
    $missing = [];
    foreach ($required as $t) {
        try {
            $pdo->query("SELECT 1 FROM `$t` LIMIT 1");
        } catch (Throwable $e) {
            $missing[] = $t;
        }
    }

    $info = [
        'db' => DB_NAME,
        'host' => DB_HOST,
        'tables' => $required,
    ];

    if ($missing) {
        jsonResponse(['ok' => false, 'error' => 'Missing tables', 'missing' => $missing, 'info' => $info], 500);
    }

    // Counts for sanity
    $counts = [];
    foreach ($required as $t) {
        $stmt = $pdo->query("SELECT COUNT(*) AS c FROM `$t`");
        $counts[$t] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['c'];
    }

    jsonResponse(['ok' => true, 'info' => $info, 'counts' => $counts]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>