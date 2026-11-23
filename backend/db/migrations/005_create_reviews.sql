-- Migration 005_create_reviews
-- Product reviews (one per customer per product).
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.
--
-- Relationships:
--   users 1-n reviews n-1 products (a review stays if its user or product is deleted)

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
  product_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
  name VARCHAR(255) NULL,
  rating DOUBLE NULL,
  title TEXT NULL,
  comment TEXT NULL,
  is_approved TINYINT(1) NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `user` (user_id, product_id),
  KEY idx_reviews_product (product_id, is_approved, created_at),
  KEY idx_reviews_created (created_at),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
