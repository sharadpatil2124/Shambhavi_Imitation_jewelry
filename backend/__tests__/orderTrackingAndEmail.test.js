import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { trackOrderPublicly } from '../controllers/orderController.js';
import { sendOrderShippedEmail } from '../utils/sendEmail.js';

describe('Unit Tests: Order Tracking & Shipped Notification Email', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const validOrderId = new mongoose.Types.ObjectId().toString();

  const mockOrderData = {
    _id: validOrderId,
    user: dummyUserId,
    orderItems: [{
      product: new mongoose.Types.ObjectId(),
      name: 'Kundan Choker Necklace',
      quantity: 1,
      image: 'https://example.com/necklace.jpg',
      price: 2499,
      color: 'Ruby Red',
      size: 'Standard'
    }],
    shippingAddress: {
      street: '123 MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '9876543210',
      email: 'customer@example.com'
    },
    paymentMethod: 'Razorpay',
    itemsPrice: 2499,
    shippingPrice: 0,
    discountPrice: 0,
    totalPrice: 2499,
    isPaid: true,
    orderStatus: 'Shipped',
    courierName: 'Blue Dart',
    trackingNumber: 'BLUEDART-8821921',
    trackingId: 'BLUEDART-8821921',
    createdAt: new Date()
  };

  describe('Positive Test Cases (Happy Path)', () => {
    it('should successfully locate and return public tracking data matching order email', async () => {
      const origFindById = Order.findById;
      Order.findById = (id) => Promise.resolve(id === validOrderId ? mockOrderData : null);

      try {
        const req = {
          body: {
            orderId: validOrderId,
            identifier: 'customer@example.com'
          }
        };

        let responsePayload = null;
        const res = {
          status: () => res,
          json: (data) => { responsePayload = data; return res; }
        };

        await trackOrderPublicly(req, res, () => {});

        assert.ok(responsePayload, 'Should return a response payload');
        assert.strictEqual(responsePayload.success, true);
        assert.strictEqual(responsePayload.order.orderStatus, 'Shipped');
        assert.strictEqual(responsePayload.order.courierName, 'Blue Dart');
        assert.strictEqual(responsePayload.order.trackingNumber, 'BLUEDART-8821921');
        assert.strictEqual(responsePayload.order.shippingAddress.city, 'Pune');
        assert.strictEqual(responsePayload.order.orderItems.length, 1);
      } finally {
        Order.findById = origFindById;
      }
    });

    it('should successfully locate order tracking data matching phone number', async () => {
      const origFindById = Order.findById;
      Order.findById = (id) => Promise.resolve(id === validOrderId ? mockOrderData : null);

      try {
        const req = {
          body: {
            orderId: validOrderId,
            identifier: '+91 9876543210' // with country code / spaces
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
        assert.strictEqual(responsePayload.order._id, validOrderId);
      } finally {
        Order.findById = origFindById;
      }
    });

    it('should safely execute sendOrderShippedEmail without throw', async () => {
      // Mock without real network send
      const dummyOrder = {
        _id: validOrderId,
        courierName: 'Delhivery',
        trackingNumber: 'DEL-991209',
        trackingId: 'DEL-991209',
        orderItems: [{ name: 'Gold Bangles', quantity: 2, price: 999 }],
        shippingAddress: {
          street: 'Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '9876543210'
        }
      };

      // Call sendOrderShippedEmail - if credentials aren't present it returns safely
      await assert.doesNotReject(async () => {
        await sendOrderShippedEmail('recipient@example.com', dummyOrder);
      });
    });
  });

  describe('Negative Test Cases (Failure Paths & Security)', () => {
    it('should reject non-hex / malformed Order ID with 404', async () => {
      const req = {
        body: { orderId: 'invalid-order-id-123' }
      };

      let statusCode = 0;
      let errorThrown = null;
      const res = {
        status: (c) => { statusCode = c; return res; },
        json: () => res
      };
      const next = (err) => { errorThrown = err; };

      await trackOrderPublicly(req, res, next);

      assert.strictEqual(statusCode, 404);
      assert.ok(errorThrown);
      assert.match(errorThrown.message, /format/i);
    });

    it('should reject empty orderId with 400', async () => {
      const req = { body: {} };
      let statusCode = 0;
      let errorThrown = null;
      const res = {
        status: (c) => { statusCode = c; return res; },
        json: () => res
      };
      const next = (err) => { errorThrown = err; };

      await trackOrderPublicly(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(errorThrown);
    });

    it('should reject with 403 when identifier does not match order record', async () => {
      const origFindById = Order.findById;
      Order.findById = () => Promise.resolve(mockOrderData);

      try {
        const req = {
          body: {
            orderId: validOrderId,
            identifier: 'wrong_hacker_email@attacker.com'
          }
        };

        let statusCode = 0;
        let errorThrown = null;
        const res = {
          status: (c) => { statusCode = c; return res; },
          json: () => res
        };
        const next = (err) => { errorThrown = err; };

        await trackOrderPublicly(req, res, next);

        assert.strictEqual(statusCode, 403);
        assert.ok(errorThrown);
        assert.match(errorThrown.message, /Verification failed/i);
      } finally {
        Order.findById = origFindById;
      }
    });

    it('should return 404 when valid order ID does not exist in database', async () => {
      const origFindById = Order.findById;
      Order.findById = () => Promise.resolve(null);

      try {
        const req = {
          body: {
            orderId: new mongoose.Types.ObjectId().toString(),
            identifier: 'test@example.com'
          }
        };

        let statusCode = 0;
        let errorThrown = null;
        const res = {
          status: (c) => { statusCode = c; return res; },
          json: () => res
        };
        const next = (err) => { errorThrown = err; };

        await trackOrderPublicly(req, res, next);

        assert.strictEqual(statusCode, 404);
        assert.ok(errorThrown);
        assert.match(errorThrown.message, /No order found/i);
      } finally {
        Order.findById = origFindById;
      }
    });
  });
});

