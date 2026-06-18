import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';

// Load environment variables from backend directory context
dotenv.config();

const createAdmin = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is missing in your .env environment variables.');
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas successfully.');

    const adminEmail = 'admin@shambhavi.com';

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(`ℹ️ Admin user with email "${adminEmail}" already exists in the database.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('Creating permanent Admin account...');
    const admin = await User.create({
      name: 'Shambhavi Admin',
      email: adminEmail,
      password: 'admin123', // Hashed securely by Mongoose pre-save hook using bcryptjs
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      phone: '1234567890'
    });

    console.log('✅ Admin account registered successfully:', admin._id);

    // Initialize empty Cart and Wishlist for Admin to ensure database integrity
    const cartExists = await Cart.findOne({ user: admin._id });
    if (!cartExists) {
      await Cart.create({ user: admin._id, items: [] });
      console.log('✅ Created empty Cart dossier for Admin.');
    }

    const wishlistExists = await Wishlist.findOne({ user: admin._id });
    if (!wishlistExists) {
      await Wishlist.create({ user: admin._id, products: [] });
      console.log('✅ Created empty Wishlist dossier for Admin.');
    }

    console.log('🎉 Seeder completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed with error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

createAdmin();
