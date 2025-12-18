<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'taniku_db');

// Create database connection
function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USERNAME, DB_PASSWORD, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4'
        ]);
        return $pdo;
    } catch(PDOException $e) {
        $msg = $e->getMessage();
        if (stripos($msg, 'Unknown database') !== false || stripos($msg, 'doesn\'t exist') !== false) {
            try {
                $root = new PDO("mysql:host=" . DB_HOST, DB_USERNAME, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                $root->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $root = null;
                $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USERNAME, DB_PASSWORD, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4'
                ]);
                return $pdo;
            } catch (PDOException $e2) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode(['ok' => false, 'error' => 'Failed to create database: ' . $e2->getMessage()]);
                exit;
            }
        }
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Connection failed: ' . $msg]);
        exit;
    }
}
?>
