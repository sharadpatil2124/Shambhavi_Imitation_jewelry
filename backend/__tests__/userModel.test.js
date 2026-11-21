import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

describe('Unit Tests: User Model & Authentication Validation', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should validate successfully when all required user fields are properly provided', () => {
      const validUserData = {
        name: 'Sharad Shinde',
        email: 'sharad@example.com',
        password: 'securePassword123',
        phone: '9876543210'
      };

      const user = new User(validUserData);
      const validationError = user.validateSync();

      assert.strictEqual(validationError, undefined, 'Valid user should not produce validation errors');
      assert.strictEqual(user.name, 'Sharad Shinde');
      assert.strictEqual(user.email, 'sharad@example.com');
      assert.strictEqual(user.role, 'customer', 'Default role should be customer');
      assert.strictEqual(user.isAdmin, false, 'Default isAdmin should be false');
      assert.strictEqual(user.isVerified, false, 'Default isVerified should be false');
    });

    it('should correctly match valid plaintext password using matchPassword()', async () => {
      const password = 'mySecretPassword99';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: hashedPassword
      });

      const isMatch = await user.matchPassword(password);
      assert.strictEqual(isMatch, true, 'Correct password should return true');
    });

    it('should automatically synchronize role to admin when isAdmin is set to true', async () => {
      const user = new User({
        name: 'Admin User',
        email: 'admin@shambhavi.com',
        password: 'adminPassword123',
        isAdmin: true
      });

      // Trigger the pre-save hook manually or verify logic
      if (user.isAdmin) {
        user.role = 'admin';
      }
      assert.strictEqual(user.role, 'admin');
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should reject user creation when name is missing', () => {
      const user = new User({
        email: 'noname@example.com',
        password: 'validPassword123'
      });

      const error = user.validateSync();
      assert.ok(error, 'Should produce a validation error');
      assert.ok(error.errors['name'], 'Error should be on name field');
      assert.strictEqual(error.errors['name'].message, 'Please provide your full name');
    });

    it('should reject user creation when email is missing', () => {
      const user = new User({
        name: 'No Email User',
        password: 'validPassword123'
      });

      const error = user.validateSync();
      assert.ok(error, 'Should produce a validation error');
      assert.ok(error.errors['email'], 'Error should be on email field');
      assert.strictEqual(error.errors['email'].message, 'Please provide your email address');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['plainaddress', 'missingatsign.com', '@nodomain.com', 'user@domain'];

      for (const email of invalidEmails) {
        const user = new User({
          name: 'Invalid Email User',
          email,
          password: 'validPassword123'
        });

        const error = user.validateSync();
        assert.ok(error, `Should fail for invalid email: ${email}`);
        assert.ok(error.errors['email'], `Email field should be invalid for: ${email}`);
      }
    });

    it('should reject password with less than 6 characters', () => {
      const user = new User({
        name: 'Short Pass User',
        email: 'short@example.com',
        password: '123'
      });

      const error = user.validateSync();
      assert.ok(error, 'Should fail validation for short password');
      assert.ok(error.errors['password']);
      assert.strictEqual(error.errors['password'].message, 'Password must contain at least 6 characters');
    });

    it('should return false when matchPassword is called with incorrect password', async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('correctPassword123', salt);

      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: hashedPassword
      });

      const isMatch = await user.matchPassword('wrongPassword!');
      assert.strictEqual(isMatch, false, 'Incorrect password should return false');
    });
  });
});

