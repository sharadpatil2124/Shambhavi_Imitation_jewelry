import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getImageUrl } from '../src/utils/image.js';

describe('Unit Tests: Frontend Image URL Formatter Utility', () => {
  describe('Positive Test Cases (Happy Path)', () => {
    it('should return external HTTPS Cloudinary/ImageKit URL unchanged', () => {
      const externalUrl = 'https://ik.imagekit.io/hfrt6oef5/jewelry/necklace.jpg';
      const result = getImageUrl(externalUrl);
      assert.strictEqual(result, externalUrl);
    });

    it('should return external HTTP URL unchanged', () => {
      const httpUrl = 'http://example.com/images/sample.jpg';
      const result = getImageUrl(httpUrl);
      assert.strictEqual(result, httpUrl);
    });

    it('should prepend backend server URL to relative paths with leading slash', () => {
      const relativePath = '/uploads/choker-set.png';
      const result = getImageUrl(relativePath);
      assert.strictEqual(result, 'http://localhost:5000/uploads/choker-set.png');
    });

    it('should safely add missing leading slash to relative image paths', () => {
      const relativePath = 'uploads/bangles.jpg';
      const result = getImageUrl(relativePath);
      assert.strictEqual(result, 'http://localhost:5000/uploads/bangles.jpg');
    });
  });

  describe('Negative Test Cases (Failure Paths)', () => {
    it('should return empty string when URL is null', () => {
      assert.strictEqual(getImageUrl(null), '');
    });

    it('should return empty string when URL is undefined', () => {
      assert.strictEqual(getImageUrl(undefined), '');
    });

    it('should return empty string when URL is an empty string', () => {
      assert.strictEqual(getImageUrl(''), '');
    });
  });
});

