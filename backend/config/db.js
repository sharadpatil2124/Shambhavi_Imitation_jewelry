// import mongoose from 'mongoose';

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shambhavi-imitation', {
//       autoIndex: true, // Auto-build database indexes for high search performance
//       tlsAllowInvalidCertificates: true, // Fix certificate validation failures (outdated CAs/proxies)
//       tlsAllowInvalidHostnames: true,
//     });

//     console.log(`✨ MongoDB Connected Successfully: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ MongoDB Connection Error: ${error.message}`);
//     process.exit(1); // Shutdown server with code failure
//   }
// };

// export default connectDB;


import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;