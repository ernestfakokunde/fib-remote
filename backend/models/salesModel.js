import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantName: { type: String, default: "" },
    quantityBase: { type: Number, min: 0.000001, default: null },
    conversionToBase: { type: Number, min: 0.000001, default: 1 },
    quantity: { type: Number, required: true, min: 1 },
    quantityReturned: { type: Number, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    customer: { type: String, default: "Walk-in Customer", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Sales = mongoose.model("Sales", salesSchema);
export default Sales;
