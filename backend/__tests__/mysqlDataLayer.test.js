import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { castValue, CastError } from '../db/model.js';
import { newId, isValidId } from '../db/ids.js';
import { errorHandler } from '../middleware/errorMiddleware.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/userModel.js';

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};
const quiet = (fn) => { const e = console.error; console.error = () => {}; try { return fn(); } finally { console.error = e; } };

describe('MySQL data layer: IDs, casting and validation (no database needed)', () => {
  it('creates 24-character IDs in the same format as before', () => {
    const a = newId();
    const b = newId();
    assert.ok(isValidId(a) && isValidId(b));
    assert.notStrictEqual(a, b);
    assert.ok(!isValidId('abc') && !isValidId(undefined));
  });

  it('converts input values to the field types', () => {
    const num = { type: 'number', path: 'price', castName: 'Number' };
    assert.strictEqual(castValue(num, '1499'), 1499);
    assert.strictEqual(castValue(num, ''), null);
    assert.throws(() => castValue(num, 'abc'), CastError);
    assert.strictEqual(castValue({ type: 'boolean', castName: 'Boolean' }, 'yes'), true);
    assert.strictEqual(castValue({ type: 'boolean', castName: 'Boolean' }, 'false'), false);
    assert.strictEqual(castValue({ type: 'string', trim: true, lowercase: true }, '  A@B.COM '), 'a@b.com');
    assert.deepStrictEqual(castValue({ type: 'stringArray', trim: true }, ' one '), ['one']);
  });

  it('reports values that cannot be converted before missing fields, with the original messages', () => {
    const err = new Product({ price: 'abc', images: ['x'] }).validateSync();
    const keys = Object.keys(err.errors);
    assert.strictEqual(keys[0], 'price');
    assert.strictEqual(err.errors.price.message, 'Cast to Number failed for value "abc" (type string) at path "price"');
    assert.strictEqual(err.errors.name.message, 'Please provide the product name');
  });

  it('builds the same JSON as before (unpaid order keeps paidAt: null, empty payment details are left out)', () => {
    const order = new Order({
      user: newId(),
      orderItems: [{ product: newId(), name: 'Set', quantity: 1, image: 'i', price: 10 }],
      shippingAddress: { street: 's', city: 'c', state: 'st', pincode: '1', phone: '9', email: 'e@x.com' },
      paymentMethod: 'COD',
      paidAt: null,
      paymentResult: undefined
    });
    const json = order.toJSON();
    assert.ok(isValidId(json._id));
    assert.strictEqual(json.paidAt, null);
    assert.strictEqual(json.paymentResult, undefined);
    assert.strictEqual(json.orderStatus, 'Processing');
    assert.deepStrictEqual(Object.keys(json.orderItems[0]).sort(), ['image', 'name', 'price', 'product', 'quantity']);
    assert.strictEqual(json.shippingAddress.city, 'c');
  });

  it('never includes the password in JSON', () => {
    const user = new User({ name: 'A', email: 'a@b.com', password: 'secret12' });
    assert.strictEqual(user.toJSON().password, undefined);
    assert.strictEqual(user.isModified('password'), true);
  });

  it('rejects a malformed ID in a lookup with the same 400 error as before', () => {
    let error;
    try { Product.findById('not-an-id'); } catch (e) { error = e; }
    assert.ok(error instanceof CastError);
    const res = mockRes();
    quiet(() => errorHandler(error, {}, res, () => {}));
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.message, 'Resource not found: Invalid database ID format');
  });

  it('turns MySQL duplicate-key errors into the same message (MySQL 8 and MariaDB wording)', () => {
    for (const sqlMessage of ["Duplicate entry 'a@b.com' for key 'users.email'", "Duplicate entry 'a@b.com' for key 'email'"]) {
      const err = Object.assign(new Error(sqlMessage), { code: 'ER_DUP_ENTRY', errno: 1062, sqlMessage });
      const res = mockRes();
      quiet(() => errorHandler(err, {}, res, () => {}));
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.message, 'Duplicate field value entered: An item with this email already exists');
    }
  });

  it('turns "value too long" into a 400 error', () => {
    const sqlMessage = "Data too long for column 'name' at row 1";
    const res = mockRes();
    quiet(() => errorHandler(Object.assign(new Error(sqlMessage), { code: 'ER_DATA_TOO_LONG', sqlMessage }), {}, res, () => {}));
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.message, 'The name entered is too long');
  });
});

// Runs only when a test database is given, e.g.
//   MYSQL_TEST_URL=mysql://root:password@localhost:3306/shambhavi_test npm test
// The database named there is emptied and recreated by this test.
const TEST_URL = process.env.MYSQL_TEST_URL;

describe('MySQL data layer against a real database', { skip: !TEST_URL && 'set MYSQL_TEST_URL to run' }, () => {
  let db; let migrate;
  let Category; let Cart; let Wishlist;

  before(async () => {
    process.env.MYSQL_URL = TEST_URL;
    delete process.env.MYSQL_HOST;
    db = await import('../config/db.js');
    migrate = await import('../db/migrate.js');
    Category = (await import('../models/Category.js')).default;
    Cart = (await import('../models/Cart.js')).default;
    Wishlist = (await import('../models/Wishlist.js')).default;
    const name = db.getDbConfig().database;
    const quiet = { log: () => {} };
    await migrate.prepareDatabase(quiet);
    await db.query('DROP DATABASE ??', [name]);
    await db.closeDB();
    await migrate.prepareDatabase(quiet);
  });
  after(async () => { await db?.closeDB(); });

  it('saves and reads users (password hashed and hidden, addresses in their own table)', async () => {
    const user = await User.create({ name: ' Asha ', email: ' Asha@Example.com ', password: 'secret12', addresses: [{ city: 'Pune' }] });
    assert.strictEqual(user.email, 'asha@example.com');
    assert.notStrictEqual(user.password, 'secret12');

    const found = await User.findOne({ email: 'ASHA@example.com' });
    assert.strictEqual(found.name, 'Asha');
    assert.strictEqual(found.password, undefined);
    assert.deepStrictEqual(found.addresses, [{ city: 'Pune', country: 'India' }]);
    assert.strictEqual(found.phone, undefined);

    const withPassword = await User.findById(user._id).select('+password');
    assert.ok(await withPassword.matchPassword('secret12'));
    await assert.rejects(User.create({ name: 'B', email: 'asha@example.com', password: 'secret12' }), { code: 'ER_DUP_ENTRY' });
  });

  it('writes only changed fields, so an edit never overwrites stock taken in the meantime', async () => {
    const category = await Category.create({ name: 'Rings', image: 'i' });
    assert.strictEqual(category.slug, 'rings');
    const product = await Product.create({ name: 'Ring', sku: 'r-1', category: category._id, price: 100, originalPrice: 200, description: 'd', images: ['a'], stock: 10 });
    assert.strictEqual(product.sku, 'R-1');
    assert.strictEqual(product.discount, 50);

    const loaded = await Product.findById(product._id);
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -3 } });
    loaded.name = 'Silver Ring';
    await loaded.save();
    const after = await Product.findById(product._id);
    assert.strictEqual(after.stock, 7);
    assert.strictEqual(after.name, 'Silver Ring');
  });

  it('claims stock atomically and refuses when there is not enough', async () => {
    const p = await Product.findOne({ sku: 'R-1' });
    const ok = await Product.findOneAndUpdate({ _id: p._id, stock: { $gte: 7 } }, { $inc: { stock: -7 } }, { new: true });
    assert.strictEqual(ok.stock, 0);
    const refused = await Product.findOneAndUpdate({ _id: p._id, stock: { $gte: 1 } }, { $inc: { stock: -1 } }, { new: true });
    assert.strictEqual(refused, null);
  });

  it('searches text literally (%, _ and brackets are not wildcards)', async () => {
    const category = await Category.findOne({ name: 'rings' });
    await Product.create({ name: '100% Gold_Look (set)', sku: 'G-1', category: category._id, price: 1, originalPrice: 1, description: 'd', images: ['a'] });
    assert.strictEqual(await Product.countDocuments({ name: { $contains: '0% G' } }), 1);
    assert.strictEqual(await Product.countDocuments({ name: { $contains: '_' } }), 1);
    assert.strictEqual(await Product.countDocuments({ name: { $contains: 'x%' } }), 0);
    assert.strictEqual(await Product.countDocuments({ name: { $contains: '(SET)' } }), 1);
  });

  it('creates one cart per user, fills in product details, and drops lines of deleted products', async () => {
    const user = await User.findOne({ email: 'asha@example.com' });
    const [c1, c2] = await Promise.all([
      Cart.findOneAndUpdate({ user: user._id }, { $setOnInsert: { user: user._id, items: [] } }, { upsert: true, new: true }),
      Cart.findOneAndUpdate({ user: user._id }, { $setOnInsert: { user: user._id, items: [] } }, { upsert: true, new: true })
    ]);
    assert.strictEqual(c1._id, c2._id);

    const ring = await Product.findOne({ sku: 'G-1' });
    c1.items.push({ product: ring._id, quantity: 2, color: 'Gold' });
    await c1.save();
    const cart = await Cart.findOne({ user: user._id });
    await cart.populate({ path: 'items.product', select: 'name price category', populate: { path: 'category', select: 'name' } });
    assert.strictEqual(cart.items[0].product.name, '100% Gold_Look (set)');
    assert.strictEqual(cart.items[0].product.category.name, 'Rings');
    assert.strictEqual(cart.toJSON().items[0].quantity, 2);

    await Wishlist.create({ user: user._id, products: [ring._id] });
    await ring.deleteOne();
    assert.strictEqual((await Cart.findOne({ user: user._id })).items.length, 0);
    assert.strictEqual((await Wishlist.findOne({ user: user._id })).products.length, 0);
  });

  it('keeps every field of an order, including its items and nested address', async () => {
    const user = await User.findOne({ email: 'asha@example.com' });
    const order = await Order.create({
      user: user._id,
      orderItems: [{ product: newId(), name: 'Set', quantity: 2, image: 'i', price: 1499.5, color: 'Red' }],
      shippingAddress: { street: 's', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9876543210', email: 'a@x.com' },
      paymentMethod: 'COD', itemsPrice: 2999, totalPrice: 2999, paidAt: null
    });
    const loaded = await Order.findById(order._id).populate('user', 'name email');
    const json = JSON.parse(JSON.stringify(loaded));
    assert.strictEqual(json.user.name, 'Asha');
    assert.strictEqual(json.orderItems[0].price, 1499.5);
    assert.strictEqual(json.shippingAddress.city, 'Mumbai');
    assert.strictEqual(json.paidAt, null);
    assert.strictEqual(json.isPaid, false);
    assert.strictEqual(json.createdAt, order.createdAt.toISOString());
  });
});
