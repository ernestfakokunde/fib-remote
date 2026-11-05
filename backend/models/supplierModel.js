import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  address: { type: String, trim: true, maxlength: 500, default: "" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  openingBalance: { type: Number, min: 0, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
supplierSchema.index({ createdBy: 1, name: 1 }, { unique: true });
export default mongoose.model("Supplier", supplierSchema);
