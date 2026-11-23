import dotenv from 'dotenv';
import { closeDB, describeDbError } from '../config/db.js';
import { prepareDatabase } from '../db/migrate.js';
import User from '../models/userModel.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';

// Load environment variables from backend directory context
dotenv.config();

const createAdmin = async () => {
  console.log(`Connecting to database...`);
  try {
    await prepareDatabase();
    console.log('✅ Connected to MySQL successfully.');

    const adminEmail = 'admin@shambhavi.com';

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(`ℹ️ Admin user with email "${adminEmail}" already exists in the database.`);
      await closeDB();
      process.exit(0);
    }

    console.log('Creating permanent Admin account...');
    const admin = await User.create({
      name: 'Shambhavi Admin',
      email: adminEmail,
      password: 'admin123', // Hashed securely by the User model's save step using bcryptjs
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
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed with error:', describeDbError(error));
    await closeDB().catch(() => {});
    process.exit(1);
  }
};

createAdmin();
