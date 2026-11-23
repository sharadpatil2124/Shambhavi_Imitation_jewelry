-- Migration 006_create_store_content
-- Store settings (one row), contact-form enquiries, coupons and banners.
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.

CREATE TABLE IF NOT EXISTS settings (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  store_name VARCHAR(255) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(255) NULL,
  address TEXT NULL,
  currency VARCHAR(255) NULL,
  tax_rate DOUBLE NULL,
  shipping_charge DECIMAL(12,2) NULL,
  free_shipping_threshold DECIMAL(12,2) NULL,
  social_instagram TEXT NULL,
  social_facebook TEXT NULL,
  social_pinterest TEXT NULL,
  cod_enabled TINYINT(1) NULL,
  online_payment_enabled TINYINT(1) NULL,
  logo_url TEXT NULL,
  show_special_offer TINYINT(1) NULL,
  special_offer_tagline TEXT NULL,
  special_offer_title TEXT NULL,
  special_offer_subtitle TEXT NULL,
  special_offer_coupon_code VARCHAR(255) NULL,
  special_offer_discount_percentage DOUBLE NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(255) NULL,
  subject TEXT NULL,
  message TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_enquiries_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  code VARCHAR(255) NOT NULL,
  discount_percentage DOUBLE NULL,
  expiry_date DATETIME(3) NULL,
  min_order_value DECIMAL(12,2) NULL DEFAULT 0,
  is_active TINYINT(1) NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `code` (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(255) NULL,
  subtitle TEXT NULL,
  image TEXT NULL,
  link TEXT NULL,
  is_active TINYINT(1) NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
