CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE,
  user_id INT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30) NULL,
  shipping_address TEXT NOT NULL,
  status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50) NULL,
  shipping_method VARCHAR(50) NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  INDEX idx_orders_order_date (order_date),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order_id (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NULL,
  address_line1 VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  province VARCHAR(120) NULL,
  postal_code VARCHAR(20) NULL,
  last_order_date DATETIME NULL,
  last_products TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_email (user_id, email),
  INDEX idx_customers_email (email),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50) NULL;
