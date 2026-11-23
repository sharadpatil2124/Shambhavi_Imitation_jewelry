import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInputs } from '../middleware/sanitizeMiddleware.js';

describe('Unit Tests: NoSQL Injection Sanitize Middleware', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should keep safe payload fields unchanged', () => {
      const req = {
        body: {
          name: 'Royal Choker',
          price: 1999,
          details: ['Gold', 'Kundan'],
          nested: { brand: 'Shambhavi' }
        },
        query: { category: 'necklaces', sort: 'price-asc' },
        params: { id: '64b1f2e9a5d3c80012345678' }
      };

      let nextCalled = false;
      sanitizeInputs(req, {}, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'next() must be called');
      assert.strictEqual(req.body.name, 'Royal Choker');
      assert.strictEqual(req.body.price, 1999);
      assert.strictEqual(req.body.nested.brand, 'Shambhavi');
      assert.strictEqual(req.query.category, 'necklaces');
      assert.strictEqual(req.params.id, '64b1f2e9a5d3c80012345678');
    });
  });

  describe('Negative Test Cases (Injection Prevention)', () => {
    it('should remove root-level query operators ($gt, $ne, $where)', () => {
      const req = {
        body: {
          $gt: '',
          $where: 'sleep(5000)',
          username: 'admin'
        },
        query: {},
        params: {}
      };

      sanitizeInputs(req, {}, () => {});

      assert.strictEqual(req.body['$gt'], undefined, '$gt should be stripped');
      assert.strictEqual(req.body['$where'], undefined, '$where should be stripped');
      assert.strictEqual(req.body.username, 'admin', 'Legitimate field should remain intact');
    });

    it('should remove deeply nested query operators in request body', () => {
      const req = {
        body: {
          password: { $ne: null },
          filter: {
            price: { $gt: 0, $lt: 5000 }
          }
        },
        query: {},
        params: {}
      };

      sanitizeInputs(req, {}, () => {});

      assert.strictEqual(req.body.password['$ne'], undefined);
      assert.strictEqual(req.body.filter.price['$gt'], undefined);
      assert.strictEqual(req.body.filter.price['$lt'], undefined);
    });

    it('should sanitize query parameters and route parameters containing $ operators', () => {
      const req = {
        body: {},
        query: {
          $regex: '.*',
          search: 'ring'
        },
        params: {
          $id: 'fake'
        }
      };

      sanitizeInputs(req, {}, () => {});

      assert.strictEqual(req.query['$regex'], undefined);
      assert.strictEqual(req.query.search, 'ring');
      assert.strictEqual(req.params['$id'], undefined);
    });
  });
});

