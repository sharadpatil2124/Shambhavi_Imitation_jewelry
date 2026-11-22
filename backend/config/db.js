import mongoose from 'mongoose';
import { safeErrorMessage } from '../utils/redactSecrets.js';

const connectDB = async () => {
  // The connection string only ever comes from the environment, and is never printed.
  if (!process.env.MONGO_URI) {
    console.error('❌ MongoDB Connection Error: MONGO_URI is not set in the environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50, // Maintain up to 50 socket connections for high concurrency
      minPoolSize: 5,  // Keep at least 5 warm sockets ready
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${safeErrorMessage(error)}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', safeErrorMessage(err));
});

export default connectDB;