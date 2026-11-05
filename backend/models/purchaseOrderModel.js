import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
  number: { type: String, required: true, trim: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  status: { type: String, enum: ["draft", "approved", "partially_received", "received", "cancelled"], default: "draft" },
  lines: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    orderedQuantity: { type: Number, required: true, min: 0.000001 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    conversionToBase: { type: Number, required: true, min: 0.000001, default: 1 },
  }],
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  expectedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
purchaseOrderSchema.index({ createdBy: 1, number: 1 }, { unique: true });
export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
