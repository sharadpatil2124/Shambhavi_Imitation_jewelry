-- Migration 001_create_users
-- Customer and admin accounts, and their saved addresses.
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.
--
-- Relationships:
--   users 1-n user_addresses (addresses are deleted with the user)

CREATE TABLE IF NOT EXISTS users (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NULL,
  phone VARCHAR(255) NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  reset_password_token VARCHAR(255) NULL,
  reset_password_expires DATETIME(3) NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  otp VARCHAR(255) NULL,
  otp_expires DATETIME(3) NULL,
  otp_attempts INT NULL DEFAULT 0,
  reset_password_otp VARCHAR(255) NULL,
  reset_password_otp_expires DATETIME(3) NULL,
  reset_password_otp_attempts INT NULL DEFAULT 0,
  pending_email VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `email` (email),
  KEY idx_users_role_verified (role, is_verified, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position INT NOT NULL,
  street TEXT NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  pincode VARCHAR(255) NULL,
  country VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_user_addresses_user (user_id, position),
  CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
