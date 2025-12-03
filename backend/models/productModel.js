 import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    supplier: { type: String, default: "Unknown", trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },
    description: { type: String, default: "" },
    reOrderLevel: { type: Number, default: 10, min: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1, createdBy: 1 }, { unique: true });

const Products = mongoose.model("Products", productSchema);

export default Products;
