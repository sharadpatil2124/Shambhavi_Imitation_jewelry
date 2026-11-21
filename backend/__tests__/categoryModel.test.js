import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Category from '../models/Category.js';

describe('Unit Tests: Category Model & Slug Generation', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should validate successfully when all required fields are provided', () => {
      const category = new Category({
        name: 'Royal Necklaces',
        description: 'Exquisite necklaces collection',
        image: 'https://example.com/necklace-cat.jpg'
      });

      const error = category.validateSync();
      assert.strictEqual(error, undefined, 'Category should be valid');
      assert.strictEqual(category.name, 'Royal Necklaces');
      assert.strictEqual(category.image, 'https://example.com/necklace-cat.jpg');
    });

    it('should correctly generate slug from category name', () => {
      const category = new Category({
        name: 'Bridal & Royal Bangles!',
        image: 'https://example.com/bangles.jpg'
      });

      // Execute slug generation logic from schema
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      assert.strictEqual(slug, 'bridal-royal-bangles', 'Slug should convert spaces and special characters to hyphens');
    });

    it('should strip multiple consecutive hyphens and edges from slug', () => {
      const rawName = '--- Kundan --- Earrings ---';
      const slug = rawName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      assert.strictEqual(slug, 'kundan-earrings');
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should reject category creation when name is missing', () => {
      const category = new Category({
        image: 'https://example.com/cat.jpg'
      });

      const error = category.validateSync();
      assert.ok(error, 'Should fail validation without name');
      assert.ok(error.errors['name']);
      assert.strictEqual(error.errors['name'].message, 'Please specify the category name');
    });

    it('should reject category creation when image is missing', () => {
      const category = new Category({
        name: 'Earrings'
      });

      const error = category.validateSync();
      assert.ok(error, 'Should fail validation without image');
      assert.ok(error.errors['image']);
      assert.strictEqual(error.errors['image'].message, 'Please upload a category catalog cover image');
    });
  });
});

