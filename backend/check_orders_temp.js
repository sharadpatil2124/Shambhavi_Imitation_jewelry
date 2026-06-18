import mongoose from 'mongoose';
import Order from './models/Order.js';
import User from './models/userModel.js';

const uri = 'mongodb+srv://sharad01:VCtP9ugQpmFPv6yt@cluster0.oywl2so.mongodb.net/tsambhavi-imitation';

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
  console.error(err);
  process.exit(1);
});
