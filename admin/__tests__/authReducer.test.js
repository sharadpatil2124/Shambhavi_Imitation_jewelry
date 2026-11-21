import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test runner
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

import authReducer, { loginUser, logoutUser, updateProfile } from '../src/store/authSlice.js';

describe('Unit Tests: Admin Authentication Redux Reducer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Positive Test Cases (Happy Path)', () => {
    it('should handle loginUser and set user credentials in state & localStorage', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      };

      const payload = {
        _id: 'admin_123',
        name: 'Super Admin',
        email: 'admin@shambhavi.com',
        role: 'admin',
        isAdmin: true,
        phone: '9876543210',
        token: 'mock_jwt_token_xyz'
      };

      const nextState = authReducer(initialState, loginUser(payload));

      assert.strictEqual(nextState.isAuthenticated, true);
      assert.strictEqual(nextState.token, 'mock_jwt_token_xyz');
      assert.strictEqual(nextState.user.name, 'Super Admin');
      assert.strictEqual(nextState.user.email, 'admin@shambhavi.com');
      assert.strictEqual(nextState.user.isAdmin, true);
      assert.strictEqual(localStorage.getItem('token'), 'mock_jwt_token_xyz');
    });

    it('should handle logoutUser and purge auth state & localStorage', () => {
      const activeState = {
        isAuthenticated: true,
        user: { name: 'Admin', email: 'admin@shambhavi.com' },
        token: 'mock_token',
        error: null,
        loading: false
      };
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('user', JSON.stringify(activeState.user));

      const nextState = authReducer(activeState, logoutUser());

      assert.strictEqual(nextState.isAuthenticated, false);
      assert.strictEqual(nextState.user, null);
      assert.strictEqual(nextState.token, null);
      assert.strictEqual(localStorage.getItem('token'), null);
      assert.strictEqual(localStorage.getItem('user'), null);
    });

    it('should update user profile fields with updateProfile', () => {
      const activeState = {
        isAuthenticated: true,
        user: { name: 'Old Name', email: 'admin@shambhavi.com', phone: '1111' },
        token: 'mock_token',
        error: null,
        loading: false
      };

      const nextState = authReducer(activeState, updateProfile({ name: 'New Name', phone: '9999' }));

      assert.strictEqual(nextState.user.name, 'New Name');
      assert.strictEqual(nextState.user.phone, '9999');
      assert.strictEqual(nextState.user.email, 'admin@shambhavi.com', 'Unchanged fields should persist');
    });
  });

  describe('Negative Test Cases (Failure Paths & Edge Cases)', () => {
    it('should gracefully handle updateProfile when user is null without throwing error', () => {
      const emptyState = {
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      };

      const nextState = authReducer(emptyState, updateProfile({ name: 'Attempted Update' }));

      assert.strictEqual(nextState.user, null, 'User should remain null');
      assert.strictEqual(nextState.isAuthenticated, false);
    });

    it('should retain unauthenticated state when passed an unknown action', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      };

      const nextState = authReducer(initialState, { type: 'UNKNOWN_ACTION' });

      assert.strictEqual(nextState.isAuthenticated, false);
      assert.strictEqual(nextState.user, null);
    });
  });
});

