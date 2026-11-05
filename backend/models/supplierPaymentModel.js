import mongoose from "mongoose";
const schema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  amount: { type: Number, min: 0.01, required: true },
  date: { type: Date, default: Date.now },
  reference: { type: String, trim: true, maxlength: 120, default: "" },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
schema.index({ createdBy: 1, supplier: 1, date: -1 });
export default mongoose.model("SupplierPayment", schema);
