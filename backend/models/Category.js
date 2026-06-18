import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please specify the category name'],
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Cloudinary category thumbnail URL
    required: [true, 'Please upload a category catalog cover image']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate clean URL slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
