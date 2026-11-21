import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';

describe('Unit Tests: JWT Authentication & Token Utilities', () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';

  describe('Positive Test Cases (Happy Path)', () => {
    it('should generate a valid JWT token given a valid user ID', () => {
      const userId = '64b1f2e9a5d3c80012345678';
      const token = generateToken(userId);

      assert.ok(token, 'Token should be returned');
      assert.strictEqual(typeof token, 'string', 'Token should be a string');
      assert.strictEqual(token.split('.').length, 3, 'JWT should contain 3 parts separated by dots');

      // Verify token payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.id, userId, 'Decoded payload should have the matching user ID');
      assert.ok(decoded.exp, 'Decoded token should have an expiration timestamp');
    });

    it('should encode user ID properly in decoded token', () => {
      const mockId = 'user_admin_999';
      const token = generateToken(mockId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      assert.strictEqual(decoded.id, mockId);
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should reject token verification with an invalid secret key', () => {
      const userId = '64b1f2e9a5d3c80012345678';
      const token = generateToken(userId);

      assert.throws(() => {
        jwt.verify(token, 'wrong_secret_key');
      }, /invalid signature/i);
    });

    it('should reject malformed or tampered token', () => {
      const malformedToken = 'invalid.jwt.token';

      assert.throws(() => {
        jwt.verify(malformedToken, process.env.JWT_SECRET);
      }, (err) => err.name === 'JsonWebTokenError');
    });

    it('should reject an empty token string', () => {
      assert.throws(() => {
        jwt.verify('', process.env.JWT_SECRET);
      }, /jwt must be provided/i);
    });
  });
});
