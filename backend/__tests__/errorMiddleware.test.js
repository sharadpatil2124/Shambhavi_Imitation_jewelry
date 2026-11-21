import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

describe('Unit Tests: Error Handling Middleware', () => {
  describe('notFound Middleware', () => {
    it('should set status code to 404 and forward Error to next handler', () => {
      const req = { originalUrl: '/api/unknown-endpoint' };
      let statusCode = 0;
      const res = {
        status: (code) => { statusCode = code; }
      };
      let passedError = null;
      const next = (err) => { passedError = err; };

      notFound(req, res, next);

      assert.strictEqual(statusCode, 404);
      assert.ok(passedError instanceof Error);
      assert.strictEqual(passedError.message, 'Not Found - /api/unknown-endpoint');
    });
  });

  describe('errorHandler Middleware', () => {
    const createMockRes = (initialCode = 200) => {
      let code = initialCode;
      let jsonPayload = null;
      return {
        get statusCode() { return code; },
        status(c) { code = c; return this; },
        json(data) { jsonPayload = data; return this; },
        get payload() { return jsonPayload; },
        get code() { return code; }
      };
    };

    describe('Positive Test Cases (Standard Errors)', () => {
      it('should handle standard error and default to 500 status code', () => {
        const err = new Error('Database connection failed');
        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 500);
        assert.strictEqual(res.payload.success, false);
        assert.strictEqual(res.payload.message, 'Database connection failed');
      });

      it('should hide stack trace when NODE_ENV is production', () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const err = new Error('Internal error');
        const req = {};
        const res = createMockRes(500);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.payload.stack, null, 'Stack should be null in production mode');

        process.env.NODE_ENV = prevEnv;
      });
    });

    describe('Negative Test Cases (Specific Mongoose & JWT Errors)', () => {
      it('should return 400 for CastError (Invalid MongoDB ObjectId)', () => {
        const err = new Error('Cast to ObjectId failed');
        err.name = 'CastError';
        err.kind = 'ObjectId';

        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 400);
        assert.strictEqual(res.payload.message, 'Resource not found: Invalid database ID format');
      });

      it('should return 400 for MongoDB duplicate key error (code 11000)', () => {
        const err = new Error('E11000 duplicate key error');
        err.code = 11000;
        err.keyValue = { email: 'duplicate@example.com' };

        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 400);
        assert.match(res.payload.message, /Duplicate field value entered: An item with this email already exists/i);
      });

      it('should return 400 for Mongoose ValidationError', () => {
        const err = new Error('Validation failed');
        err.name = 'ValidationError';
        err.errors = {
          name: { message: 'Name is required' },
          price: { message: 'Price cannot be negative' }
        };

        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 400);
        assert.match(res.payload.message, /Name is required, Price cannot be negative/);
      });

      it('should return 401 for JsonWebTokenError', () => {
        const err = new Error('invalid signature');
        err.name = 'JsonWebTokenError';

        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 401);
        assert.strictEqual(res.payload.message, 'Invalid secure session token: Please login again');
      });

      it('should return 401 for TokenExpiredError', () => {
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';

        const req = {};
        const res = createMockRes(200);

        errorHandler(err, req, res, () => {});

        assert.strictEqual(res.code, 401);
        assert.strictEqual(res.payload.message, 'Secure session has expired: Please sign in again');
      });
    });
  });
});

