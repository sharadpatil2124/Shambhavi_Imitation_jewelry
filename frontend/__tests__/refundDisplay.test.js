import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper logic mimicking frontend badge formatting
const getOrderStatusBadgeClass = (status) => {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Refunded':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Shipped':
    case 'Dispatched':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'Cancellation Requested':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    default:
      return 'bg-gold-100 text-gold-700 border-gold-200';
  }
};

const canCancelOrder = (order) => {
  if (!order || !order.orderStatus) return false;
  const nonCancellable = ['Delivered', 'Dispatched', 'Shipped', 'Cancelled', 'Refunded', 'Cancellation Requested'];
  return !nonCancellable.includes(order.orderStatus);
};

const getRefundNotice = (order) => {
  if (!order) return null;
  if (order.orderStatus !== 'Refunded' && !order.isRefunded) return null;
  const amount = order.refundAmount || order.totalPrice || 0;
  return {
    amount,
    reason: order.refundReason || 'Admin processed refund',
    isRefunded: true
  };
};

describe('Unit Tests: Frontend Refund Status Display & Customer Controls', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should assign dedicated purple styling classes for Refunded status', () => {
      const badgeClass = getOrderStatusBadgeClass('Refunded');
      assert.ok(badgeClass.includes('bg-purple-100'));
      assert.ok(badgeClass.includes('text-purple-700'));
      assert.ok(badgeClass.includes('border-purple-200'));
    });

    it('should generate refund notice with accurate refund amount and reason', () => {
      const order = {
        _id: 'ord_123',
        orderStatus: 'Refunded',
        isRefunded: true,
        totalPrice: 2499,
        refundAmount: 2499,
        refundReason: 'Customer return approved'
      };

      const notice = getRefundNotice(order);
      assert.ok(notice);
      assert.strictEqual(notice.isRefunded, true);
      assert.strictEqual(notice.amount, 2499);
      assert.strictEqual(notice.reason, 'Customer return approved');
    });

    it('should disallow customer cancellation when order is already refunded', () => {
      const order = { orderStatus: 'Refunded', isRefunded: true };
      const cancellable = canCancelOrder(order);
      assert.strictEqual(cancellable, false, 'Refunded order must not be cancellable');
    });

    it('should fallback refund amount to totalPrice if refundAmount is not explicitly set', () => {
      const order = {
        orderStatus: 'Refunded',
        isRefunded: true,
        totalPrice: 4500
        // refundAmount omitted
      };

      const notice = getRefundNotice(order);
      assert.ok(notice);
      assert.strictEqual(notice.amount, 4500);
      assert.strictEqual(notice.reason, 'Admin processed refund');
    });
  });

  describe('Negative Test Cases (Failure Paths & Edge Cases)', () => {
    it('should return null refund notice when order is in active non-refunded status', () => {
      const activeStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
      for (const status of activeStatuses) {
        const order = { orderStatus: status, isRefunded: false, totalPrice: 1500 };
        const notice = getRefundNotice(order);
        assert.strictEqual(notice, null, `Status "${status}" must not show refund notice`);
      }
    });

    it('should safely return null when order is null or undefined', () => {
      assert.strictEqual(getRefundNotice(null), null);
      assert.strictEqual(getRefundNotice(undefined), null);
      assert.strictEqual(canCancelOrder(null), false);
      assert.strictEqual(canCancelOrder(undefined), false);
    });

    it('should return default gold styling for unknown status strings', () => {
      const badgeClass = getOrderStatusBadgeClass('UnknownStatusXYZ');
      assert.ok(badgeClass.includes('bg-gold-100'));
    });
  });
});

