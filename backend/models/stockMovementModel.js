import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
  quantityDelta: { type: Number, required: true },
  type: { type: String, enum: ["opening", "purchase", "sale", "adjustment", "damage", "loss", "return", "transfer_in", "transfer_out"], required: true },
  reason: { type: String, trim: true, maxlength: 500, required: true },
  referenceType: { type: String, trim: true, maxlength: 40, default: "" },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  transferId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
stockMovementSchema.index({ createdBy: 1, createdAt: -1 });
stockMovementSchema.index({ createdBy: 1, product: 1, createdAt: -1 });
stockMovementSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"], function () {
  throw new Error("Stock movement history is immutable");
});
stockMovementSchema.pre("save", function () {
  if (!this.isNew) throw new Error("Stock movement history is immutable");
});
export default mongoose.model("StockMovement", stockMovementSchema);
