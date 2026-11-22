import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { redactSecrets, safeErrorMessage } from '../utils/redactSecrets.js';
import { errorHandler } from '../middleware/errorMiddleware.js';

const PASSWORD = 'S3cr3t%40Pass';      // as written in a URI (URL-encoded "@")
const DECODED = 'S3cr3t@Pass';

describe('redactSecrets', () => {
  let savedUri;
  before(() => {
    savedUri = process.env.MONGO_URI;
    process.env.MONGO_URI = `mongodb+srv://shopuser:${PASSWORD}@cluster0.example.mongodb.net/shop`;
  });
  after(() => {
    if (savedUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = savedUri;
  });

  it('masks user:password in mongodb+srv:// and mongodb:// addresses', () => {
    const out = redactSecrets('failed for mongodb+srv://a:b@h.net/x and mongodb://c:d@localhost:27017');
    assert.strictEqual(out, 'failed for mongodb+srv://***:***@h.net/x and mongodb://***:***@localhost:27017');
  });

  it('masks the MONGO_URI password even when it appears on its own, raw or decoded', () => {
    const out = redactSecrets(`bad password "${PASSWORD}" / "${DECODED}"`);
    assert.ok(!out.includes(PASSWORD) && !out.includes(DECODED), out);
  });

  it('leaves ordinary messages unchanged', () => {
    assert.strictEqual(redactSecrets('Product not found'), 'Product not found');
    assert.strictEqual(safeErrorMessage(new Error('Invalid email')), 'Invalid email');
    assert.strictEqual(redactSecrets(undefined), '');
  });

  it('hides credentials in a real driver error from a malformed connection string', async () => {
    const badUris = [
      `mongodb+srv://shopuser:${PASSWORD}@cluster0.example.mongodb.net:27017/shop`, // srv URIs cannot have a port
      `mongodb://shopuser:${PASSWORD}@localhost:notaport/shop`,
      `mongodb://shopuser:${DECODED}@localhost/shop`                              // unescaped "@"
    ];
    for (const uri of badUris) {
      const m = new mongoose.Mongoose();
      let error;
      try {
        await m.connect(uri, { serverSelectionTimeoutMS: 200 });
      } catch (e) {
        error = e;
      } finally {
        await m.disconnect().catch(() => {});
      }
      assert.ok(error, `expected the driver to reject ${uri}`);
      const safe = safeErrorMessage(error) + redactSecrets(error.stack);
      assert.ok(!safe.includes(PASSWORD) && !safe.includes(DECODED), `password leaked: ${safe}`);
    }
  });

  it('global error handler masks credentials in the log and the response', () => {
    const logged = [];
    const origError = console.error;
    console.error = (...a) => logged.push(a.join(' '));
    let body;
    const res = { statusCode: 500, status() { return this; }, json(b) { body = b; } };
    try {
      errorHandler(new Error(`connect failed: mongodb+srv://shopuser:${PASSWORD}@x.net`), {}, res, () => {});
    } finally {
      console.error = origError;
    }
    const everything = logged.join('\n') + JSON.stringify(body);
    assert.ok(!everything.includes(PASSWORD) && !everything.includes(DECODED), everything);
    assert.ok(body.message.includes('mongodb+srv://***:***@x.net'));
  });
});
