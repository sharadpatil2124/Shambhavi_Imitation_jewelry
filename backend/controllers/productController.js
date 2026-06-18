import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadToImageKit } from '../utils/upload.js';

// @desc    Get all products (with pagination, search, sorting and filters)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      sort,
      isTrending,
      isNewArrival,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Normalize potential parameter pollution arrays/inputs to safe string values
    const searchStr = search ? (Array.isArray(search) ? String(search[0]) : String(search)).trim() : '';
    const categoryStr = category ? (Array.isArray(category) ? String(category[0]) : String(category)).trim() : '';

    // 1. Text Search matching name or description
    if (searchStr) {
      query.$or = [
        { name: { $regex: searchStr, $options: 'i' } },
        { description: { $regex: searchStr, $options: 'i' } },
        { sku: { $regex: searchStr, $options: 'i' } }
      ];
    }

    // 2. Relational Category Matching (by Slug, Name, or ObjectId)
    if (categoryStr) {
      // Find category by slug/name first if it's not a direct MongoDB ID format
      if (categoryStr.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = categoryStr;
      } else {
        const categorySlug = categoryStr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const foundCategory = await Category.findOne({
          $or: [
            { slug: categoryStr },
            { slug: categorySlug },
            { name: { $regex: new RegExp(`^${categoryStr}$`, 'i') } }
          ]
        });

        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If no matching category, return empty results early
          return res.json({
            success: true,
            products: [],
            page: 1,
            pages: 0,
            total: 0
          });
        }
      }
    }

    // 3. Price Filter Band
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Star Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // 5. Special Marketing Flags
    if (isTrending === 'true') query.isTrending = true;
    if (isNewArrival === 'true') query.isNewArrival = true;

    // 6. Sorting Mappings
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOptions = { price: 1 };
          break;
        case 'price-desc':
          sortOptions = { price: -1 };
          break;
        case 'rating':
          sortOptions = { rating: -1 };
          break;
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    // 7. Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      res.status(404);
      throw new Error('Product not found: Masterpiece ID does not exist');
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new product (Admin Only)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      originalPrice,
      description,
      details,
      colors,
      sizes,
      stock,
      isTrending,
      isNewArrival,
      finishType,
      weight
    } = req.body;

    // Handle Uploaded File Paths
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToImageKit(file.path, '/sambhavi-products');
        imageUrls.push(url);
      }
    } else if (req.body.images) {
      // Fallback supporting plain array inputs
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (imageUrls.length === 0) {
      res.status(400);
      throw new Error('Please upload at least one image graphic asset for the product');
    }

    const product = await Product.create({
      name,
      sku,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      description,
      details: Array.isArray(details) ? details : (details ? details.split(',') : []),
      colors: Array.isArray(colors) ? colors : (colors ? colors.split(',') : []),
      sizes: Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',') : []),
      images: imageUrls,
      stock: Number(stock || 0),
      isTrending: isTrending === 'true' || isTrending === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      finishType: finishType || '',
      weight: weight || ''
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit existing product details (Admin Only)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found: Masterpiece ID does not exist');
    }

    const {
      name,
      sku,
      category,
      price,
      originalPrice,
      description,
      details,
      colors,
      sizes,
      stock,
      isTrending,
      isNewArrival,
      finishType,
      weight
    } = req.body;

    // Check if new files are uploaded
    let imageUrls = product.images;
    if (req.files && req.files.length > 0) {
      const newUrls = [];
      for (const file of req.files) {
        const url = await uploadToImageKit(file.path, '/sambhavi-products');
        newUrls.push(url);
      }
      imageUrls = newUrls; // Replace with new uploads
    }

    product.name = name || product.name;
    product.sku = sku || product.sku;
    product.category = category || product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.originalPrice = originalPrice !== undefined ? Number(originalPrice) : product.originalPrice;
    product.description = description || product.description;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.isTrending = isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : product.isTrending;
    product.isNewArrival = isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : product.isNewArrival;
    product.images = imageUrls;
    product.finishType = finishType !== undefined ? finishType : product.finishType;
    product.weight = weight !== undefined ? weight : product.weight;

    if (details) {
      product.details = Array.isArray(details) ? details : details.split(',');
    }
    if (colors) {
      product.colors = Array.isArray(colors) ? colors : colors.split(',');
    }
    if (sizes) {
      product.sizes = Array.isArray(sizes) ? sizes : sizes.split(',');
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product details updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin Only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found: Masterpiece ID does not exist');
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product and associated inventory deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
