import mongoose from "mongoose";

const salesSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  quantity: { type: Number, required: true },
  sellingPrice: { type: Number },
  totalRevenue: { type: Number },
  costPrice: { type: Number },
  profit: { type: Number },
  date: { type: Date, default: Date.now },
  customer: { type: String, default: "Walk-in Customer" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
},
  { timestamps: true }
);

const Sales = mongoose.model("Sales", salesSchema);
export default Sales;