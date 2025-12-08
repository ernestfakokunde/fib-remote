import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Products from '../models/productModel.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const exists = await Products.collection.indexExists('category_1');
    if (exists) {
      console.log('Dropping index category_1 on products collection...');
      await Products.collection.dropIndex('category_1');
      console.log('Dropped index category_1');
    } else {
      console.log('Index category_1 does not exist; nothing to do.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to drop index:', err);
    process.exit(1);
  }
};

run();
