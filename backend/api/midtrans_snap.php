<?php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/utils/helpers.php';
setCORSHeaders();
require_once dirname(__DIR__) . '/midtrans-php-master/Midtrans.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
  $input = $_POST ?? [];
}

$serverKey = getenv('MIDTRANS_SERVER_KEY');
if (!$serverKey) {
  $serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? ($_SERVER['MIDTRANS_SERVER_KEY'] ?? null);
}
if (!$serverKey) {
  $candidates = [
    dirname(__DIR__) . '/config/.midtrans_server_key',
    dirname(__DIR__) . '/config/midtrans_server_key.txt',
  ];
  foreach ($candidates as $f) {
    if (is_file($f)) {
      $v = trim((string)file_get_contents($f));
      if (strlen($v) > 5) { $serverKey = $v; break; }
    }
  }
}
if (!$serverKey || strlen($serverKey) < 5) {
  http_response_code(500);
  echo json_encode(['error' => 'MIDTRANS_SERVER_KEY not set']);
  exit;
}

\Midtrans\Config::$serverKey = $serverKey;
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

$env = getenv('MIDTRANS_ENV') ?: 'sandbox';
\Midtrans\Config::$isProduction = strtolower($env) === 'production';

$orderId = isset($input['order_id']) ? (string)$input['order_id'] : ('ORD-' . time());
$grossAmount = isset($input['gross_amount']) ? (int)$input['gross_amount'] : (int)($input['total'] ?? 0);
if ($grossAmount <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'gross_amount must be > 0']);
  exit;
}

$params = [
  'transaction_details' => [
    'order_id' => $orderId,
    'gross_amount' => $grossAmount,
  ],
];

if (isset($input['item_details'])) {
  if (is_string($input['item_details'])) {
    $items = json_decode($input['item_details'], true);
    if (is_array($items)) $params['item_details'] = $items;
  } else if (is_array($input['item_details'])) {
    $params['item_details'] = $input['item_details'];
  }
} elseif (isset($input['items'])) {
  $items = $input['items'];
  if (is_string($items)) $items = json_decode($items, true);
  if (is_array($items)) $params['item_details'] = $items;
}

if (isset($input['customer_details']) && is_array($input['customer_details'])) {
  $params['customer_details'] = [
    'first_name' => (string)($input['customer_details']['first_name'] ?? ''),
    'last_name' => (string)($input['customer_details']['last_name'] ?? ''),
    'email' => (string)($input['customer_details']['email'] ?? ''),
    'phone' => (string)($input['customer_details']['phone'] ?? ''),
  ];
} else {
  $params['customer_details'] = [
    'first_name' => (string)($input['name'] ?? ''),
    'last_name' => '',
    'email' => (string)($input['email'] ?? ''),
    'phone' => (string)($input['phone'] ?? ''),
  ];
}

try {
  $snapToken = \Midtrans\Snap::getSnapToken($params);
  echo json_encode(['ok' => true, 'token' => $snapToken]);
} catch (\Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
