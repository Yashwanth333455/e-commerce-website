-- e_commerce_db schema
CREATE DATABASE IF NOT EXISTS e_commerce_db;
USE e_commerce_db;

CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  clerk_id     VARCHAR(255) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255),
  role         ENUM('admin','customer','tester') DEFAULT 'customer',
  last_login   TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  category       VARCHAR(100),
  price          DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image          VARCHAR(500),
  badge          VARCHAR(50),
  in_stock       BOOLEAN DEFAULT TRUE,
  rating         DECIMAL(3,1) DEFAULT 0,
  reviews        INT DEFAULT 0,
  description    TEXT,
  sizes          JSON,
  colors         JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  clerk_id         VARCHAR(255),
  customer_email   VARCHAR(255),
  customer_name    VARCHAR(255),
  total_amount     DECIMAL(10,2) NOT NULL,
  shipping_amount  DECIMAL(10,2) DEFAULT 0,
  status           ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  shipping_address JSON,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT,
  product_name VARCHAR(255),
  quantity     INT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  order_id            INT,
  razorpay_order_id   VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount              DECIMAL(10,2),
  status              ENUM('pending','success','failed') DEFAULT 'pending',
  method              VARCHAR(50),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_logins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  clerk_id   VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  name       VARCHAR(255),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  admin_clerk_id VARCHAR(255),
  admin_email    VARCHAR(255),
  action         VARCHAR(255),
  target_table   VARCHAR(100),
  target_id      VARCHAR(255),
  details        JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed admin users
INSERT IGNORE INTO users (clerk_id, email, name, role) VALUES
  ('seed_admin_1', 'vikaselle196@gmail.com', 'Vikas', 'admin'),
  ('seed_admin_2', 'yashwantreddy231@gmail.com', 'Yashwanth', 'admin');
