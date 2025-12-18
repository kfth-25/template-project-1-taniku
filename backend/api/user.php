<?php
// Get Authorization header
$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    $auth_header = $headers['Authorization'];
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
    }
}

if (!$token) {
    jsonResponse(['error' => 'Authorization token required'], 401);
}

try {
    $pdo = getDBConnection();
    
    // Get user by token
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.created_at 
        FROM users u 
        JOIN user_sessions s ON u.id = s.user_id 
        WHERE s.token = ? AND s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        jsonResponse(['error' => 'Invalid or expired token'], 401);
    }
    
    jsonResponse([
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'created_at' => $user['created_at']
        ]
    ]);
    
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>