import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure calculation logic from cartSlice.js
const calculateTotals = (state) => {
  const subtotal = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  state.subtotal = subtotal;

  const threshold = state.freeShippingThreshold !== undefined ? state.freeShippingThreshold : 1500;
  const charge = state.shippingCharge !== undefined ? state.shippingCharge : 100;

  if (subtotal > threshold || subtotal === 0) {
    state.shipping = 0;
  } else {
    state.shipping = charge;
  }

  state.total = state.subtotal + state.shipping;
  return state;
};

describe('Unit Tests: Shopping Cart Financial Calculations & Shipping Rules', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should calculate correct subtotal and apply standard shipping charge when below threshold', () => {
      const state = {
        items: [
          { price: 499, quantity: 2 }, // 998
          { price: 300, quantity: 1 }  // 300
        ],
        subtotal: 0,
        shipping: 0,
        total: 0,
        shippingCharge: 100,
        freeShippingThreshold: 1500
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 1298, 'Subtotal should be 499*2 + 300 = 1298');
      assert.strictEqual(state.shipping, 100, 'Shipping charge of 100 should apply when subtotal <= 1500');
      assert.strictEqual(state.total, 1398, 'Total should be subtotal + shipping (1298 + 100 = 1398)');
    });

    it('should waive shipping charge (free shipping) when subtotal exceeds threshold', () => {
      const state = {
        items: [
          { price: 1200, quantity: 1 },
          { price: 500, quantity: 1 }
        ],
        subtotal: 0,
        shipping: 100,
        total: 0,
        shippingCharge: 100,
        freeShippingThreshold: 1500
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 1700, 'Subtotal should be 1700');
      assert.strictEqual(state.shipping, 0, 'Shipping charge must be waived (0) when above 1500');
      assert.strictEqual(state.total, 1700, 'Total should equal subtotal without extra shipping fee');
    });

    it('should adapt to custom shipping charges and threshold settings', () => {
      const state = {
        items: [{ price: 600, quantity: 1 }],
        subtotal: 0,
        shipping: 0,
        total: 0,
        shippingCharge: 150,
        freeShippingThreshold: 500 // Subtotal 600 > 500 -> free shipping
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 600);
      assert.strictEqual(state.shipping, 0);
      assert.strictEqual(state.total, 600);
    });
  });

  describe('Negative Test Cases (Failure Paths & Edge Cases)', () => {
    it('should yield 0 subtotal, 0 shipping, and 0 total when cart is empty', () => {
      const state = {
        items: [],
        subtotal: 0,
        shipping: 100,
        total: 0,
        shippingCharge: 100,
        freeShippingThreshold: 1500
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 0);
      assert.strictEqual(state.shipping, 0, 'Empty cart must never be charged shipping');
      assert.strictEqual(state.total, 0);
    });

    it('should ignore items with zero quantity in subtotal calculation', () => {
      const state = {
        items: [
          { price: 999, quantity: 0 },
          { price: 400, quantity: 1 }
        ],
        subtotal: 0,
        shipping: 0,
        total: 0,
        shippingCharge: 100,
        freeShippingThreshold: 1500
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 400);
      assert.strictEqual(state.shipping, 100);
      assert.strictEqual(state.total, 500);
    });

    it('should handle zero price promo items without causing NaN or negative balance', () => {
      const state = {
        items: [
          { price: 0, quantity: 1 } // Free gift item
        ],
        subtotal: 0,
        shipping: 0,
        total: 0,
        shippingCharge: 100,
        freeShippingThreshold: 1500
      };

      calculateTotals(state);

      assert.strictEqual(state.subtotal, 0);
      assert.strictEqual(state.shipping, 0);
      assert.strictEqual(state.total, 0);
      assert.strictEqual(Number.isNaN(state.total), false);
    });
  });
});

