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
    baseUnit: { type: String, default: "unit", trim: true, maxlength: 24 },
    variants: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, trim: true, required: true },
      sku: { type: String, trim: true, uppercase: true, required: true },
      attributes: { type: Map, of: String, default: {} },
      unit: { type: String, trim: true, default: "unit" },
      conversionToBase: { type: Number, min: 0.000001, default: 1 },
      costPrice: { type: Number, min: 0 },
      sellingPrice: { type: Number, min: 0 },
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1, createdBy: 1 }, { unique: true });
productSchema.index({ "variants.sku": 1, createdBy: 1 });

const Products = mongoose.model("Products", productSchema);

export default Products;
