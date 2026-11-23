-- Migration 004_create_orders
-- Orders and the items in them.
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.
--
-- Relationships:
--   users 1-n orders 1-n order_items (an order is kept if the user is deleted, and its items keep
--     the product ID as a record of the sale even if the product is deleted later)

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
  shipping_address_street TEXT NULL,
  shipping_address_city VARCHAR(255) NULL,
  shipping_address_state VARCHAR(255) NULL,
  shipping_address_pincode VARCHAR(255) NULL,
  shipping_address_phone VARCHAR(255) NULL,
  shipping_address_email VARCHAR(255) NULL,
  payment_method VARCHAR(20) NULL,
  payment_result_id VARCHAR(255) NULL,
  payment_result_status VARCHAR(255) NULL,
  payment_result_email_address VARCHAR(255) NULL,
  razorpay_order_id VARCHAR(255) NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  razorpay_signature VARCHAR(255) NULL,
  items_price DECIMAL(12,2) NULL DEFAULT 0,
  tax_price DECIMAL(12,2) NULL DEFAULT 0,
  shipping_price DECIMAL(12,2) NULL DEFAULT 0,
  discount_price DECIMAL(12,2) NULL DEFAULT 0,
  total_price DECIMAL(12,2) NULL DEFAULT 0,
  is_paid TINYINT(1) NULL DEFAULT 0,
  paid_at DATETIME(3) NULL,
  order_status VARCHAR(40) NULL DEFAULT 'Processing',
  cancellation_reason TEXT NULL,
  stock_restored TINYINT(1) NULL DEFAULT 0,
  is_refunded TINYINT(1) NULL DEFAULT 0,
  refund_amount DECIMAL(12,2) NULL DEFAULT 0,
  refund_reason TEXT NULL,
  refunded_at DATETIME(3) NULL,
  refund_transaction_id VARCHAR(255) NULL DEFAULT '',
  courier_name VARCHAR(255) NULL,
  tracking_number VARCHAR(255) NULL,
  tracking_id VARCHAR(255) NULL,
  delivered_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_orders_user (user_id, created_at),
  KEY idx_orders_status (order_status, created_at),
  KEY idx_orders_created (created_at),
  KEY idx_orders_razorpay_order (razorpay_order_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position INT NOT NULL,
  product_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
  name VARCHAR(255) NULL,
  quantity INT NULL,
  image TEXT NULL,
  price DECIMAL(12,2) NULL,
  color VARCHAR(255) NULL,
  size VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id, position),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
