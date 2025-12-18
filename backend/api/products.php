<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

$pdo = getDBConnection();

function getPrimaryImage(PDO $pdo, int $productId) {
    $stmt = $pdo->prepare('SELECT path FROM product_images WHERE product_id = :pid AND is_primary = 1 LIMIT 1');
    $stmt->execute([':pid' => $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['path'] : null;
}

function ensureCategoryId(PDO $pdo, string $slug, string $name = null) {
    $q = $pdo->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
    $q->execute([':slug' => $slug]);
    $row = $q->fetch(PDO::FETCH_ASSOC);
    if ($row) return (int)$row['id'];
    if (!$name) $name = ucfirst($slug);
    $ins = $pdo->prepare('INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :desc)');
    $ins->execute([':name' => $name, ':slug' => $slug, ':desc' => null]);
    return (int)$pdo->lastInsertId();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Optional query params: id, q, category, status, page, limit
    $sql = 'SELECT p.id, p.name, p.sku, p.category_id, p.description, p.price, p.stock, p.status, c.slug AS category_slug, c.name AS category_name, p.created_at, p.updated_at
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id';
    $where = [];
    $params = [];

    if (isset($_GET['id'])) {
        $where[] = 'p.id = :id';
        $params[':id'] = (int)$_GET['id'];
    }
    if (isset($_GET['category'])) {
        $where[] = 'c.slug = :category';
        $params[':category'] = sanitizeInput($_GET['category']);
    }
    if (isset($_GET['status'])) {
        $where[] = 'p.status = :status';
        $params[':status'] = sanitizeInput($_GET['status']);
    }
    if (isset($_GET['q'])) {
        $where[] = 'p.name LIKE :q';
        $params[':q'] = '%' . sanitizeInput($_GET['q']) . '%';
    }

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY p.id DESC';

    // Optional pagination: limit
    if (isset($_GET['limit'])) {
        $limit = (int)$_GET['limit'];
        if ($limit > 0) {
            // Hard cap untuk mencegah query terlalu besar
            if ($limit > 100) { $limit = 100; }
            $sql .= ' LIMIT ' . $limit;
        }
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = array_map(function($row) use ($pdo) {
        $row['image'] = getPrimaryImage($pdo, (int)$row['id']);
        return $row;
    }, $rows);

    jsonResponse(['ok' => true, 'data' => $data]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        // Fallback to form-data
        $input = $_POST;
    }

    $required = ['name', 'sku', 'category', 'price', 'stock', 'description'];
    $missing = validateRequired($input, $required);
    if ($missing) {
        jsonResponse(['ok' => false, 'error' => 'Missing fields', 'fields' => $missing], 422);
    }

    // Validate numeric payload
    if (!is_numeric($input['price']) || !is_numeric($input['stock'])) {
        jsonResponse(['ok' => false, 'error' => 'Price and stock must be numeric'], 422);
    }

    $categorySlug = sanitizeInput($input['category']);
    $categoryId = ensureCategoryId($pdo, $categorySlug, $categorySlug === 'pupuk' ? 'Pupuk' : ($categorySlug === 'obat' ? 'Obat Tanaman' : ucfirst($categorySlug)));

    try {
        // Prevent duplicate SKU
        $chk = $pdo->prepare('SELECT id FROM products WHERE sku = :sku LIMIT 1');
        $chk->execute([':sku' => sanitizeInput($input['sku'])]);
        if ($chk->fetch(PDO::FETCH_ASSOC)) {
            jsonResponse(['ok' => false, 'error' => 'SKU already exists'], 409);
        }

        $stmt = $pdo->prepare('INSERT INTO products (name, sku, category_id, description, price, stock, status) VALUES (:name, :sku, :category_id, :description, :price, :stock, :status)');
        $stmt->execute([
            ':name' => sanitizeInput($input['name']),
            ':sku' => sanitizeInput($input['sku']),
            ':category_id' => $categoryId,
            ':description' => sanitizeInput($input['description']),
            ':price' => (float)$input['price'],
            ':stock' => (int)$input['stock'],
            ':status' => isset($input['status']) ? sanitizeInput($input['status']) : 'active',
        ]);
        $productId = (int)$pdo->lastInsertId();

        // Optional: image_path for primary image (assumes already in a public path)
        if (isset($input['image_path']) && !empty(trim($input['image_path']))) {
            $img = $pdo->prepare('INSERT INTO product_images (product_id, path, alt_text, is_primary) VALUES (:pid, :path, :alt, 1)');
            $img->execute([
                ':pid' => $productId,
                ':path' => sanitizeInput($input['image_path']),
                ':alt' => sanitizeInput($input['name']),
            ]);
        }

        jsonResponse(['ok' => true, 'id' => $productId]);
    } catch (PDOException $e) {
        // Return JSON error rather than fatal
        jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

if ($method === 'PUT' || $method === 'PATCH') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!$input) {
        $input = [];
        parse_str($raw, $input);
        if (!$input) {
            $input = $_POST;
        }
    }

    if (!isset($input['id']) || !is_numeric($input['id'])) {
        jsonResponse(['ok' => false, 'error' => 'Missing id'], 422);
    }
    $id = (int)$input['id'];

    $fields = [];
    $params = [':id' => $id];

    if (isset($input['name'])) {
        $fields[] = 'name = :name';
        $params[':name'] = sanitizeInput($input['name']);
    }
    if (isset($input['description'])) {
        $fields[] = 'description = :description';
        $params[':description'] = sanitizeInput($input['description']);
    }
    if (isset($input['price'])) {
        if (!is_numeric($input['price'])) {
            jsonResponse(['ok' => false, 'error' => 'Price must be numeric'], 422);
        }
        $fields[] = 'price = :price';
        $params[':price'] = (float)$input['price'];
    }
    if (isset($input['stock'])) {
        if (!is_numeric($input['stock'])) {
            jsonResponse(['ok' => false, 'error' => 'Stock must be numeric'], 422);
        }
        $fields[] = 'stock = :stock';
        $params[':stock'] = (int)$input['stock'];
    }
    if (isset($input['status'])) {
        $fields[] = 'status = :status';
        $params[':status'] = sanitizeInput($input['status']);
    }
    if (isset($input['category'])) {
        $slug = sanitizeInput($input['category']);
        $catId = ensureCategoryId($pdo, $slug, $slug === 'pupuk' ? 'Pupuk' : ($slug === 'obat' ? 'Obat Tanaman' : ucfirst($slug)));
        $fields[] = 'category_id = :category_id';
        $params[':category_id'] = $catId;
    }

    

    if (!$fields) {
        jsonResponse(['ok' => false, 'error' => 'No fields to update'], 422);
    }

    try {
        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Optional: update primary image
        if (isset($input['image_path'])) {
            $pdo->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = :pid')->execute([':pid' => $id]);
            $ins = $pdo->prepare('INSERT INTO product_images (product_id, path, alt_text, is_primary) VALUES (:pid, :path, :alt, 1)');
            $ins->execute([
                ':pid' => $id,
                ':path' => sanitizeInput($input['image_path']),
                ':alt' => isset($input['name']) ? sanitizeInput($input['name']) : 'Primary Image',
            ]);
        }

        jsonResponse(['ok' => true, 'id' => $id]);
    } catch (PDOException $e) {
        jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $id = null;
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
    } else {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (isset($input['id'])) {
            $id = (int)$input['id'];
        }
    }
    if (!$id) {
        jsonResponse(['ok' => false, 'error' => 'Missing id'], 422);
    }
    try {
        $pdo->prepare('DELETE FROM product_images WHERE product_id = :pid')->execute([':pid' => $id]);
        $del = $pdo->prepare('DELETE FROM products WHERE id = :id');
        $del->execute([':id' => $id]);
        jsonResponse(['ok' => true, 'deleted' => $del->rowCount() > 0]);
    } catch (PDOException $e) {
        jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Method not allowed
jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
?>
