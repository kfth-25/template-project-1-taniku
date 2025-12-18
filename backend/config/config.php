<?php
// Main Configuration File
// Include all necessary configuration and utility files

// Include database configuration
require_once __DIR__ . '/database.php';

// Include utility helpers
require_once __DIR__ . '/../utils/helpers.php';

// Application Configuration
define('APP_NAME', 'Taniku API');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development');

// API Configuration
define('API_BASE_URL', '/backend');
define('FRONTEND_URL', 'http://localhost:5173');

// Security Configuration
define('JWT_SECRET', 'your-secret-key-here'); // Change this in production
define('SESSION_TIMEOUT', 3600); // 1 hour

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif']);
?>