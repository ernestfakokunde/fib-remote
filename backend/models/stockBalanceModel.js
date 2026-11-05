import mongoose from "mongoose";

const stockBalanceSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  quantity: { type: Number, min: 0, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
stockBalanceSchema.index({ createdBy: 1, product: 1, variantId: 1, location: 1 }, { unique: true });
export default mongoose.model("StockBalance", stockBalanceSchema);
