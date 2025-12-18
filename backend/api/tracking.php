<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
if (isset($_GET['_method']) && is_string($_GET['_method'])) {
  $ov = strtoupper(trim($_GET['_method']));
  if (in_array($ov, ['GET','POST','PUT','PATCH','DELETE'])) { $method = $ov; }
}
// Treat POST with id/code as update when proxies block PATCH
if ($method === 'POST') {
  $hasId = (isset($_GET['id']) && is_numeric($_GET['id'])) || (isset($_POST['id']) && is_numeric($_POST['id']));
  $hasCode = isset($_GET['code']) || isset($_POST['code']);
  if ($hasId || $hasCode) { $method = 'PATCH'; }
}

function ensureTrackingSetup(PDO $pdo): void {
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
      map_url TEXT NULL,
      eta DATE NULL,
      lat DECIMAL(10,6) NULL,
      lng DECIMAL(10,6) NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tracking_order_id (order_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
  }
  try {
    $ck = $pdo->prepare('SHOW COLUMNS FROM tracking LIKE :c');
    $ck->execute([':c' => 'map_url']);
    $exists = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$exists) { $pdo->exec('ALTER TABLE tracking ADD COLUMN map_url TEXT NULL'); }
    else {
      // Perbesar tipe jika terlalu kecil
      $type = isset($exists['Type']) ? strtolower($exists['Type']) : '';
      if ($type && (strpos($type, 'varchar') !== false)) {
        $pdo->exec('ALTER TABLE tracking MODIFY COLUMN map_url TEXT NULL');
      }
    }

    $ck->execute([':c' => 'lat']);
    $existsLat = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$existsLat) { $pdo->exec('ALTER TABLE tracking ADD COLUMN lat DECIMAL(10,6) NULL'); }

    $ck->execute([':c' => 'lng']);
    $existsLng = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$existsLng) { $pdo->exec('ALTER TABLE tracking ADD COLUMN lng DECIMAL(10,6) NULL'); }
  } catch (Throwable $e) { }
}

function ensureProductMapColumns(PDO $pdo): void {
  try {
    $ck = $pdo->prepare('SHOW COLUMNS FROM products LIKE :c');
    $ck->execute([':c' => 'map_url']);
    $exMap = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$exMap) { $pdo->exec('ALTER TABLE products ADD COLUMN map_url TEXT NULL'); }
    else {
      $type = isset($exMap['Type']) ? strtolower($exMap['Type']) : '';
      if ($type && (strpos($type, 'varchar') !== false)) {
        $pdo->exec('ALTER TABLE products MODIFY COLUMN map_url TEXT NULL');
      }
    }
    $ck->execute([':c' => 'lat']);
    $exLat = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$exLat) { $pdo->exec('ALTER TABLE products ADD COLUMN lat DECIMAL(10,6) NULL'); }
    $ck->execute([':c' => 'lng']);
    $exLng = $ck->fetch(PDO::FETCH_ASSOC);
    if (!$exLng) { $pdo->exec('ALTER TABLE products ADD COLUMN lng DECIMAL(10,6) NULL'); }
  } catch (Throwable $e) { }
}

function propagateProductMaps(PDO $pdo, int $orderId, ?string $mapUrl, ?float $lat, ?float $lng): void {
  if (!$orderId) return;
  try {
    ensureProductMapColumns($pdo);
    $it = $pdo->prepare('SELECT DISTINCT product_id FROM order_items WHERE order_id = :oid');
    $it->execute([':oid' => $orderId]);
    $pids = $it->fetchAll(PDO::FETCH_COLUMN, 0);
    if (!$pids) return;
    $set = [];
    $params = [];
    if ($mapUrl) { $set[] = 'map_url = :map_url'; $params[':map_url'] = $mapUrl; }
    if ($lat !== null) { $set[] = 'lat = :lat'; $params[':lat'] = $lat; }
    if ($lng !== null) { $set[] = 'lng = :lng'; $params[':lng'] = $lng; }
    if (!$set) return;
    $sql = 'UPDATE products SET ' . implode(', ', $set) . ' WHERE id IN (' . implode(',', array_map('intval', $pids)) . ')';
    $st = $pdo->prepare($sql);
    $st->execute($params);
  } catch (Throwable $e) { }
}

ensureTrackingSetup($pdo);

if ($method === 'GET') {
  $id = isset($_GET['id']) && is_numeric($_GET['id']) ? (int)$_GET['id'] : null;
  $orderId = isset($_GET['order_id']) && is_numeric($_GET['order_id']) ? (int)$_GET['order_id'] : null;
  $code = isset($_GET['code']) ? sanitizeInput($_GET['code']) : null;
  $orderCode = isset($_GET['order_code']) ? sanitizeInput($_GET['order_code']) : null;

  if ($orderCode && !$orderId) {
    $q = $pdo->prepare('SELECT id FROM orders WHERE order_code = :oc LIMIT 1');
    $q->execute([':oc' => $orderCode]);
    $row = $q->fetch(PDO::FETCH_ASSOC);
    if ($row) { $orderId = (int)$row['id']; }
  }

  if ($id || $orderId || $code) {
    $sql = 'SELECT t.*, o.order_code FROM tracking t JOIN orders o ON o.id = t.order_id WHERE 1=1';
    $params = [];
    if ($id) { $sql .= ' AND t.id = :id'; $params[':id'] = $id; }
    if ($orderId) { $sql .= ' AND t.order_id = :oid'; $params[':oid'] = $orderId; }
    if ($code) { $sql .= ' AND t.tracking_code = :code'; $params[':code'] = $code; }
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) { jsonResponse(['ok' => false, 'error' => 'Tracking not found'], 404); }
    jsonResponse(['ok' => true, 'data' => $row]);
  }

  $q = $pdo->query('SELECT t.*, o.order_code FROM tracking t JOIN orders o ON o.id = t.order_id ORDER BY t.id DESC');
  $rows = $q->fetchAll(PDO::FETCH_ASSOC);
  jsonResponse(['ok' => true, 'data' => $rows]);
}

function parseLatLngFromUrl($url) {
  $u = (string)$url;
  if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $u, $m)) { return [$m[1], $m[2]]; }
  if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $u, $m)) { return [$m[1], $m[2]]; }
  return [null, null];
}

function extractQueryFromMapsUrl($url) {
  $u = (string)$url;
  $q = null;
  if (preg_match('/[?&]query=([^&]+)/', $u, $m)) { $q = urldecode($m[1]); }
  if (!$q && preg_match('#/place/([^/]+)#', $u, $m)) { $q = urldecode($m[1]); }
  return $q;
}

function geocodeQuery($query) {
  $qs = urlencode($query);
  $url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q={$qs}";
  $ua = "Taniku-Tracking-Geocoder/1.0";
  $resp = null;
  if (function_exists('curl_init')) {
    try {
      $ch = curl_init($url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
      curl_setopt($ch, CURLOPT_TIMEOUT, 6);
      curl_setopt($ch, CURLOPT_HTTPHEADER, ["User-Agent: {$ua}", "Accept: application/json"]);
      $resp = curl_exec($ch);
      curl_close($ch);
    } catch (Throwable $e) { $resp = null; }
  }
  if ($resp === null) {
    $ctx = stream_context_create([
      'http' => [
        'method' => 'GET',
        'header' => "User-Agent: {$ua}\r\nAccept: application/json\r\n",
        'timeout' => 5,
      ]
    ]);
    try { $resp = @file_get_contents($url, false, $ctx); } catch (Throwable $e) { $resp = null; }
  }
  if ($resp) {
    $arr = json_decode($resp, true);
    if (is_array($arr) && isset($arr[0])) {
      $lat = isset($arr[0]['lat']) ? (float)$arr[0]['lat'] : null;
      $lng = isset($arr[0]['lon']) ? (float)$arr[0]['lon'] : null;
      if ($lat !== null && $lng !== null) { return [$lat, $lng]; }
    }
  }
  return [null, null];
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $input = json_decode($raw, true);
  if (!$input || !is_array($input)) {
    $input = [];
    parse_str($raw, $input);
    if (!$input || !is_array($input)) { $input = $_POST; }
  }

  $orderId = isset($input['order_id']) ? (int)$input['order_id'] : null;
  $orderCode = isset($input['order_code']) ? sanitizeInput($input['order_code']) : null;
  if (!$orderId && $orderCode) {
    $q = $pdo->prepare('SELECT id FROM orders WHERE order_code = :oc LIMIT 1');
    $q->execute([':oc' => $orderCode]);
    $row = $q->fetch(PDO::FETCH_ASSOC);
    if ($row) { $orderId = (int)$row['id']; }
  }
  if (!$orderId) { jsonResponse(['ok' => false, 'error' => 'order_id required'], 422); }

  $courier = isset($input['courier']) ? sanitizeInput($input['courier']) : null;
  $status = isset($input['status']) ? sanitizeInput($input['status']) : 'In Transit';
  $lastLocation = isset($input['last_location']) ? sanitizeInput($input['last_location']) : null;
  $eta = isset($input['eta']) ? sanitizeInput($input['eta']) : null;
  $mapUrl = isset($input['map_url']) ? sanitizeInput($input['map_url']) : null;
  $mapUrlRaw = $mapUrl ? html_entity_decode($mapUrl, ENT_QUOTES) : null;
  $lat = isset($input['lat']) && is_numeric($input['lat']) ? (float)$input['lat'] : null;
  $lng = isset($input['lng']) && is_numeric($input['lng']) ? (float)$input['lng'] : null;
  if (($lat === null || $lng === null) && $mapUrl) {
    $parseTarget = $mapUrlRaw ?: $mapUrl;
    [$pl, $pg] = parseLatLngFromUrl($parseTarget);
    if ($pl !== null && $pg !== null) { $lat = (float)$pl; $lng = (float)$pg; }
    if (($lat === null || $lng === null)) {
      $qstr = extractQueryFromMapsUrl($parseTarget);
      if ($qstr) {
        [$glat, $glng] = geocodeQuery($qstr);
        if ($glat !== null && $glng !== null) { $lat = (float)$glat; $lng = (float)$glng; }
      }
    }
  }
  if (($lat === null || $lng === null) && $lastLocation) {
    [$glat2, $glng2] = geocodeQuery($lastLocation);
    if ($glat2 !== null && $glng2 !== null) { $lat = (float)$glat2; $lng = (float)$glng2; }
  }
  $trackCode = isset($input['tracking_code']) ? sanitizeInput($input['tracking_code']) : null;
  if (!$trackCode) { $trackCode = 'TRK-' . ($orderCode ?: ('ORD' . $orderId)); }

  $st = $pdo->prepare('INSERT INTO tracking (order_id, tracking_code, courier, status, last_location, map_url, eta, lat, lng) VALUES (:oid, :code, :courier, :status, :loc, :map, :eta, :lat, :lng)');
  $st->execute([':oid' => $orderId, ':code' => $trackCode, ':courier' => $courier, ':status' => $status, ':loc' => $lastLocation, ':map' => $mapUrl, ':eta' => $eta, ':lat' => $lat, ':lng' => $lng]);
  propagateProductMaps($pdo, (int)$orderId, $mapUrl, $lat, $lng);
  jsonResponse(['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'tracking_code' => $trackCode]);
}

if ($method === 'PUT' || $method === 'PATCH') {
  $raw = file_get_contents('php://input');
  parse_str($raw, $input);
  $id = null;
  if (isset($_GET['id']) && is_numeric($_GET['id'])) { $id = (int)$_GET['id']; }
  else if (isset($_POST['id']) && is_numeric($_POST['id'])) { $id = (int)$_POST['id']; }
  else if (isset($input['id']) && is_numeric($input['id'])) { $id = (int)$input['id']; }

  $code = null;
  if (isset($_GET['code'])) { $code = sanitizeInput($_GET['code']); }
  else if (isset($_POST['code'])) { $code = sanitizeInput($_POST['code']); }
  else if (isset($input['code'])) { $code = sanitizeInput($input['code']); }
  if (!$id && !$code) { jsonResponse(['ok' => false, 'error' => 'id or code required'], 422); }
  $fields = ['courier','status','last_location','eta','lat','lng','map_url'];
  $set = [];
  $params = [];
  foreach ($fields as $f) {
    $has = isset($input[$f]) || isset($_POST[$f]) || isset($_GET[$f]);
    if ($has) {
      $val = isset($input[$f]) ? $input[$f] : (isset($_POST[$f]) ? $_POST[$f] : $_GET[$f]);
      if (in_array($f, ['lat','lng'])) { $val = is_numeric($val) ? (float)$val : null; }
      else { $val = sanitizeInput((string)$val); }
      $set[] = "$f = :$f";
      $params[":$f"] = $val;
    }
  }
  if (!isset($params[':lat']) && !isset($params[':lng']) && isset($params[':map_url']) && $params[':map_url']) {
    $raw = html_entity_decode($params[':map_url'], ENT_QUOTES);
    $parseTarget = $raw ?: $params[':map_url'];
    [$pl, $pg] = parseLatLngFromUrl($parseTarget);
    if ($pl !== null && $pg !== null) { $set[] = 'lat = :lat'; $params[':lat'] = (float)$pl; $set[] = 'lng = :lng'; $params[':lng'] = (float)$pg; }
    if (!isset($params[':lat']) || !isset($params[':lng'])) {
      $qstr = extractQueryFromMapsUrl($parseTarget);
      if ($qstr) {
        [$glat, $glng] = geocodeQuery($qstr);
        if ($glat !== null && $glng !== null) { $set[] = 'lat = :lat'; $params[':lat'] = (float)$glat; $set[] = 'lng = :lng'; $params[':lng'] = (float)$glng; }
      }
    }
  }
  if (!$set) { jsonResponse(['ok' => false, 'error' => 'No fields to update'], 422); }
  $sql = 'UPDATE tracking SET ' . implode(', ', $set) . ' WHERE ' . ($id ? 'id = :id' : 'tracking_code = :code');
  if ($id) { $params[':id'] = $id; } else { $params[':code'] = $code; }
  $st = $pdo->prepare($sql);
  $st->execute($params);
  try {
    $orderId = null;
    if ($id) {
      $q = $pdo->prepare('SELECT order_id FROM tracking WHERE id = :id LIMIT 1');
      $q->execute([':id' => $id]);
      $row = $q->fetch(PDO::FETCH_ASSOC);
      if ($row) { $orderId = (int)$row['order_id']; }
    } else if ($code) {
      $q = $pdo->prepare('SELECT order_id FROM tracking WHERE tracking_code = :code LIMIT 1');
      $q->execute([':code' => $code]);
      $row = $q->fetch(PDO::FETCH_ASSOC);
      if ($row) { $orderId = (int)$row['order_id']; }
    }
    $curMap = isset($params[':map_url']) ? $params[':map_url'] : null;
    $curLat = isset($params[':lat']) && is_numeric($params[':lat']) ? (float)$params[':lat'] : null;
    $curLng = isset($params[':lng']) && is_numeric($params[':lng']) ? (float)$params[':lng'] : null;
    propagateProductMaps($pdo, (int)$orderId, $curMap, $curLat, $curLng);
  } catch (Throwable $e) { }
  jsonResponse(['ok' => true]);
}

jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
?>
