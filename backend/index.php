<?php
require_once 'config/config.php';

setCORSHeaders();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Remove query string if present
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove /backend prefix if present
$path = str_replace('/backend', '', $path);

// Remove leading slash if present
$path = ltrim($path, '/');

// Route handling
switch ($path) {
    case '':
    case 'index.php':
        jsonResponse(['message' => 'Taniku API Server', 'status' => 'running', 'version' => APP_VERSION]);
        break;
        
    case 'register':
        if ($method === 'POST') {
            require_once 'auth/register.php';
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;
        
    case 'login':
        if ($method === 'POST') {
            require_once 'auth/login.php';
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;
        
    case 'user':
    case 'users':
        require_once 'api/user.php';
        break;
    case 'health':
        require_once 'api/health.php';
        break;
    case 'orders':
        require_once 'api/orders.php';
        break;
    case 'api/orders.php':
        require_once 'api/orders.php';
        break;
    case 'api/products.php':
        require_once 'api/products.php';
        break;
    case 'tracking':
        require_once 'api/tracking.php';
        break;
    case 'api/tracking.php':
        require_once 'api/tracking.php';
        break;
    case 'database/setup_base.php':
        require_once 'database/setup_base.php';
        break;
    case 'database/setup_orders.php':
        require_once 'database/setup_orders.php';
        break;
    case 'database/seed_products.php':
        require_once 'database/seed_products.php';
        break;
        
    default:
        $safePath = preg_replace('/[^a-zA-Z0-9_\-\/\.]/', '', $path);
        $candidates = [
            $safePath,
            'api/' . $safePath,
            'database/' . $safePath,
        ];
        foreach ($candidates as $cand) {
            $full = __DIR__ . '/' . $cand;
            if (strpos(realpath($full) ?: '', realpath(__DIR__)) === 0 && is_file($full)) {
                require_once $cand;
                exit;
            }
        }
        jsonResponse(['error' => 'Endpoint not found', 'path' => $path, 'method' => $method], 404);
        break;
}
?>
