-- Migration 003_create_carts_and_wishlists
-- Each customer's cart and wishlist.
--
-- Plain SQL: runs with "npm run db:migrate" (recorded in schema_migrations), or by hand in
-- MySQL Workbench / phpMyAdmin. CREATE TABLE IF NOT EXISTS makes it safe to run again.
--
-- Relationships:
--   users 1-1 carts 1-n cart_items (cart lines are removed if the product is deleted)
--   users 1-1 wishlists 1-n wishlist_items (saved items are removed if the product is deleted)

CREATE TABLE IF NOT EXISTS carts (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `user` (user_id),
  KEY idx_carts_updated (updated_at),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position INT NOT NULL,
  product_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  color VARCHAR(255) NULL,
  size VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_cart_items_cart (cart_id, position),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `user` (user_id),
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wishlist_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position INT NOT NULL,
  product_id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `product` (wishlist_id, product_id),
  KEY idx_wishlist_items_order (wishlist_id, position),
  KEY idx_wishlist_items_product (product_id),
  CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
