import Category from '../models/Category.js';
import { uploadToImageKit } from '../utils/upload.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new catalog category (Admin Only)
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Handle Uploaded Cover File
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToImageKit(req.file.path, '/sambhavi-categories');
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    if (!imageUrl) {
      res.status(400);
      throw new Error('Please upload a cover thumbnail photo for this catalog category');
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400);
      throw new Error('A category with this catalog name already exists');
    }

    const category = await Category.create({
      name,
      description,
      image: imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'New jewelry category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit existing category (Admin Only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found: Catalog node does not exist');
    }

    const { name, description } = req.body;

    let imageUrl = category.image;
    if (req.file) {
      imageUrl = await uploadToImageKit(req.file.path, '/sambhavi-categories');
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.image = imageUrl;

    await category.save();

    res.json({
      success: true,
      message: 'Catalog category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin Only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found: Catalog node does not exist');
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Catalog category and references removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
