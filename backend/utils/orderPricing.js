import Product from '../models/Product.js';
import { isValidId } from '../db/ids.js';
import Settings from '../models/Settings.js';

export const MAX_LINE_QUANTITY = 100;
const MAX_ORDER_LINES = 50;

export class PricingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const cleanOption = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

// Single source of truth for what an order costs. Never trust prices, discounts or totals from the browser.
// The maths mirrors the storefront checkout (frontend/src/store/cartSlice.js and pages/Checkout.jsx):
//   subtotal = sum(price x quantity), prices are tax-inclusive
//   shipping = 0 when subtotal > freeShippingThreshold, else shippingCharge
//   tax      = round(subtotal x taxRate%), already inside the subtotal
//   discount = round(subtotal x coupon%) when the coupon matches the store's active code
//   total    = subtotal + shipping - discount
export const priceOrder = async ({ orderItems, couponCode }) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new PricingError('No items specified to create an order');
  }
  if (orderItems.length > MAX_ORDER_LINES) {
    throw new PricingError(`An order can contain at most ${MAX_ORDER_LINES} different items`);
  }

  const lines = orderItems.map((item) => {
    const productId = String(item?.product ?? '');
    const quantity = Number(item?.quantity);

    if (!isValidId(productId)) {
      throw new PricingError('Order contains an invalid product');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new PricingError(`Quantity must be a whole number between 1 and ${MAX_LINE_QUANTITY}`);
    }
    return { productId, quantity, color: cleanOption(item.color), size: cleanOption(item.size) };
  });

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).select('name price images').lean();
  const productsById = new Map(products.map((p) => [String(p._id), p]));

  const items = lines.map((line) => {
    const product = productsById.get(line.productId);
    if (!product) {
      throw new PricingError('A product in your cart is no longer available. Please review your cart.');
    }
    return {
      product: product._id,
      name: product.name,
      quantity: line.quantity,
      price: product.price,
      image: product.images?.[0] || '',
      color: line.color,
      size: line.size,
    };
  });

  const settings = (await Settings.findOne().lean()) || {};

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = settings.freeShippingThreshold ?? 1500;
  const shippingCharge = settings.shippingCharge ?? 100;
  const shippingPrice = subtotal > freeShippingThreshold ? 0 : shippingCharge;
  const taxRate = settings.taxRate || 3;
  const taxPrice = Math.round(subtotal * (taxRate / 100));

  let discountPrice = 0;
  let appliedCouponCode = '';
  const code = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';
  if (code) {
    const activeCode = (settings.specialOfferCouponCode || 'SHAMBHAVI10').toUpperCase();
    if (code !== activeCode) {
      throw new PricingError('This coupon code is not valid. Please remove it and try again.');
    }
    const discountPercent = settings.specialOfferDiscountPercentage || 10;
    discountPrice = Math.round(subtotal * (discountPercent / 100));
    appliedCouponCode = code;
  }

  return {
    items,
    itemsPrice: subtotal - taxPrice,
    taxPrice,
    shippingPrice,
    discountPrice,
    totalPrice: subtotal + shippingPrice - discountPrice,
    couponCode: appliedCouponCode,
    settings,
  };
};

export const toPaise = (rupees) => Math.round(rupees * 100);
