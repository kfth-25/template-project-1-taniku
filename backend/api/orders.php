<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

function ensureSetup(PDO $pdo): void {
    $checks = ['categories', 'products', 'product_images', 'orders', 'order_items'];
    $missing = [];
    foreach ($checks as $t) {
        try { $pdo->query("SELECT 1 FROM `$t` LIMIT 1"); } catch (Throwable $e) { $missing[] = $t; }
    }
    if ($missing) {
        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
            $pdo->exec('CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                slug VARCHAR(120) UNIQUE,
                description TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB');
            $pdo->exec('CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                sku VARCHAR(120) UNIQUE,
                category_id INT NULL,
                description TEXT NULL,
                price DECIMAL(12,2) NOT NULL,
                stock INT DEFAULT 0,
                status ENUM("active","inactive") DEFAULT "active",
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_products_category_id (category_id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            ) ENGINE=InnoDB');
            $pdo->exec('CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                path VARCHAR(255) NOT NULL,
                alt_text VARCHAR(255) NULL,
                is_primary TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_product_images_pid (product_id),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB');
            $pdo->exec('CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_code VARCHAR(50) UNIQUE,
                user_id INT NULL,
                customer_name VARCHAR(120) NOT NULL,
                customer_email VARCHAR(120) NOT NULL,
                customer_phone VARCHAR(30) NULL,
                shipping_address TEXT NOT NULL,
                status ENUM("pending","processing","shipped","delivered","cancelled") DEFAULT "pending",
                payment_method VARCHAR(50) NULL,
                shipping_method VARCHAR(50) NULL,
                subtotal DECIMAL(12,2) NOT NULL,
                shipping_cost DECIMAL(12,2) DEFAULT 0,
                discount DECIMAL(12,2) DEFAULT 0,
                total DECIMAL(12,2) NOT NULL,
                order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_orders_status (status),
                INDEX idx_orders_order_date (order_date)
            ) ENGINE=InnoDB');
            $pdo->exec('CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                total DECIMAL(12,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_items_order_id (order_id),
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            ) ENGINE=InnoDB');
            $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        } catch (Throwable $e) { /* ignore */ }
    }
    try {
        $need = [
            ['user_id', 'ALTER TABLE orders ADD COLUMN user_id INT NULL'],
            ['order_code', 'ALTER TABLE orders ADD COLUMN order_code VARCHAR(50) UNIQUE'],
            ['payment_method', 'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL'],
            ['shipping_method', 'ALTER TABLE orders ADD COLUMN shipping_method VARCHAR(50) NULL'],
            ['subtotal', 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0'],
            ['shipping_cost', 'ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(12,2) DEFAULT 0'],
            ['discount', 'ALTER TABLE orders ADD COLUMN discount DECIMAL(12,2) DEFAULT 0'],
            ['total', 'ALTER TABLE orders ADD COLUMN total DECIMAL(12,2) NOT NULL DEFAULT 0'],
            ['order_date', 'ALTER TABLE orders ADD COLUMN order_date DATETIME DEFAULT CURRENT_TIMESTAMP'],
        ];
        foreach ($need as $c) {
            $ck = $pdo->prepare('SHOW COLUMNS FROM orders LIKE :c');
            $ck->execute([':c' => $c[0]]);
            $exists = $ck->fetch(PDO::FETCH_ASSOC);
            if (!$exists) { $pdo->exec($c[1]); }
        }
        $needItems = [
            ['name', 'ALTER TABLE order_items ADD COLUMN name VARCHAR(200) NOT NULL'],
            ['price', 'ALTER TABLE order_items ADD COLUMN price DECIMAL(12,2) NOT NULL DEFAULT 0'],
            ['total', 'ALTER TABLE order_items ADD COLUMN total DECIMAL(12,2) NOT NULL DEFAULT 0'],
        ];
        foreach ($needItems as $c) {
            $ck = $pdo->prepare('SHOW COLUMNS FROM order_items LIKE :c');
            $ck->execute([':c' => $c[0]]);
            $exists = $ck->fetch(PDO::FETCH_ASSOC);
            if (!$exists) { $pdo->exec($c[1]); }
        }
    } catch (Throwable $e) { /* ignore */ }
    try {
        $count = 0;
        $stmt = $pdo->query('SELECT COUNT(*) AS c FROM products');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $count = $row ? (int)$row['c'] : 0;
        if ($count === 0) {
            $catId = null;
            $q = $pdo->prepare('INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :desc)');
            $q->execute([':name' => 'Obat Tanaman', ':slug' => 'obat-tanaman', ':desc' => 'Produk perlindungan tanaman']);
            $catId = (int)$pdo->lastInsertId();
            $ins = $pdo->prepare('INSERT INTO products (name, sku, category_id, description, price, stock, status) VALUES (:name, :sku, :category_id, :description, :price, :stock, :status)');
            $ins->execute([':name' => 'Obat Tanaman 1', ':sku' => 'SKU-OBAT-001', ':category_id' => $catId, ':description' => 'Produk obat tanaman', ':price' => 45000, ':stock' => 100, ':status' => 'active']);
            $ins->execute([':name' => 'Pupuk 1', ':sku' => 'SKU-PUPUK-001', ':category_id' => null, ':description' => 'Produk pupuk', ':price' => 40000, ':stock' => 100, ':status' => 'active']);
        }
    } catch (Throwable $e) { /* ignore */ }
}

function ensureTrackingExists(PDO $pdo): void {
    try {
        $pdo->query('SELECT 1 FROM tracking LIMIT 1');
    } catch (Throwable $e) {
        try {
            $pdo->exec('CREATE TABLE IF NOT EXISTS tracking (
              id INT AUTO_INCREMENT PRIMARY KEY,
              order_id INT NOT NULL,
              tracking_code VARCHAR(80) UNIQUE,
              courier VARCHAR(50) NULL,
              status VARCHAR(40) DEFAULT "In Transit",
              last_location VARCHAR(120) NULL,
              map_url TEXT NULL,
              eta DATE NULL,
              lat DECIMAL(10,6) NULL,
              lng DECIMAL(10,6) NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_tracking_order_id (order_id),
              FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        } catch (Throwable $e2) { /* ignore */ }
    }
    try {
        $ck = $pdo->prepare('SHOW COLUMNS FROM tracking LIKE :c');
        $ck->execute([':c' => 'map_url']);
        $ex = $ck->fetch(PDO::FETCH_ASSOC);
        if (!$ex) { $pdo->exec('ALTER TABLE tracking ADD COLUMN map_url TEXT NULL'); }
        else {
            $type = isset($ex['Type']) ? strtolower($ex['Type']) : '';
            if ($type && strpos($type, 'varchar') !== false) {
                $pdo->exec('ALTER TABLE tracking MODIFY COLUMN map_url TEXT NULL');
            }
        }
    } catch (Throwable $e) { /* ignore */ }
}

if ($method === 'POST') {
    ensureSetup($pdo);
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!$input || !is_array($input)) {
        $input = [];
        parse_str($raw, $input);
        if (!$input || !is_array($input)) {
            $input = $_POST;
        }
    }

    if (isset($input['action']) && $input['action'] === 'update_status') {
        $newStatus = isset($input['status']) ? sanitizeInput($input['status']) : null;
        $allowed = ['pending','processing','shipped','delivered','cancelled'];
        if (!$newStatus || !in_array($newStatus, $allowed, true)) {
            jsonResponse(['ok' => false, 'error' => 'Invalid status'], 422);
        }
        $id = null;
        if (isset($input['id']) && is_numeric($input['id'])) {
            $id = (int)$input['id'];
        }
        $code = null;
        if (isset($input['order_code']) && is_string($input['order_code'])) {
            $code = sanitizeInput($input['order_code']);
        }
        if (!$id && !$code) {
            jsonResponse(['ok' => false, 'error' => 'Order identifier required'], 422);
        }
        try {
            if ($id) {
                $stmt = $pdo->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id');
                $stmt->execute([':status' => $newStatus, ':id' => $id]);
                jsonResponse(['ok' => true, 'id' => $id, 'status' => $newStatus]);
            } else {
                $stmt = $pdo->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE order_code = :code');
                $stmt->execute([':status' => $newStatus, ':code' => $code]);
                jsonResponse(['ok' => true, 'order_code' => $code, 'status' => $newStatus]);
            }
        } catch (Throwable $e) {
            jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    $required = ['customer_name', 'customer_email', 'shipping_address', 'items'];
    $missing = validateRequired($input, $required);
    if ($missing) {
        jsonResponse(['ok' => false, 'error' => 'Missing fields', 'fields' => $missing], 422);
    }

    if (!is_array($input['items']) || count($input['items']) === 0) {
        jsonResponse(['ok' => false, 'error' => 'Items required'], 422);
    }

    $customerName = sanitizeInput($input['customer_name']);
    $customerEmail = sanitizeInput($input['customer_email']);
    $customerPhone = isset($input['customer_phone']) ? sanitizeInput($input['customer_phone']) : null;
    $shippingAddress = sanitizeInput($input['shipping_address']);
    $paymentMethod = isset($input['payment_method']) ? sanitizeInput($input['payment_method']) : null;
    $shippingCost = isset($input['shipping_cost']) ? (float)$input['shipping_cost'] : 0.0;
    $discount = isset($input['discount']) ? (float)$input['discount'] : 0.0;

    $items = $input['items'];
    $missingProducts = [];
    $preparedItems = [];
    $subtotal = 0.0;

    foreach ($items as $it) {
        if (!isset($it['product_id']) || !isset($it['quantity'])) {
            continue;
        }
        $pid = (int)$it['product_id'];
        $qty = (int)$it['quantity'];
        if ($qty <= 0) {
            continue;
        }
        $stmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $pid]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$p) {
            $missingProducts[] = $pid;
            continue;
        }
        $nameFromPayload = isset($it['name']) ? sanitizeInput((string)$it['name']) : null;
        $priceFromPayload = (isset($it['unit_price']) && is_numeric($it['unit_price'])) ? (float)$it['unit_price'] : null;
        $price = $priceFromPayload !== null ? $priceFromPayload : (float)$p['price'];
        $lineTotal = $price * $qty;
        $subtotal += $lineTotal;
        $preparedItems[] = [
            'product_id' => (int)$p['id'],
            'name' => ($nameFromPayload !== null && $nameFromPayload !== '') ? $nameFromPayload : $p['name'],
            'quantity' => $qty,
            'price' => $price,
            'total' => $lineTotal,
        ];
    }

    if ($missingProducts) {
        ensureSetup($pdo);
        $catMap = [];
        $getCat = function(string $slug, string $name) use ($pdo, &$catMap) {
            if (isset($catMap[$slug])) return $catMap[$slug];
            $q = $pdo->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
            $q->execute([':slug' => $slug]);
            $row = $q->fetch(PDO::FETCH_ASSOC);
            if ($row) { $catMap[$slug] = (int)$row['id']; return $catMap[$slug]; }
            $ins = $pdo->prepare('INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :desc)');
            $ins->execute([':name' => $name, ':slug' => $slug, ':desc' => null]);
            $catMap[$slug] = (int)$pdo->lastInsertId();
            return $catMap[$slug];
        };
        foreach ($items as $it) {
            if (!isset($it['product_id']) || !isset($it['quantity'])) continue;
            $pid = (int)$it['product_id'];
            $stmt = $pdo->prepare('SELECT id FROM products WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $pid]);
            $p = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($p) continue;
            $nm = isset($it['name']) ? sanitizeInput($it['name']) : ('Produk ' . $pid);
            $up = isset($it['unit_price']) && is_numeric($it['unit_price']) ? (float)$it['unit_price'] : 40000.0;
            $catSlug = 'obat-tanaman';
            $catName = 'Obat Tanaman';
            $catRaw = isset($it['category']) ? strtolower(trim((string)$it['category'])) : '';
            if ($catRaw && strpos($catRaw, 'pupuk') !== false) { $catSlug = 'pupuk'; $catName = 'Pupuk'; }
            elseif ($catRaw && strpos($catRaw, 'bundle') !== false) { $catSlug = 'bundle'; $catName = 'Bundle'; }
            $catId = $getCat($catSlug, $catName);
            $sku = 'SKU-' . preg_replace('/[^A-Z0-9]/', '', strtoupper(substr($nm,0,10))) . '-' . str_pad((string)$pid, 3, '0', STR_PAD_LEFT);
            $ins = $pdo->prepare('INSERT INTO products (name, sku, category_id, description, price, stock, status) VALUES (:name, :sku, :category_id, :description, :price, :stock, :status)');
            $ins->execute([':name' => $nm, ':sku' => $sku, ':category_id' => $catId, ':description' => null, ':price' => $up, ':stock' => 100, ':status' => 'active']);
        }
        $preparedItems = [];
        $subtotal = 0.0;
        foreach ($items as $it) {
            if (!isset($it['product_id']) || !isset($it['quantity'])) continue;
            $pid = (int)$it['product_id'];
            $qty = (int)$it['quantity'];
            if ($qty <= 0) continue;
            $stmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $pid]);
            $p = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$p) continue;
            $nameFromPayload = isset($it['name']) ? sanitizeInput((string)$it['name']) : null;
            $priceFromPayload = (isset($it['unit_price']) && is_numeric($it['unit_price'])) ? (float)$it['unit_price'] : null;
            $price = $priceFromPayload !== null ? $priceFromPayload : (float)$p['price'];
            $lineTotal = $price * $qty;
            $subtotal += $lineTotal;
            $preparedItems[] = [
                'product_id' => (int)$p['id'],
                'name' => ($nameFromPayload !== null && $nameFromPayload !== '') ? $nameFromPayload : $p['name'],
                'quantity' => $qty,
                'price' => $price,
                'total' => $lineTotal,
            ];
        }
        if (!$preparedItems) {
            jsonResponse(['ok' => false, 'error' => 'Products unavailable'], 422);
        }
    }

    $total = max(0.0, $subtotal + $shippingCost - $discount);
    $orderCode = 'ORD' . date('Ymd') . '-' . substr(bin2hex(random_bytes(4)), 0, 8);

    try {
        $pdo->beginTransaction();

        $ins = $pdo->prepare('INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, shipping_address, status, payment_method, shipping_cost, discount, subtotal, total, order_date) VALUES (:order_code, :user_id, :customer_name, :customer_email, :customer_phone, :shipping_address, :status, :payment_method, :shipping_cost, :discount, :subtotal, :total, NOW())');
        $ins->execute([
            ':order_code' => $orderCode,
            ':user_id' => null,
            ':customer_name' => $customerName,
            ':customer_email' => $customerEmail,
            ':customer_phone' => $customerPhone,
            ':shipping_address' => $shippingAddress,
            ':status' => 'pending',
            ':payment_method' => $paymentMethod,
            ':shipping_cost' => $shippingCost,
            ':discount' => $discount,
            ':subtotal' => $subtotal,
            ':total' => $total,
        ]);
        $orderId = (int)$pdo->lastInsertId();

        $itemIns = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name, quantity, price, total) VALUES (:order_id, :product_id, :name, :quantity, :price, :total)');
        foreach ($preparedItems as $pi) {
            $itemIns->execute([
                ':order_id' => $orderId,
                ':product_id' => $pi['product_id'],
                ':name' => sanitizeInput($pi['name']),
                ':quantity' => (int)$pi['quantity'],
                ':price' => (float)$pi['price'],
                ':total' => (float)$pi['total'],
            ]);
            try {
                $dec = $pdo->prepare('UPDATE products SET stock = GREATEST(stock - :qty, 0) WHERE id = :pid');
                $dec->execute([':qty' => (int)$pi['quantity'], ':pid' => (int)$pi['product_id']]);
            } catch (Throwable $e) { /* ignore stock decrement errors */ }
        }

        // Ensure tracking table exists and create initial tracking record
        try {
            $pdo->query('SELECT 1 FROM tracking LIMIT 1');
        } catch (Throwable $e) {
            $pdo->exec('CREATE TABLE IF NOT EXISTS tracking (
              id INT AUTO_INCREMENT PRIMARY KEY,
              order_id INT NOT NULL,
              tracking_code VARCHAR(80) UNIQUE,
              courier VARCHAR(50) NULL,
              status VARCHAR(40) DEFAULT "In Transit",
              last_location VARCHAR(120) NULL,
              eta DATE NULL,
              lat DECIMAL(10,6) NULL,
              lng DECIMAL(10,6) NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_tracking_order_id (order_id),
              FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        }
        $trackCode = 'TRK-' . $orderCode;
        $insTrack = $pdo->prepare('INSERT INTO tracking (order_id, tracking_code, courier, status, last_location, map_url, eta, lat, lng) VALUES (:oid, :code, :courier, :status, :loc, :map, :eta, :lat, :lng)');
        $insTrack->execute([
          ':oid' => $orderId,
          ':code' => $trackCode,
          ':courier' => null,
          ':status' => 'In Transit',
          ':loc' => null,
          ':map' => 'https://www.google.com/maps?q=' . urlencode($shippingAddress),
          ':eta' => null,
          ':lat' => null,
          ':lng' => null,
        ]);

        // Upsert customer record with last order info
        try {
            $lastProducts = implode(', ', array_map(function($pi){
                return (string)$pi['name'] . ' x ' . (int)$pi['quantity'];
            }, $preparedItems));
            $selCust = $pdo->prepare('SELECT id FROM customers WHERE email = :email LIMIT 1');
            $selCust->execute([':email' => $customerEmail]);
            $cust = $selCust->fetch(PDO::FETCH_ASSOC);
            if ($cust) {
                $updCust = $pdo->prepare('UPDATE customers SET name = :name, address_line1 = :addr, last_order_date = NOW(), last_products = :lp WHERE email = :email');
                $updCust->execute([
                    ':name' => $customerName,
                    ':addr' => $shippingAddress,
                    ':lp' => $lastProducts,
                    ':email' => $customerEmail,
                ]);
            } else {
                $insCust = $pdo->prepare('INSERT INTO customers (user_id, name, email, address_line1, city, province, postal_code, last_order_date, last_products) VALUES (:uid, :name, :email, :addr, :city, :prov, :postal, NOW(), :lp)');
                $insCust->execute([
                    ':uid' => null,
                    ':name' => $customerName,
                    ':email' => $customerEmail,
                    ':addr' => $shippingAddress,
                    ':city' => null,
                    ':prov' => null,
                    ':postal' => null,
                    ':lp' => $lastProducts,
                ]);
            }
        } catch (Throwable $e) { /* ignore customer table errors */ }

        $pdo->commit();
        jsonResponse(['ok' => true, 'id' => $orderId, 'order_code' => $orderCode, 'total' => $total]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

if ($method === 'GET') {
    if (isset($_GET['view']) && $_GET['view'] === 'logistics') {
        $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
        $courier = isset($_GET['courier']) ? sanitizeInput($_GET['courier']) : null;
        $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : null;
        $dateFrom = isset($_GET['date_from']) ? sanitizeInput($_GET['date_from']) : null;
        $dateTo = isset($_GET['date_to']) ? sanitizeInput($_GET['date_to']) : null;
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;
        $sort = isset($_GET['sort']) ? strtolower(sanitizeInput($_GET['sort'])) : 'date';
        $dir = isset($_GET['dir']) && strtolower($_GET['dir']) === 'asc' ? 'ASC' : 'DESC';
        $sortMap = [
            'date' => 'o.order_date',
            'value' => 'o.total',
            'customer' => 'o.customer_name',
            'id' => 'o.order_code'
        ];
        $sortCol = isset($sortMap[$sort]) ? $sortMap[$sort] : $sortMap['date'];

        $sql = 'SELECT o.id, o.order_code, o.customer_name, o.shipping_address, o.status, o.total, DATE(o.order_date) AS order_date, t.courier, t.tracking_code, COALESCE(SUM(oi.quantity),0) AS items FROM orders o LEFT JOIN tracking t ON t.order_id = o.id LEFT JOIN order_items oi ON oi.order_id = o.id';
        $where = [];
        $params = [];
        if ($status) { $where[] = 'o.status = :status'; $params[':status'] = $status; }
        if ($courier) { $where[] = 't.courier = :courier'; $params[':courier'] = $courier; }
        if ($search) { $where[] = '(o.order_code LIKE :q OR o.customer_name LIKE :q OR o.shipping_address LIKE :q OR t.tracking_code LIKE :q)'; $params[':q'] = '%' . $search . '%'; }
        if ($dateFrom) { $where[] = 'DATE(o.order_date) >= :df'; $params[':df'] = $dateFrom; }
        if ($dateTo) { $where[] = 'DATE(o.order_date) <= :dt'; $params[':dt'] = $dateTo; }
        if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
        $sql .= ' GROUP BY o.id, o.order_code, o.customer_name, o.shipping_address, o.status, o.total, order_date, t.courier, t.tracking_code';
        $sql .= ' ORDER BY ' . $sortCol . ' ' . $dir . ' LIMIT :limit OFFSET :offset';
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function($r){
            return [
                'id' => (int)$r['id'],
                'order_code' => $r['order_code'],
                'customer_name' => $r['customer_name'],
                'shipping_address' => $r['shipping_address'],
                'status' => $r['status'],
                'items' => (int)$r['items'],
                'total' => (float)$r['total'],
                'courier' => isset($r['courier']) ? $r['courier'] : null,
                'tracking_code' => isset($r['tracking_code']) ? $r['tracking_code'] : null,
                'order_date' => $r['order_date']
            ];
        }, $rows);
        jsonResponse(['ok' => true, 'data' => $data, 'page' => $page, 'limit' => $limit]);
    }
    if (isset($_GET['summary'])) {
        $tf = isset($_GET['tf']) ? strtolower(sanitizeInput($_GET['tf'])) : '30d';
        $dateFrom = isset($_GET['date_from']) ? sanitizeInput($_GET['date_from']) : null;
        $dateTo = isset($_GET['date_to']) ? sanitizeInput($_GET['date_to']) : null;
        $statusIn = isset($_GET['status_in']) ? sanitizeInput($_GET['status_in']) : null; // CSV
        $statusEx = isset($_GET['status_ex']) ? sanitizeInput($_GET['status_ex']) : null; // CSV
        $paidOnly = (isset($_GET['paid_only']) && ($_GET['paid_only'] === '1' || strtolower($_GET['paid_only']) === 'true'));
        $minTotal = isset($_GET['min_total']) && is_numeric($_GET['min_total']) ? (float)$_GET['min_total'] : null;
        $maxTotal = isset($_GET['max_total']) && is_numeric($_GET['max_total']) ? (float)$_GET['max_total'] : null;
        $now = new DateTime('now');
        $start = null;
        $end = null;
        if ($dateFrom && $dateTo) {
            $start = DateTime::createFromFormat('Y-m-d', $dateFrom) ?: new DateTime($dateFrom);
            $end = DateTime::createFromFormat('Y-m-d', $dateTo) ?: new DateTime($dateTo);
        } else {
            if ($tf === '7d') { $start = (clone $now)->modify('-7 days'); }
            elseif ($tf === '12m') { $start = (clone $now)->modify('-12 months'); }
            else { $start = (clone $now)->modify('-30 days'); }
            $end = $now;
        }
        if (!$start || !$end) {
            jsonResponse(['ok' => false, 'error' => 'Invalid timeframe'], 422);
        }
        $df = $start->format('Y-m-d');
        $dt = $end->format('Y-m-d');
        $sql = 'SELECT COUNT(*) AS total_orders, COALESCE(SUM(o.total),0) AS total_profit,
                SUM(CASE WHEN LOWER(o.status) IN (\'delivered\',\'completed\',\'selesai\',\'finished\',\'done\') THEN 1 ELSE 0 END) AS selesai
                FROM orders o WHERE DATE(o.order_date) BETWEEN :df AND :dt';
        $whereExtra = [];
        $params = [ ':df' => $df, ':dt' => $dt ];
        $normalize = function($s) {
            $m = [
                'menunggu' => 'pending',
                'diproses' => 'processing',
                'dikirim' => 'shipped',
                'selesai' => 'delivered',
                'dibayar' => 'paid',
            ];
            $x = strtolower(trim($s));
            return isset($m[$x]) ? $m[$x] : $x;
        };
        if ($statusIn) {
            $items = array_filter(array_map('trim', explode(',', $statusIn)));
            $norm = array_unique(array_map($normalize, $items));
            if ($norm) {
                $ph = [];
                foreach ($norm as $i => $st) { $ph[] = ":sin{$i}"; $params[":sin{$i}"] = $st; }
                $whereExtra[] = 'LOWER(o.status) IN (' . implode(',', $ph) . ')';
            }
        }
        if ($statusEx) {
            $items = array_filter(array_map('trim', explode(',', $statusEx)));
            $norm = array_unique(array_map($normalize, $items));
            if ($norm) {
                $ph = [];
                foreach ($norm as $i => $st) { $ph[] = ":sex{$i}"; $params[":sex{$i}"] = $st; }
                $whereExtra[] = 'LOWER(o.status) NOT IN (' . implode(',', $ph) . ')';
            }
        }
        if ($paidOnly) {
            $whereExtra[] = "( (o.payment_method IS NOT NULL AND o.payment_method <> '') OR LOWER(o.status) IN ('paid','completed','delivered') )";
        }
        if ($minTotal !== null) { $whereExtra[] = 'o.total >= :minTotal'; $params[':minTotal'] = $minTotal; }
        if ($maxTotal !== null) { $whereExtra[] = 'o.total <= :maxTotal'; $params[':maxTotal'] = $maxTotal; }
        if ($whereExtra) { $sql .= ' AND ' . implode(' AND ', $whereExtra); }
        try {
            $stmt = $pdo->prepare($sql);
            foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalOrders = (int)($row['total_orders'] ?? 0);
            $totalProfit = (float)($row['total_profit'] ?? 0.0);
            $selesai = (int)($row['selesai'] ?? 0);
            $avgAOV = $totalOrders > 0 ? round($totalProfit / $totalOrders, 2) : 0.0;
            $sqlAll = "SELECT COUNT(*) AS selesai_total FROM orders o WHERE LOWER(o.status) IN ('delivered','completed','selesai','finished','done')";
            $stmtAll = $pdo->prepare($sqlAll);
            $stmtAll->execute();
            $rowAll = $stmtAll->fetch(PDO::FETCH_ASSOC);
            $selesaiTotal = (int)($rowAll['selesai_total'] ?? 0);
            $stmtOrdersAll = $pdo->query("SELECT COUNT(*) AS total_orders_total FROM orders");
            $rowOrdersAll = $stmtOrdersAll->fetch(PDO::FETCH_ASSOC);
            $totalOrdersAll = (int)($rowOrdersAll['total_orders_total'] ?? 0);
            $stmtOrdersActive = $pdo->query("SELECT COUNT(*) AS total_orders_active FROM orders o WHERE LOWER(o.status) NOT IN ('delivered','completed','selesai','finished','done')");
            $rowOrdersActive = $stmtOrdersActive->fetch(PDO::FETCH_ASSOC);
            $totalOrdersActive = (int)($rowOrdersActive['total_orders_active'] ?? 0);
            $stmtProfitAll = $pdo->query("SELECT COALESCE(SUM(total),0) AS total_profit_total FROM orders");
            $rowProfitAll = $stmtProfitAll->fetch(PDO::FETCH_ASSOC);
            $totalProfitAll = (float)($rowProfitAll['total_profit_total'] ?? 0.0);
            $avgAOVAll = $totalOrdersAll > 0 ? round($totalProfitAll / $totalOrdersAll, 2) : 0.0;
            jsonResponse(['ok' => true, 'data' => [
                'total_orders' => $totalOrders,
                'total_orders_total' => $totalOrdersAll,
                'total_orders_active' => $totalOrdersActive,
                'total_profit' => $totalProfit,
                'total_profit_total' => $totalProfitAll,
                'avg_aov' => $avgAOV,
                'avg_aov_total' => $avgAOVAll,
                'selesai' => $selesai,
                'selesai_total' => $selesaiTotal,
                'date_from' => $df,
                'date_to' => $dt,
            ]]);
        } catch (Throwable $e) {
            jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    if (isset($_GET['group']) && $_GET['group'] === 'by_product') {
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
        $offset = ($page - 1) * $limit;
        $q = 'SELECT oi.product_id, oi.name, SUM(oi.quantity) AS sold FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ("processing","shipped","delivered") GROUP BY oi.product_id, oi.name ORDER BY sold DESC LIMIT :limit OFFSET :offset';
        $stmt = $pdo->prepare($q);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function($r){
            return [
                'product_id' => (int)$r['product_id'],
                'name' => $r['name'],
                'sold' => (int)$r['sold'],
            ];
        }, $rows);
        jsonResponse(['ok' => true, 'data' => $data, 'page' => $page, 'limit' => $limit]);
    }

    if (isset($_GET['group']) && $_GET['group'] === 'by_user') {
        $q = 'SELECT customer_name, customer_email, COUNT(*) AS order_count FROM orders GROUP BY customer_email, customer_name';
        $rows = $pdo->query($q)->fetchAll(PDO::FETCH_ASSOC);
        $out = [];
        foreach ($rows as $r) {
            $it = $pdo->prepare('SELECT oi.name, SUM(oi.quantity) AS quantity FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.customer_email = :email GROUP BY oi.name');
            $it->execute([':email' => $r['customer_email']]);
            $items = $it->fetchAll(PDO::FETCH_ASSOC);
            $out[] = [
                'customer_name' => $r['customer_name'],
                'customer_email' => $r['customer_email'],
                'order_count' => (int)$r['order_count'],
                'items' => array_map(function($x){ return ['name' => $x['name'], 'quantity' => (int)$x['quantity']]; }, $items),
            ];
        }
        jsonResponse(['ok' => true, 'data' => $out]);
    }

    $id = null;
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $id = (int)$_GET['id'];
    } elseif (isset($_GET['number'])) {
        $num = sanitizeInput($_GET['number']);
        $stmt = $pdo->prepare('SELECT id FROM orders WHERE order_code = :code LIMIT 1');
        $stmt->execute([':code' => $num]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $id = (int)$row['id'];
        }
    }

    if (!$id) {
        ensureTrackingExists($pdo);
        $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
        $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : null;
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
        $offset = ($page - 1) * $limit;
        $sql = 'SELECT o.id, o.order_code, o.customer_name, o.customer_email, o.customer_phone, o.shipping_address, o.status, o.payment_method, o.subtotal, o.shipping_cost, o.discount, o.total, o.order_date, t.map_url, t.tracking_code FROM orders o LEFT JOIN tracking t ON t.order_id = o.id';
        $where = [];
        $params = [];
        if ($status) { $where[] = 'o.status = :status'; $params[':status'] = $status; }
        if ($search) {
            $where[] = '(o.order_code LIKE :q OR o.customer_name LIKE :q OR o.customer_email LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }
        if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
        $sql .= ' ORDER BY o.id DESC LIMIT :limit OFFSET :offset';
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function($o){
            return [
                'id' => (int)$o['id'],
                'order_code' => $o['order_code'],
                'customer_name' => $o['customer_name'],
                'customer_email' => $o['customer_email'],
                'customer_phone' => $o['customer_phone'],
                'shipping_address' => $o['shipping_address'],
                'status' => $o['status'],
                'payment_method' => $o['payment_method'],
                'subtotal' => (float)$o['subtotal'],
                'shipping_cost' => (float)$o['shipping_cost'],
                'discount' => (float)$o['discount'],
                'total' => (float)$o['total'],
                'order_date' => $o['order_date'],
                'map_url' => isset($o['map_url']) ? $o['map_url'] : null,
                'tracking_code' => isset($o['tracking_code']) ? $o['tracking_code'] : null,
            ];
        }, $rows);
        jsonResponse(['ok' => true, 'data' => $data, 'page' => $page, 'limit' => $limit]);
    }

    ensureTrackingExists($pdo);
    $stmt = $pdo->prepare('SELECT o.id, o.order_code, o.customer_name, o.customer_email, o.customer_phone, o.shipping_address, o.status, o.payment_method, o.subtotal, o.shipping_cost, o.discount, o.total, o.order_date, t.map_url, t.tracking_code FROM orders o LEFT JOIN tracking t ON t.order_id = o.id WHERE o.id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        jsonResponse(['ok' => false, 'error' => 'Order not found'], 404);
    }

    $it = $pdo->prepare('SELECT product_id, name, quantity, price, total FROM order_items WHERE order_id = :id');
    $it->execute([':id' => $id]);
    $items = $it->fetchAll(PDO::FETCH_ASSOC);

    $data = $order;
    if (!isset($data['map_url'])) { $data['map_url'] = null; }
    if (!isset($data['tracking_code'])) { $data['tracking_code'] = null; }
    $data['items'] = array_map(function($row) {
        return [
            'product_id' => (int)$row['product_id'],
            'name' => $row['name'],
            'quantity' => (int)$row['quantity'],
            'price' => (float)$row['price'],
            'total' => (float)$row['total'],
        ];
    }, $items);

    jsonResponse(['ok' => true, 'data' => $data]);
}

jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
?>
