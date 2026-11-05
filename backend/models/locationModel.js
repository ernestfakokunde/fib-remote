import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  address: { type: String, trim: true, maxlength: 300, default: "" },
  isDefault: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
locationSchema.index({ createdBy: 1, name: 1 }, { unique: true });
export default mongoose.model("Location", locationSchema);
