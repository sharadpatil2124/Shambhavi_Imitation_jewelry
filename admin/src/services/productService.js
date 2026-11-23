import api from './api.js';

// Errors from these calls propagate to the caller unchanged (the api client already turns
// failed responses into an Error with the server's message).
const productService = {
  /**
   * Fetch all products from the catalog
   * Supports: search, category, minPrice, maxPrice, rating, sort, isTrending, isNewArrival, page, limit
   */
  getProducts: (params = {}) => api.get('/products', { params }),

  /**
   * Fetch single jewelry details by database ID
   */
  getProductById: (id) => api.get(`/products/${id}`),

  /**
   * Fetch all active jewelry categories
   */
  getCategories: () => api.get('/categories')
};

export default productService;
