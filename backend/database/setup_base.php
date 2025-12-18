<?php
require_once __DIR__ . '/../config/config.php';
setCORSHeaders();
try {
    $pdo = getDBConnection();
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    $pdo->exec('CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(120) UNIQUE,
        description TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB');
    $pdo->exec('CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(120) UNIQUE,
        category_id INT NULL,
        description TEXT NULL,
        price DECIMAL(12,2) NOT NULL,
        stock INT DEFAULT 0,
        status ENUM("active","inactive") DEFAULT "active",
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_products_category_id (category_id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    ) ENGINE=InnoDB');
    $pdo->exec('CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        path VARCHAR(255) NOT NULL,
        alt_text VARCHAR(255) NULL,
        is_primary TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_images_pid (product_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB');
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    jsonResponse(['ok' => true]);
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
