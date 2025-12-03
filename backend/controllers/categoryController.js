import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Products from "../models/productModel.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = name.trim();

    const existing = await Category.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
      createdBy: userId,
    });
    if (existing) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    const category = new Category({
      name: normalizedName,
      description: description ? description.trim() : "",
      createdBy: userId,
    });

    const saved = await category.save();
    res.status(201).json({ message: "Category created", category: saved });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Category name already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "50", 10));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "name";

    const [categories, total] = await Promise.all([
      Category.find({ createdBy: userId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Category.countDocuments({ createdBy: userId }),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const { name, description } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    if (updates.name) {
      const existing = await Category.findOne({
        _id: { $ne: id },
        createdBy: userId,
        name: { $regex: `^${updates.name}$`, $options: "i" },
      });
      if (existing) {
        return res.status(409).json({ message: "Category name already exists" });
      }
    }

    const updated = await Category.findOneAndUpdate(
      { _id: id, createdBy: userId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", category: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "invalid category id" });
    }

    const categoryOwned = await Category.findOne({ _id: id, createdBy: userId }).lean();
    if (!categoryOwned) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productIsUsing = await Products.findOne({ category: id, createdBy: userId })
      .select("_id")
      .lean();
    if (productIsUsing) {
      return res
        .status(400)
        .json({ message: "Category is assigned to products, cannot delete" });
    }
    await Category.deleteOne({ _id: id, createdBy: userId });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};