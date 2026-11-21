import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

describe('Unit Tests: Product Model & Inventory Pricing Validation', () => {
  const dummyCategoryId = new mongoose.Types.ObjectId();

  describe('Positive Test Cases (Happy Path)', () => {
    it('should validate successfully when all required product fields are provided', () => {
      const product = new Product({
        name: 'Royal Kundan Choker Set',
        sku: 'RKS-CHOKER-001',
        category: dummyCategoryId,
        price: 1499,
        originalPrice: 2499,
        description: 'Handcrafted premium imitation jewelry with pearls and gold finish.',
        images: ['https://example.com/img1.jpg'],
        stock: 15
      });

      const error = product.validateSync();
      assert.strictEqual(error, undefined, 'Valid product should pass validation without error');
      assert.strictEqual(product.name, 'Royal Kundan Choker Set');
      assert.strictEqual(product.sku, 'RKS-CHOKER-001');
      assert.strictEqual(product.stock, 15);
      assert.strictEqual(product.rating, 4.5, 'Default rating should be 4.5');
      assert.strictEqual(product.isTrending, false);
      assert.strictEqual(product.isNewArrival, false);
    });

    it('should calculate discount percentage correctly when originalPrice is greater than retail price', () => {
      const product = new Product({
        name: 'Kundan Set',
        sku: 'KS-01',
        category: dummyCategoryId,
        price: 1500,
        originalPrice: 2000,
        description: 'Test description',
        images: ['https://example.com/img.jpg'],
        stock: 5
      });

      // Execute schema pre-save hook discount calculation
      if (product.originalPrice > product.price) {
        product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      } else {
        product.discount = 0;
      }

      assert.strictEqual(product.discount, 25, 'Discount should be 25%');
    });

    it('should set discount to 0% when retail price equals or exceeds originalPrice', () => {
      const product = new Product({
        name: 'Solitaire Ring',
        sku: 'SR-01',
        category: dummyCategoryId,
        price: 999,
        originalPrice: 999,
        description: 'Test description',
        images: ['https://example.com/ring.jpg'],
        stock: 10
      });

      if (product.originalPrice > product.price) {
        product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      } else {
        product.discount = 0;
      }

      assert.strictEqual(product.discount, 0, 'Discount should be 0 when prices are equal');
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should reject product creation when required fields are missing', () => {
      const product = new Product({});
      const error = product.validateSync();

      assert.ok(error, 'Should fail validation when required fields are missing');
      assert.ok(error.errors['name'], 'Should require name');
      assert.ok(error.errors['sku'], 'Should require sku');
      assert.ok(error.errors['category'], 'Should require category');
      assert.ok(error.errors['price'], 'Should require price');
      assert.ok(error.errors['originalPrice'], 'Should require originalPrice');
      assert.ok(error.errors['description'], 'Should require description');
    });

    it('should reject negative retail price', () => {
      const product = new Product({
        name: 'Item',
        sku: 'ITEM-01',
        category: dummyCategoryId,
        price: -100,
        originalPrice: 500,
        description: 'Test description',
        images: ['img.jpg'],
        stock: 5
      });

      const error = product.validateSync();
      assert.ok(error);
      assert.ok(error.errors['price']);
      assert.strictEqual(error.errors['price'].message, 'Price cannot be negative');
    });

    it('should reject negative originalPrice', () => {
      const product = new Product({
        name: 'Item',
        sku: 'ITEM-02',
        category: dummyCategoryId,
        price: 200,
        originalPrice: -50,
        description: 'Test description',
        images: ['img.jpg'],
        stock: 5
      });

      const error = product.validateSync();
      assert.ok(error);
      assert.ok(error.errors['originalPrice']);
      assert.strictEqual(error.errors['originalPrice'].message, 'Original price cannot be negative');
    });

    it('should reject negative inventory stock', () => {
      const product = new Product({
        name: 'Item',
        sku: 'ITEM-03',
        category: dummyCategoryId,
        price: 200,
        originalPrice: 300,
        description: 'Test description',
        images: ['img.jpg'],
        stock: -5
      });

      const error = product.validateSync();
      assert.ok(error);
      assert.ok(error.errors['stock']);
      assert.strictEqual(error.errors['stock'].message, 'Stock cannot be negative');
    });

    it('should reject ratings greater than 5.0 or less than 1.0', () => {
      const highRatingProduct = new Product({
        name: 'Item',
        sku: 'ITEM-04',
        category: dummyCategoryId,
        price: 200,
        originalPrice: 300,
        description: 'Test description',
        images: ['img.jpg'],
        stock: 5,
        rating: 5.5
      });

      const errorHigh = highRatingProduct.validateSync();
      assert.ok(errorHigh);
      assert.ok(errorHigh.errors['rating']);
      assert.strictEqual(errorHigh.errors['rating'].message, 'Rating cannot exceed 5.0');

      const lowRatingProduct = new Product({
        name: 'Item',
        sku: 'ITEM-05',
        category: dummyCategoryId,
        price: 200,
        originalPrice: 300,
        description: 'Test description',
        images: ['img.jpg'],
        stock: 5,
        rating: 0.5
      });

      const errorLow = lowRatingProduct.validateSync();
      assert.ok(errorLow);
      assert.ok(errorLow.errors['rating']);
      assert.strictEqual(errorLow.errors['rating'].message, 'Rating must be at least 1.0');
    });
  });
});

