import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import User from './models/userModel.js';
import { safeErrorMessage } from './utils/redactSecrets.js';

dotenv.config();

// Never hardcode the connection string: it holds the database password. It comes from MONGO_URI in .env.
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI is missing in your .env environment variables.');
  process.exit(1);
}


async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected.');

  const users = await User.find({});
  console.log(`Found ${users.length} users.`);
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email}), Role: ${u.role}, ID: ${u._id}`);
  }

  const orders = await Order.find({});
  console.log(`Found ${orders.length} orders.`);
  for (const o of orders) {
    console.log(`Order ID: ${o._id}, User: ${o.user}, Items Count: ${o.orderItems?.length}, Total: ₹${o.totalPrice}, Status: ${o.orderStatus}`);
    if (o.orderItems) {
      console.log('Items:', JSON.stringify(o.orderItems, null, 2));
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(safeErrorMessage(err));
  process.exit(1);
});
