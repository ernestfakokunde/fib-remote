import mongoose from "mongoose";
import Category from "../models/categoryModel.js";

const migrateCategoryIndexes = async () => {
  const collection = Category.collection;
  const indexes = await collection.indexes();
  const obsoleteNameIndexes = indexes.filter((index) =>
    index.unique &&
    Object.keys(index.key || {}).length === 1 &&
    index.key.name === 1 &&
    index.name !== "_id_"
  );

  for (const index of obsoleteNameIndexes) {
    await collection.dropIndex(index.name);
    console.log(`Removed obsolete global category index: ${index.name}`);
  }

  await collection.createIndex({ name: 1, createdBy: 1 }, { unique: true, name: "name_1_createdBy_1" });
};

export const connectDB = async () =>{
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDb connecteed: " + conn.connection.host);
    await migrateCategoryIndexes();
    console.log("Category uniqueness is scoped to each workspace.");
    
  } catch (error) {
    console.log("Error: " + error.message);
    process.exit(1);
  }
}
