<?php
// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['error' => 'Invalid JSON input'], 400);
}

// Validate required fields
$required_fields = ['name', 'email', 'password'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        jsonResponse(['error' => "Field '$field' is required"], 400);
    }
}

$name = trim($input['name']);
$email = trim($input['email']);
$password = $input['password'];

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email format'], 400);
}

// Validate password length
if (strlen($password) < 6) {
    jsonResponse(['error' => 'Password must be at least 6 characters'], 400);
}

try {
    $pdo = getDBConnection();
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email already exists'], 422);
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->execute([$name, $email, $hashed_password]);
    
    $user_id = $pdo->lastInsertId();
    
    // Generate simple token (in production, use JWT)
    $token = bin2hex(random_bytes(32));
    
    // Store token in database (create sessions table if needed)
    $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = NOW()");
    $stmt->execute([$user_id, $token]);
    
    jsonResponse([
        'message' => 'User registered successfully',
        'user' => [
            'id' => $user_id,
            'name' => $name,
            'email' => $email
        ],
        'token' => $token
    ], 201);
    
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>