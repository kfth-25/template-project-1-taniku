<?php
require_once __DIR__ . '/../config/config.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['file'])) {
    jsonResponse(['ok' => false, 'error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['ok' => false, 'error' => 'Upload error: ' . $file['error']], 400);
}

// Validate size
if ($file['size'] > UPLOAD_MAX_SIZE) {
    jsonResponse(['ok' => false, 'error' => 'File too large'], 413);
}

// Validate type
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, UPLOAD_ALLOWED_TYPES)) {
    jsonResponse(['ok' => false, 'error' => 'Invalid file type'], 415);
}

$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}

$safeBase = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
$filename = $safeBase . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
$destPath = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['ok' => false, 'error' => 'Failed to save file'], 500);
}

// Public path (served by PHP built-in server with backend as docroot)
$publicPath = '/uploads/' . $filename;

jsonResponse(['ok' => true, 'path' => $publicPath]);
?>