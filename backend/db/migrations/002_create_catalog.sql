-- Migration 002_create_catalog
-- Product catalogue.
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.
--
-- Relationships:
--   categories 1-n products (a category that still has products cannot be deleted)

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image TEXT NULL,
  slug VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `name` (name),
  UNIQUE KEY `slug` (slug),
  KEY idx_categories_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  category_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NULL,
  price DECIMAL(12,2) NULL,
  original_price DECIMAL(12,2) NULL,
  discount DOUBLE NULL DEFAULT 0,
  description TEXT NULL,
  details JSON NULL,
  colors JSON NULL,
  sizes JSON NULL,
  images JSON NULL,
  stock INT NULL DEFAULT 0,
  rating DOUBLE NULL DEFAULT 4.5,
  reviews_count INT NULL DEFAULT 0,
  is_trending TINYINT(1) NULL DEFAULT 0,
  is_new_arrival TINYINT(1) NULL DEFAULT 0,
  finish_type VARCHAR(255) NULL DEFAULT '',
  weight VARCHAR(255) NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `sku` (sku),
  KEY idx_products_name (name),
  KEY idx_products_category (category_id),
  KEY idx_products_created (created_at),
  KEY idx_products_price (price),
  KEY idx_products_stock (stock),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
