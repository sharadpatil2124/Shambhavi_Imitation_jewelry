import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { refundOrder, updateOrderStatus, trackOrderPublicly } from '../controllers/orderController.js';

describe('Unit Tests: Order Refund Operations & Dashboard Revenue Deduction', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyProductId = new mongoose.Types.ObjectId();
  const validOrderId = new mongoose.Types.ObjectId().toString();

  const createMockOrder = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(validOrderId),
    user: dummyUserId,
    orderItems: [{
      product: dummyProductId,
      name: 'Royal Heritage Kundan Choker',
      quantity: 2,
      price: 1500,
      image: 'https://example.com/choker.jpg'
    }],
    shippingAddress: {
      name: 'Aditi Sharma',
      street: '45 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210',
      email: 'aditi@example.com'
    },
    paymentMethod: 'Razorpay',
    itemsPrice: 3000,
    taxPrice: 0,
    shippingPrice: 0,
    discountPrice: 0,
    totalPrice: 3000,
    isPaid: true,
    paidAt: new Date(),
    orderStatus: 'Delivered',
    isRefunded: false,
    refundAmount: 0,
    refundReason: '',
    save: async function() { return this; },
    ...overrides
  });

  describe('Positive Test Cases (Happy Path)', () => {
    // Stock is restored at most once: the controller first claims the order's stockRestored flag
    // atomically. With no database in these unit tests, the claim is simulated as succeeding.
    let origOrderFindOneAndUpdate;
    before(() => {
      origOrderFindOneAndUpdate = Order.findOneAndUpdate;
      Order.findOneAndUpdate = async () => ({ _id: validOrderId });
    });
    after(() => {
      Order.findOneAndUpdate = origOrderFindOneAndUpdate;
    });

    it('should successfully refund a paid order, restock inventory, and update refund fields', async () => {
      const mockOrder = createMockOrder({ orderStatus: 'Delivered' });
      let stockIncremented = false;
      let incrementedQty = 0;

      const origOrderFindById = Order.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Order.findById = async (id) => (id === validOrderId ? mockOrder : null);
      Product.findByIdAndUpdate = async (id, update) => {
        if (id.toString() === dummyProductId.toString() && update.$inc && update.$inc.stock) {
          stockIncremented = true;
          incrementedQty += update.$inc.stock;
        }
        return { _id: id };
      };

      try {
        const req = {
          params: { id: validOrderId },
          body: {
            reason: 'Customer return approved',
            amount: 3000
          }
        };

        let responseStatusCode = 200;
        let responsePayload = null;
        const res = {
          status: (code) => { responseStatusCode = code; return res; },
          json: (data) => { responsePayload = data; return res; }
        };

        await refundOrder(req, res, () => {});

        assert.strictEqual(responseStatusCode, 200);
        assert.ok(responsePayload);
        assert.strictEqual(responsePayload.success, true);
        assert.strictEqual(mockOrder.orderStatus, 'Refunded');
        assert.strictEqual(mockOrder.isRefunded, true);
        assert.strictEqual(mockOrder.refundAmount, 3000);
        assert.strictEqual(mockOrder.refundReason, 'Customer return approved');
        assert.ok(mockOrder.refundedAt instanceof Date || typeof mockOrder.refundedAt === 'number');
        assert.ok(mockOrder.refundTransactionId.startsWith('REF_'));
        assert.strictEqual(stockIncremented, true, 'Product stock should be incremented');
        assert.strictEqual(incrementedQty, 2, 'Should restock 2 items');
        assert.strictEqual(mockOrder.stockRestored, true, 'Order should be marked as restocked');
      } finally {
        Order.findById = origOrderFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it('should support custom partial refund amount and default reason when omitted', async () => {
      const mockOrder = createMockOrder({ orderStatus: 'Confirmed', totalPrice: 3000 });

      const origOrderFindById = Order.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Order.findById = async (id) => (id === validOrderId ? mockOrder : null);
      Product.findByIdAndUpdate = async () => ({});

      try {
        const req = {
          params: { id: validOrderId },
          body: {
            amount: 1500
            // reason omitted
          }
        };

        let responsePayload = null;
        const res = {
          status: () => res,
          json: (data) => { responsePayload = data; return res; }
        };

        await refundOrder(req, res, () => {});

        assert.ok(responsePayload);
        assert.strictEqual(responsePayload.success, true);
        assert.strictEqual(mockOrder.refundAmount, 1500);
        assert.strictEqual(mockOrder.refundReason, 'Admin processed refund');
        assert.strictEqual(mockOrder.orderStatus, 'Refunded');
      } finally {
        Order.findById = origOrderFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it('should allow status update to "Refunded" via updateOrderStatus endpoint and restock items', async () => {
      const mockOrder = createMockOrder({ orderStatus: 'Processing' });
      let stockRestocked = false;

      const origOrderFindById = Order.findById;
      const origProductFindByIdAndUpdate = Product.findByIdAndUpdate;

      Order.findById = async () => mockOrder;
      Product.findByIdAndUpdate = async (id, update) => {
        if (update.$inc?.stock) stockRestocked = true;
        return {};
      };

      try {
        const req = {
          params: { id: validOrderId },
          body: {
            status: 'Refunded',
            rejectionReason: 'Damaged piece refunded'
          }
        };

        let responsePayload = null;
        const res = {
          status: () => res,
          json: (data) => { responsePayload = data; return res; }
        };

        await updateOrderStatus(req, res, () => {});

        assert.ok(responsePayload);
        assert.strictEqual(responsePayload.success, true);
        assert.strictEqual(mockOrder.orderStatus, 'Refunded');
        assert.strictEqual(mockOrder.isRefunded, true);
        assert.strictEqual(stockRestocked, true);
      } finally {
        Order.findById = origOrderFindById;
        Product.findByIdAndUpdate = origProductFindByIdAndUpdate;
      }
    });

    it('should return refund metadata in public order tracking when order is refunded', async () => {
      const refundedOrder = createMockOrder({
        orderStatus: 'Refunded',
        isRefunded: true,
        refundAmount: 3000,
        refundReason: 'Return accepted',
        refundedAt: new Date(),
        refundTransactionId: 'REF_TEST_12345'
      });

      const origOrderFindById = Order.findById;
      Order.findById = async () => refundedOrder;

      try {
        const req = {
          body: {
            orderId: validOrderId,
            identifier: 'aditi@example.com'
          }
        };

        let responsePayload = null;
        const res = {
          status: () => res,
          json: (data) => { responsePayload = data; return res; }
        };

        await trackOrderPublicly(req, res, () => {});

        assert.ok(responsePayload);
        assert.strictEqual(responsePayload.success, true);
        assert.strictEqual(responsePayload.order.orderStatus, 'Refunded');
        assert.strictEqual(responsePayload.order.isRefunded, true);
        assert.strictEqual(responsePayload.order.refundAmount, 3000);
        assert.strictEqual(responsePayload.order.refundReason, 'Return accepted');
        assert.strictEqual(responsePayload.order.refundTransactionId, 'REF_TEST_12345');
      } finally {
        Order.findById = origOrderFindById;
      }
    });
  });

  describe('Negative Test Cases (Failure Paths & Security)', () => {
    it('should reject refund when Order ID has invalid hex format', async () => {
      const req = {
        params: { id: 'invalid-order-id-123' },
        body: {}
      };

      let errorCaught = null;
      let statusCode = 200;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: () => res
      };
      const next = (err) => { errorCaught = err; };

      await refundOrder(req, res, next);

      assert.ok(errorCaught);
      assert.strictEqual(statusCode, 404);
      assert.ok(errorCaught.message.includes('Invalid Order ID format'));
    });

    it('should reject refund when order does not exist in database', async () => {
      const origOrderFindById = Order.findById;
      Order.findById = async () => null;

      try {
        const req = {
          params: { id: validOrderId },
          body: {}
        };

        let errorCaught = null;
        let statusCode = 200;
        const res = {
          status: (code) => { statusCode = code; return res; },
          json: () => res
        };
        const next = (err) => { errorCaught = err; };

        await refundOrder(req, res, next);

        assert.ok(errorCaught);
        assert.strictEqual(statusCode, 404);
        assert.ok(errorCaught.message.includes('Order does not exist'));
      } finally {
        Order.findById = origOrderFindById;
      }
    });

    it('should reject refund when order payment is unpaid (isPaid: false)', async () => {
      const unpaidOrder = createMockOrder({ isPaid: false, paymentMethod: 'COD' });
      const origOrderFindById = Order.findById;
      Order.findById = async () => unpaidOrder;

      try {
        const req = {
          params: { id: validOrderId },
          body: {}
        };

        let errorCaught = null;
        let statusCode = 200;
        const res = {
          status: (code) => { statusCode = code; return res; },
          json: () => res
        };
        const next = (err) => { errorCaught = err; };

        await refundOrder(req, res, next);

        assert.ok(errorCaught);
        assert.strictEqual(statusCode, 400);
        assert.ok(errorCaught.message.includes('unpaid'));
      } finally {
        Order.findById = origOrderFindById;
      }
    });

    it('should reject refund when order is already refunded', async () => {
      const alreadyRefundedOrder = createMockOrder({
        orderStatus: 'Refunded',
        isRefunded: true
      });
      const origOrderFindById = Order.findById;
      Order.findById = async () => alreadyRefundedOrder;

      try {
        const req = {
          params: { id: validOrderId },
          body: {}
        };

        let errorCaught = null;
        let statusCode = 200;
        const res = {
          status: (code) => { statusCode = code; return res; },
          json: () => res
        };
        const next = (err) => { errorCaught = err; };

        await refundOrder(req, res, next);

        assert.ok(errorCaught);
        assert.strictEqual(statusCode, 400);
        assert.ok(errorCaught.message.includes('already been refunded'));
      } finally {
        Order.findById = origOrderFindById;
      }
    });

    it('should reject refund when refund amount is negative or zero', async () => {
      const mockOrder = createMockOrder();
      const origOrderFindById = Order.findById;
      Order.findById = async () => mockOrder;

      try {
        for (const badAmount of [0, -100, -0.01]) {
          const req = {
            params: { id: validOrderId },
            body: { amount: badAmount }
          };

          let errorCaught = null;
          let statusCode = 200;
          const res = {
            status: (code) => { statusCode = code; return res; },
            json: () => res
          };
          const next = (err) => { errorCaught = err; };

          await refundOrder(req, res, next);

          assert.ok(errorCaught, `Should reject amount: ${badAmount}`);
          assert.strictEqual(statusCode, 400);
          assert.ok(errorCaught.message.includes('positive number'));
        }
      } finally {
        Order.findById = origOrderFindById;
      }
    });

    it('should reject refund when refund amount exceeds total order value', async () => {
      const mockOrder = createMockOrder({ totalPrice: 3000 });
      const origOrderFindById = Order.findById;
      Order.findById = async () => mockOrder;

      try {
        const req = {
          params: { id: validOrderId },
          body: { amount: 5000 } // Exceeds 3000
        };

        let errorCaught = null;
        let statusCode = 200;
        const res = {
          status: (code) => { statusCode = code; return res; },
          json: () => res
        };
        const next = (err) => { errorCaught = err; };

        await refundOrder(req, res, next);

        assert.ok(errorCaught);
        assert.strictEqual(statusCode, 400);
        assert.ok(errorCaught.message.includes('cannot exceed total order value'));
      } finally {
        Order.findById = origOrderFindById;
      }
    });
  });
});

