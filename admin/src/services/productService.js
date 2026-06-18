import api from './api.js';

const productService = {
  /**
   * Fetch all products from MERN catalog
   * Supports: search, category, minPrice, maxPrice, rating, sort, isTrending, isNewArrival, page, limit
   */
  getProducts: async (params = {}) => {
    try {
      // Axios request passes params object which compiles clean ?key=value query strings
      return await api.get('/products', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch single jewelry details by database ID
   */
  getProductById: async (id) => {
    try {
      return await api.get(`/products/${id}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch all active jewelry categories
   */
  getCategories: async () => {
    try {
      return await api.get('/categories');
    } catch (error) {
      throw error;
    }
  }
};

export default productService;
