import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { newId } from '../db/ids.js';
import Order from '../models/Order.js';

describe('Unit Tests: Order Model & Status Enum Validation', () => {
  const dummyUserId = newId();
  const dummyProductId = newId();

  const getValidOrderData = () => ({
    user: dummyUserId,
    orderItems: [{
      product: dummyProductId,
      name: 'Ruby Kundan Necklace',
      quantity: 1,
      image: 'https://example.com/necklace.jpg',
      price: 1999
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
    itemsPrice: 1999,
    taxPrice: 0,
    shippingPrice: 0,
    discountPrice: 0,
    totalPrice: 1999
  });

  describe('Positive Test Cases (Happy Path)', () => {
    it('should validate a complete and valid order successfully', () => {
      const order = new Order(getValidOrderData());
      const error = order.validateSync();

      assert.strictEqual(error, undefined, 'Valid order should not produce validation errors');
      assert.strictEqual(order.orderStatus, 'Processing', 'Default order status should be Processing');
      assert.strictEqual(order.isPaid, false, 'Default isPaid should be false');
      assert.strictEqual(order.totalPrice, 1999);
    });

    it('should accept COD as a valid payment method', () => {
      const orderData = getValidOrderData();
      orderData.paymentMethod = 'COD';

      const order = new Order(orderData);
      const error = order.validateSync();
      assert.strictEqual(error, undefined);
      assert.strictEqual(order.paymentMethod, 'COD');
    });

    it('should accept all allowed order statuses in enum', () => {
      const allowedStatuses = [
        'Pending', 'Confirmed', 'Processing', 'Dispatched',
        'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled',
        'Refunded', 'Cancellation Requested'
      ];

      for (const status of allowedStatuses) {
        const orderData = getValidOrderData();
        orderData.orderStatus = status;

        const order = new Order(orderData);
        const error = order.validateSync();
        assert.strictEqual(error, undefined, `Status "${status}" should be accepted`);
        assert.strictEqual(order.orderStatus, status);
      }
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should reject invalid payment method not in enum', () => {
      const orderData = getValidOrderData();
      orderData.paymentMethod = 'Bitcoin';

      const order = new Order(orderData);
      const error = order.validateSync();

      assert.ok(error, 'Should fail for invalid payment method');
      assert.ok(error.errors['paymentMethod']);
    });

    it('should reject invalid orderStatus not in enum', () => {
      const orderData = getValidOrderData();
      orderData.orderStatus = 'InTransitUnknown';

      const order = new Order(orderData);
      const error = order.validateSync();

      assert.ok(error, 'Should fail for invalid orderStatus');
      assert.ok(error.errors['orderStatus']);
    });

    it('should reject order without user reference', () => {
      const orderData = getValidOrderData();
      delete orderData.user;

      const order = new Order(orderData);
      const error = order.validateSync();

      assert.ok(error, 'Should fail when user is missing');
      assert.ok(error.errors['user']);
    });

    it('should reject order when shippingAddress required fields are missing', () => {
      const orderData = getValidOrderData();
      orderData.shippingAddress = { street: 'Only street' }; // missing city, state, pincode, phone, email

      const order = new Order(orderData);
      const error = order.validateSync();

      assert.ok(error);
      assert.ok(error.errors['shippingAddress.city']);
      assert.ok(error.errors['shippingAddress.pincode']);
      assert.ok(error.errors['shippingAddress.phone']);
      assert.ok(error.errors['shippingAddress.email']);
    });
  });
});

