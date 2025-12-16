import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
  {
    // remove global unique constraint so different users can use same category name
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: '#a3a3a3' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// enforce uniqueness per user (a user cannot create duplicate category names, but different users may)
categorySchema.index({ name: 1, createdBy: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;