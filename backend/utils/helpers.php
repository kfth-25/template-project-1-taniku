<?php
// Utility Helper Functions

// CORS Headers
function setCORSHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : null;

    // Allow common localhost patterns and dev ports
    $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5176',
        'http://127.0.0.1:5177',
    ];

    $isAllowed = false;
    if ($origin) {
        // Exact allow list
        if (in_array($origin, $allowedOrigins, true)) {
            $isAllowed = true;
        } else {
            // Pattern: http://localhost:<port> or http://127.0.0.1:<port>
            if (preg_match('/^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/', $origin)) {
                $isAllowed = true;
            }
        }
    }

    if ($isAllowed) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit(0);
    }
}

// JSON Response Helper
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Input Validation Helper
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!array_key_exists($field, $data)) {
            $missing[] = $field;
            continue;
        }
        $value = $data[$field];
        // Strings must not be empty after trim; numbers may be 0
        if (is_string($value)) {
            if (trim($value) === '') {
                $missing[] = $field;
            }
        } elseif ($value === null) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Email Validation Helper
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Password Validation Helper
function validatePassword($password) {
    // Minimum 6 characters
    return strlen($password) >= 6;
}

// Sanitize Input Helper
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim((string)$input)));
}
?>
