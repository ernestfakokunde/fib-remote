import mongoose from "mongoose";
const schema = new mongoose.Schema({
  sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sales", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  quantity: { type: Number, min: 1, required: true },
  refundValue: { type: Number, min: 0, default: 0 },
  costReversal: { type: Number, min: 0, default: 0 },
  reason: { type: String, trim: true, maxlength: 500, required: true },
  disposition: { type: String, enum: ["restock", "damaged"], default: "restock" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
schema.index({ createdBy: 1, sale: 1 });
export default mongoose.model("SalesReturn", schema);
