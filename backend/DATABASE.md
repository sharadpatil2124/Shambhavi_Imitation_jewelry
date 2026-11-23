# Database (MySQL)

The backend stores everything in MySQL. It works with MySQL 5.7.8+, MySQL 8, and MariaDB 10.2.7+
(which is what most hosting providers, including Hostinger, call "MySQL").

You do not need to write any SQL. The tables are created by **migrations**: numbered `.sql` files in
`db/migrations/` that the server applies automatically when it starts.

## 1. Connection settings

Put these in `backend/.env` (see `.env.example`):

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=shambhavi_jewelry
```

On a hosting provider, create a database and a database user in the control panel, then use the
host, database name, user and password it shows you. If your hosting panel has an environment-variables
section for the Node.js app, you can set the same five values there instead of in `.env`.

## 2. Set up the database

```
cd backend
npm run db:setup        # creates the database (if your account may) and all tables, then lists them
npm run seed:admin      # creates the admin login (admin@shambhavi.com / admin123), change the password after
npm run seed:catalog    # optional: adds the five starter categories
npm start
```

## Migrations

| File | Creates |
| --- | --- |
| `001_create_users.sql` | `users`, `user_addresses` |
| `002_create_catalog.sql` | `categories`, `products` |
| `003_create_carts_and_wishlists.sql` | `carts`, `cart_items`, `wishlists`, `wishlist_items` |
| `004_create_orders.sql` | `orders`, `order_items` |
| `005_create_reviews.sql` | `reviews` |
| `006_create_store_content.sql` | `settings`, `enquiries`, `coupons`, `banners` |

Commands:

```
npm run db:migrate          # apply any migrations that have not been applied yet
npm run db:migrate:status   # list every migration as applied (with date) or PENDING
```

- Each applied file is recorded in the table `schema_migrations`, so it runs only once.
- The server runs `db:migrate` by itself on every start, so a deploy with a new migration file
  updates the database automatically. Several servers starting at once is safe: only one migrates.
- The files are plain SQL. Where you cannot run commands (for example only phpMyAdmin is
  available), import the files there in number order. When the server or `npm run db:migrate`
  runs later, it simply records them: every file uses `CREATE TABLE IF NOT EXISTS`, so running it
  again changes nothing.

### Changing the database later

1. Add a new file with the next number, e.g. `db/migrations/007_add_gift_note.sql`:
   ```sql
   ALTER TABLE orders ADD COLUMN gift_note TEXT NULL;
   ```
2. Add the field to the matching model in `models/` (e.g. `giftNote: 'string'` in `models/Order.js`).
3. Run `npm run db:migrate` (or just restart the server).

Never edit a migration that has already been applied. `db:migrate` will warn that it changed and
will not run it again; put the change in a new file instead. MySQL cannot undo table changes when a
file fails halfway, so keep each file small and safe to run again where possible.

## How the tables relate

- A user has saved addresses, one cart, one wishlist, orders and reviews.
- Deleting a product also removes it from carts and wishlists. Orders keep their record of what was
  bought, and reviews stay.
- A category that still has products cannot be deleted.
- Record IDs are 24-character codes (e.g. `6b043f4b70487aef61de5516`). The storefront and admin
  panel show the last six characters as the short order number.

## Backups

Use your hosting panel's backup feature, or locally:
`mysqldump -u root -p shambhavi_jewelry > backup.sql` (restore with `mysql -u root -p shambhavi_jewelry < backup.sql`).

## Tests

`npm test` runs without a database. To also run the database tests, point `MYSQL_TEST_URL` at a
test database. The tests wipe it, and also a second database with `_migrations` added to the name:
`MYSQL_TEST_URL=mysql://root:password@localhost:3306/shambhavi_test npm test`
