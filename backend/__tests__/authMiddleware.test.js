import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';

describe('Unit Tests: Authentication & Authorization Middleware', () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';

  describe('admin middleware', () => {
    describe('Positive Test Cases (Happy Path)', () => {
      it('should call next() if req.user has isAdmin: true', () => {
        const req = { user: { _id: '123', isAdmin: true, role: 'customer' } };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        admin(req, res, next);
        assert.strictEqual(nextCalled, true, 'next() should be called for admin users');
      });

      it('should call next() if req.user has role: "admin"', () => {
        const req = { user: { _id: '123', isAdmin: false, role: 'admin' } };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        admin(req, res, next);
        assert.strictEqual(nextCalled, true, 'next() should be called when role is admin');
      });
    });

    describe('Negative Test Cases (Failure Paths)', () => {
      it('should respond with 403 when user is not an admin', () => {
        const req = { user: { _id: '123', isAdmin: false, role: 'customer' } };
        let statusCode = 0;
        let responseJson = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => { responseJson = data; }
            };
          }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        admin(req, res, next);
        assert.strictEqual(nextCalled, false, 'next() should not be called for non-admins');
        assert.strictEqual(statusCode, 403);
        assert.strictEqual(responseJson.success, false);
        assert.strictEqual(responseJson.message, 'Access denied: Administrative privileges required.');
      });

      it('should respond with 403 when req.user is undefined', () => {
        const req = {};
        let statusCode = 0;
        let responseJson = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => { responseJson = data; }
            };
          }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        admin(req, res, next);
        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 403);
      });
    });
  });

  describe('protect middleware', () => {
    describe('Positive Test Cases (Happy Path)', () => {
      it('should call next() and attach user when token is valid and user is verified', async () => {
        const userId = '64b1f2e9a5d3c80012345678';
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);

        const mockUser = {
          _id: userId,
          name: 'Verified Customer',
          email: 'verified@example.com',
          isVerified: true
        };

        // Temporarily mock User.findById
        const originalFindById = User.findById;
        User.findById = () => ({
          select: () => Promise.resolve(mockUser)
        });

        try {
          const req = {
            headers: { authorization: `Bearer ${token}` }
          };
          const res = {};
          let nextCalled = false;
          const next = () => { nextCalled = true; };

          await protect(req, res, next);

          assert.strictEqual(nextCalled, true, 'next() should be called for verified user with valid token');
          assert.deepStrictEqual(req.user, mockUser);
        } finally {
          User.findById = originalFindById;
        }
      });
    });

    describe('Negative Test Cases (Failure Paths)', () => {
      it('should return 401 when authorization header is completely missing', async () => {
        const req = { headers: {} };
        let statusCode = 0;
        let responseJson = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => { responseJson = data; }
            };
          }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await protect(req, res, next);

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(responseJson.success, false);
        assert.match(responseJson.message, /No secure authentication token/i);
      });

      it('should return 401 when token does not start with Bearer', async () => {
        const req = { headers: { authorization: 'Basic 1234567' } };
        let statusCode = 0;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: () => {}
            };
          }
        };
        let nextCalled = false;

        await protect(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 401);
      });

      it('should return 401 when token is invalid or tampered with', async () => {
        const req = { headers: { authorization: 'Bearer invalid.tampered.token' } };
        let statusCode = 0;
        let responseJson = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => { responseJson = data; }
            };
          }
        };
        let nextCalled = false;

        await protect(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(responseJson.success, false);
        assert.match(responseJson.message, /expired or is invalid/i);
      });

      it('should return 401 when user is not found in database', async () => {
        const token = jwt.sign({ id: 'nonexistent_id' }, process.env.JWT_SECRET);

        const originalFindById = User.findById;
        User.findById = () => ({
          select: () => Promise.resolve(null)
        });

        try {
          const req = { headers: { authorization: `Bearer ${token}` } };
          let statusCode = 0;
          let responseJson = null;
          const res = {
            status: (code) => {
              statusCode = code;
              return {
                json: (data) => { responseJson = data; }
              };
            }
          };
          let nextCalled = false;

          await protect(req, res, () => { nextCalled = true; });

          assert.strictEqual(nextCalled, false);
          assert.strictEqual(statusCode, 401);
          assert.strictEqual(responseJson.message, 'Not authorized: User account not found.');
        } finally {
          User.findById = originalFindById;
        }
      });

      it('should return 403 when user is not verified (isVerified: false)', async () => {
        const token = jwt.sign({ id: 'unverified_id' }, process.env.JWT_SECRET);

        const originalFindById = User.findById;
        User.findById = () => ({
          select: () => Promise.resolve({ _id: 'unverified_id', isVerified: false })
        });

        try {
          const req = { headers: { authorization: `Bearer ${token}` } };
          let statusCode = 0;
          let responseJson = null;
          const res = {
            status: (code) => {
              statusCode = code;
              return {
                json: (data) => { responseJson = data; }
              };
            }
          };
          let nextCalled = false;

          await protect(req, res, () => { nextCalled = true; });

          assert.strictEqual(nextCalled, false);
          assert.strictEqual(statusCode, 403);
          assert.match(responseJson.message, /not verified/i);
        } finally {
          User.findById = originalFindById;
        }
      });
    });
  });
});

