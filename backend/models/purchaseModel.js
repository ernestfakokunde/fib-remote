import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantName: { type: String, default: "" },
    conversionToBase: { type: Number, min: 0.000001, default: 1 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
