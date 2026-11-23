import { Model } from '../db/model.js';

// Table: carts (one per user). Cart lines are in the child table cart_items.
const Cart = Model.define('Cart', {
  table: 'carts',
  fields: {
    user: { type: 'id', ref: 'User', column: 'user_id', required: true }
  },
  children: {
    items: {
      table: 'cart_items',
      foreignKey: 'cart_id',
      fields: {
        product: { type: 'id', ref: 'Product', column: 'product_id', required: true },
        quantity: { type: 'number', required: true, min: [1, 'Quantity must be at least 1'], default: 1 },
        color: { type: 'string', trim: true },
        size: { type: 'string', trim: true }
      }
    }
  }
});

export default Cart;
