<?php
// Seeder: Import products from assets folder into taniku_db

require_once __DIR__ . '/../config/config.php';

function ensureCategory(PDO $pdo, string $name, string $slug, string $description): int {
    $stmt = $pdo->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return (int)$row['id'];
    }
    $stmt = $pdo->prepare('INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :description)');
    $stmt->execute([':name' => $name, ':slug' => $slug, ':description' => $description]);
    return (int)$pdo->lastInsertId();
}

function ensureProduct(PDO $pdo, array $p): int {
    // Check by SKU for idempotent seeding
    $find = $pdo->prepare('SELECT id FROM products WHERE sku = :sku LIMIT 1');
    $find->execute([':sku' => $p['sku']]);
    $row = $find->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $id = (int)$row['id'];
        // Update basic fields to keep data fresh
        $upd = $pdo->prepare('UPDATE products SET name=:name, category_id=:category_id, description=:description, price=:price, stock=:stock, status=:status WHERE id=:id');
        $upd->execute([
            ':name' => $p['name'],
            ':category_id' => $p['category_id'],
            ':description' => $p['description'],
            ':price' => $p['price'],
            ':stock' => $p['stock'],
            ':status' => $p['status'],
            ':id' => $id,
        ]);
        return $id;
    }
    $ins = $pdo->prepare('INSERT INTO products (name, sku, category_id, description, price, stock, status) VALUES (:name, :sku, :category_id, :description, :price, :stock, :status)');
    $ins->execute([
        ':name' => $p['name'],
        ':sku' => $p['sku'],
        ':category_id' => $p['category_id'],
        ':description' => $p['description'],
        ':price' => $p['price'],
        ':stock' => $p['stock'],
        ':status' => $p['status'],
    ]);
    return (int)$pdo->lastInsertId();
}

function upsertImage(PDO $pdo, int $productId, string $path, string $alt, int $isPrimary = 0): void {
    // If an image with same path exists, update alt/primary; otherwise insert
    $find = $pdo->prepare('SELECT id FROM product_images WHERE product_id=:pid AND path=:path LIMIT 1');
    $find->execute([':pid' => $productId, ':path' => $path]);
    $row = $find->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $upd = $pdo->prepare('UPDATE product_images SET alt_text=:alt, is_primary=:is_primary WHERE id=:id');
        $upd->execute([':alt' => $alt, ':is_primary' => $isPrimary, ':id' => $row['id']]);
        return;
    }
    // If marking primary, demote others
    if ($isPrimary === 1) {
        $pdo->prepare('UPDATE product_images SET is_primary=0 WHERE product_id=:pid')->execute([':pid' => $productId]);
    }
    $ins = $pdo->prepare('INSERT INTO product_images (product_id, path, alt_text, is_primary) VALUES (:pid, :path, :alt, :is_primary)');
    $ins->execute([':pid' => $productId, ':path' => $path, ':alt' => $alt, ':is_primary' => $isPrimary]);
}

function titleFromFilename(string $prefix, string $basename): string {
    // e.g., pupuk10.png => Pupuk 10; obat.png => Obat Tanaman
    $namePart = preg_replace('/\.(png|jpg|jpeg|gif)$/i', '', $basename);
    $digits = preg_replace('/[^0-9]/', '', $namePart);
    if ($prefix === 'pupuk') {
        return 'Pupuk' . ($digits !== '' ? ' ' . $digits : '');
    }
    if ($prefix === 'obat') {
        return 'Obat Tanaman' . ($digits !== '' ? ' ' . $digits : '');
    }
    return ucfirst($prefix);
}

function skuFromPrefix(string $prefix, string $basename): string {
    $digits = preg_replace('/[^0-9]/', '', preg_replace('/\.(png|jpg|jpeg|gif)$/i', '', $basename));
    $num = $digits !== '' ? str_pad($digits, 3, '0', STR_PAD_LEFT) : '000';
    return strtoupper("SKU-$prefix-$num");
}

try {
    $pdo = getDBConnection();
    $pdo->beginTransaction();

    $catPupuk = ensureCategory($pdo, 'Pupuk', 'pupuk', 'Berbagai jenis pupuk untuk tanaman');
    $catObat = ensureCategory($pdo, 'Obat Tanaman', 'obat-tanaman', 'Produk untuk perlindungan dan kesehatan tanaman');

    $assetsDir = realpath(__DIR__ . '/../../assets');
    if (!$assetsDir) {
        throw new RuntimeException('Folder assets tidak ditemukan.');
    }

    // Ensure backend can serve assets: use backend/assets as web root for images
    $backendAssetsDir = realpath(__DIR__ . '/../assets');
    if (!$backendAssetsDir) {
        // Create backend/assets if it doesn't exist
        $backendAssetsDir = __DIR__ . '/../assets';
        if (!is_dir($backendAssetsDir)) {
            if (!mkdir($backendAssetsDir, 0777, true) && !is_dir($backendAssetsDir)) {
                throw new RuntimeException('Gagal membuat folder backend/assets');
            }
        }
    }

    $patterns = [
        ['prefix' => 'pupuk', 'glob' => $assetsDir . DIRECTORY_SEPARATOR . 'pupuk*.png', 'category_id' => $catPupuk],
        ['prefix' => 'obat',  'glob' => $assetsDir . DIRECTORY_SEPARATOR . 'obat*.png',  'category_id' => $catObat],
    ];

    $inserted = 0;
    foreach ($patterns as $pat) {
        $files = glob($pat['glob']);
        foreach ($files as $file) {
            $basename = basename($file);
            $name = titleFromFilename($pat['prefix'], $basename);
            $sku = skuFromPrefix($pat['prefix'], $basename);
            $desc = $pat['prefix'] === 'pupuk'
                ? 'Produk pupuk untuk meningkatkan pertumbuhan dan hasil tanaman.'
                : 'Produk perlindungan tanaman untuk mencegah dan mengatasi hama/penyakit.';
            // Simple price heuristic: pupuk 35k–65k; obat 40k–80k based on number
            $digits = preg_replace('/[^0-9]/', '', $basename);
            $n = ($digits !== '' ? (int)$digits : 1);
            if ($pat['prefix'] === 'pupuk') {
                $price = 30000 + (min($n, 10) * 3000);
            } else {
                $price = 35000 + (min($n, 10) * 3500);
            }
            $stock = 50 + (min($n, 10) * 5);

            $productId = ensureProduct($pdo, [
                'name' => $name,
                'sku' => $sku,
                'category_id' => $pat['category_id'],
                'description' => $desc,
                'price' => $price,
                'stock' => $stock,
                'status' => 'active',
            ]);

            // Copy image into backend/assets so PHP dev server (docroot backend) can serve it
            $destPath = $backendAssetsDir . DIRECTORY_SEPARATOR . $basename;
            if (!file_exists($destPath)) {
                // Best-effort copy; ignore failures silently to not break seeding
                @copy($file, $destPath);
            }

            // Store web-friendly relative path to assets (served from backend/assets)
            $webPath = '/assets/' . $basename;
            upsertImage($pdo, $productId, $webPath, $name, 1);
            $inserted++;
        }
    }

    $pdo->commit();
    jsonResponse(['ok' => true, 'message' => 'Seeding selesai', 'inserted' => $inserted]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
}

?>