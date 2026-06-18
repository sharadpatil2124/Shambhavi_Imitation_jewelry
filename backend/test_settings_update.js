import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Settings from './models/Settings.js';

console.log('Connecting to database...');
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected successfully.');
    
    // Find all settings documents
    const allSettings = await Settings.find({});
    console.log(`Found ${allSettings.length} settings documents.`);
    for (const s of allSettings) {
      console.log(`Setting ID: ${s._id}, contactPhone: "${s.contactPhone}"`);
    }

    console.log('Updating settings contactPhone to "+91 70838 74227"...');
    const res = await Settings.updateMany({}, { contactPhone: '+91 70838 74227' });
    console.log('Update result:', res);

    const updated = await Settings.find({});
    console.log('Updated settings in DB:');
    for (const s of updated) {
      console.log(`Setting ID: ${s._id}, contactPhone: "${s.contactPhone}"`);
    }

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
