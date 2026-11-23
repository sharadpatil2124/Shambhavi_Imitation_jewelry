import { Model } from '../db/model.js';

// Table: categories
const Category = Model.define('Category', {
  table: 'categories',
  fields: {
    name: { type: 'string', required: 'Please specify the category name', trim: true },
    description: { type: 'string', trim: true },
    image: { type: 'string', required: 'Please upload a category catalog cover image' },
    slug: { type: 'string', lowercase: true }
  },
  preSave() {
    if (this.isModified('name')) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }
});

export default Category;
