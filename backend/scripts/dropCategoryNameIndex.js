import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Category from '../models/categoryModel.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    // list indexes first
    const indexes = await Category.collection.indexes();
    console.log('Current indexes on categories:', indexes.map(i => i.name));

    // Drop any global unique index on name (index name typically 'name_1')
    if (indexes.some(i => i.name === 'name_1')) {
      console.log('Dropping index name_1 on categories collection...');
      await Category.collection.dropIndex('name_1');
      console.log('Dropped index name_1');
    } else {
      console.log('Index name_1 does not exist; nothing to drop.');
    }

    // Ensure the compound index exists (will be created automatically by Mongoose when model initialises, but create explicitly)
    const compoundExists = indexes.some(i => i.key && i.key.name === 1 && i.key.createdBy === 1);
    if (!compoundExists) {
      console.log('Creating compound unique index {name:1, createdBy:1}...');
      await Category.collection.createIndex({ name: 1, createdBy: 1 }, { unique: true });
      console.log('Compound index created');
    } else {
      console.log('Compound index already exists');
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to adjust indexes:', err);
    process.exit(1);
  }
};

run();
