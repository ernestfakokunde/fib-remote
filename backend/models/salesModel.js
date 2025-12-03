import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    customer: { type: String, default: "Walk-in Customer", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Sales = mongoose.model("Sales", salesSchema);
export default Sales;