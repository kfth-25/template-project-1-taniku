<?php
// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['error' => 'Invalid JSON input'], 400);
}

// Validate required fields
if (!isset($input['email']) || !isset($input['password'])) {
    jsonResponse(['error' => 'Email and password are required'], 400);
}

$email = trim($input['email']);
$password = $input['password'];

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email format'], 400);
}

try {
    $pdo = getDBConnection();
    
    // Get user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Generate simple token (in production, use JWT)
    $token = bin2hex(random_bytes(32));
    
    // Store token in database
    $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = NOW()");
    $stmt->execute([$user['id'], $token]);
    
    jsonResponse([
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email']
        ],
        'token' => $token
    ]);
    
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>