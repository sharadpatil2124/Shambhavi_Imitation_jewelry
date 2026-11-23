import { Model } from '../db/model.js';

// Table: wishlists (one per user). Saved products are in the child table wishlist_items.
const Wishlist = Model.define('Wishlist', {
  table: 'wishlists',
  fields: {
    user: { type: 'id', ref: 'User', column: 'user_id', required: true }
  },
  children: {
    products: {
      table: 'wishlist_items',
      foreignKey: 'wishlist_id',
      scalar: 'product', // a plain list of product IDs
      fields: {
        product: { type: 'id', ref: 'Product', column: 'product_id' }
      }
    }
  }
});

export default Wishlist;
