import mongoose from 'mongoose';
import categoryModel from '../models/Category';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  try {
    const dbUri = process.env.DATABASE_LOCAL || 'mongodb://localhost:27017/Finance';
    console.log('Connecting to', dbUri);
    await mongoose.connect(dbUri);

    const categories = await categoryModel.find({});
    console.log(`Found ${categories.length} categories.`);

    for (const cat of categories) {
      const oldName = cat.name;
      const newName = oldName.charAt(0).toUpperCase() + oldName.slice(1);
      if (oldName !== newName) {
        await categoryModel.updateOne({ _id: cat._id }, { name: newName });
        console.log(`Updated: "${oldName}" -> "${newName}"`);
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
