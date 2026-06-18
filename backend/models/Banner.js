import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please specify the banner title'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Cloudinary high-res banner URL
    required: [true, 'Please upload a banner graphic asset']
  },
  link: {
    type: String, // Click navigation link path
    default: '/shop'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
