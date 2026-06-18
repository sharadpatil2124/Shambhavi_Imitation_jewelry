import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123456',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mockKeySecret6543210987'
});

console.log('💳 Razorpay Payment Gateway Client Instantiated');

export default razorpayInstance;
