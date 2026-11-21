import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import adminReducer, { refundOrderThunk, updateOrderStatusThunk } from '../src/store/adminSlice.js';

describe('Unit Tests: Admin Refund Operations & Real-Time Dashboard Deduction', () => {
  const getMockState = () => ({
    analytics: {
      counters: {
        totalUsers: 15,
        totalProducts: 40,
        totalOrders: 10,
        totalReviews: 8,
        totalRevenue: 25000,
        totalRefunded: 0,
        refundedOrders: 0
      },
      orderStatus: {
        pending: 2,
        confirmed: 2,
        processing: 1,
        shipped: 2,
        delivered: 10,
        cancelled: 1,
        cancellationRequested: 0,
        refunded: 0
      },
      lowStockAlerts: []
    },
    orders: [
      {
        _id: 'order_delivered_1',
        totalPrice: 5000,
        orderStatus: 'Delivered',
        isPaid: true
      },
      {
        _id: 'order_processing_2',
        totalPrice: 2000,
        orderStatus: 'Processing',
        isPaid: true
      }
    ],
    loading: false,
    error: null
  });

  describe('Positive Test Cases (Happy Path)', () => {
    it('should handle refundOrderThunk.fulfilled by deducting cost from totalRevenue and updating refunded metrics', () => {
      const state = getMockState();
      const refundedOrderPayload = {
        _id: 'order_delivered_1',
        totalPrice: 5000,
        refundAmount: 5000,
        orderStatus: 'Refunded',
        isRefunded: true,
        refundReason: 'Customer return approved'
      };

      const nextState = adminReducer(state, {
        type: refundOrderThunk.fulfilled.type,
        payload: refundedOrderPayload
      });

      // 1. Order status updated in orders collection
      assert.strictEqual(nextState.orders[0].orderStatus, 'Refunded');
      assert.strictEqual(nextState.orders[0].isRefunded, true);

      // 2. Revenue auto-deducted
      assert.strictEqual(nextState.analytics.counters.totalRevenue, 20000, 'Revenue should drop from 25000 to 20000');
      assert.strictEqual(nextState.analytics.counters.totalOrders, 9, 'Delivered orders count should decrement');

      // 3. Refund counters updated
      assert.strictEqual(nextState.analytics.counters.totalRefunded, 5000);
      assert.strictEqual(nextState.analytics.counters.refundedOrders, 1);
      assert.strictEqual(nextState.analytics.orderStatus.delivered, 9);
      assert.strictEqual(nextState.analytics.orderStatus.refunded, 1);
      assert.strictEqual(nextState.loading, false);
    });

    it('should deduct custom partial refund amount from dashboard revenue', () => {
      const state = getMockState();
      const partialRefundPayload = {
        _id: 'order_delivered_1',
        totalPrice: 5000,
        refundAmount: 2500, // partial refund
        orderStatus: 'Refunded',
        isRefunded: true
      };

      const nextState = adminReducer(state, {
        type: refundOrderThunk.fulfilled.type,
        payload: partialRefundPayload
      });

      assert.strictEqual(nextState.analytics.counters.totalRevenue, 22500, 'Should deduct exact 2500 partial refund');
      assert.strictEqual(nextState.analytics.counters.totalRefunded, 2500);
    });

    it('should handle updateOrderStatusThunk.fulfilled when status is changed to "Refunded"', () => {
      const state = getMockState();
      const statusUpdatedOrder = {
        _id: 'order_delivered_1',
        totalPrice: 5000,
        orderStatus: 'Refunded',
        isRefunded: true,
        refundAmount: 5000
      };

      const nextState = adminReducer(state, {
        type: updateOrderStatusThunk.fulfilled.type,
        payload: statusUpdatedOrder
      });

      assert.strictEqual(nextState.orders[0].orderStatus, 'Refunded');
      assert.strictEqual(nextState.analytics.counters.totalRevenue, 20000);
      assert.strictEqual(nextState.analytics.orderStatus.refunded, 1);
    });
  });

  describe('Negative Test Cases (Failure Paths & Edge Cases)', () => {
    it('should handle refundOrderThunk.rejected and leave totalRevenue unaltered', () => {
      const state = getMockState();
      state.loading = true;

      const nextState = adminReducer(state, {
        type: refundOrderThunk.rejected.type,
        payload: 'Database connection failed'
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.analytics.counters.totalRevenue, 25000, 'Revenue must remain unchanged on failure');
      assert.strictEqual(nextState.orders[0].orderStatus, 'Delivered', 'Order status must not change');
    });

    it('should prevent negative totalRevenue balance if refund amount exceeds current balance', () => {
      const state = getMockState();
      state.analytics.counters.totalRevenue = 1000; // Low balance

      const refundPayload = {
        _id: 'order_delivered_1',
        totalPrice: 5000,
        refundAmount: 5000,
        orderStatus: 'Refunded',
        isRefunded: true
      };

      const nextState = adminReducer(state, {
        type: refundOrderThunk.fulfilled.type,
        payload: refundPayload
      });

      assert.strictEqual(nextState.analytics.counters.totalRevenue, 0, 'Revenue must not become negative');
    });

    it('should safely handle refund when order does not exist in local orders array', () => {
      const state = getMockState();
      const nonExistentOrder = {
        _id: 'order_unknown_999',
        totalPrice: 3000,
        orderStatus: 'Refunded',
        isRefunded: true
      };

      const nextState = adminReducer(state, {
        type: refundOrderThunk.fulfilled.type,
        payload: nonExistentOrder
      });

      assert.strictEqual(nextState.loading, false);
      assert.strictEqual(nextState.orders.length, 2, 'Existing orders must be preserved');
    });
  });
});

