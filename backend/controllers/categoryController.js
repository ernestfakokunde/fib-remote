import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Products from "../models/productModel.js";

export  const createCategory = async ( req, res)=>{
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check existing category (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : "",
      createdBy: req.user ? req.user._id : undefined,
    });

    const saved = await category.save();
    res.status(201).json({ message: "Category created", category: saved });
  } catch (error) {
     // handle duplicate key error if it sneaks through
    if (error.code === 11000) {
      return res.status(409).json({ message: "Category name already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
  }

  export const getCategories = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "50", 10)); // default 50
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "name";

    const [categories, total] = await Promise.all([
      Category.find({})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Category.countDocuments(),
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
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const { name, description } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    // If renaming, ensure uniqueness (case-insensitive)
    if (updates.name) {
      const existing = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: `^${updates.name}$`, $options: "i" },
      });
      if (existing) {
        return res.status(409).json({ message: "Category name already exists" });
      }
    }

    const updated = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", category: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async(req, res)=>{
  try {
    const { id } = req.params;
    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({ message:"invalid category id"})
    }

    const productIsUsing = await Products.findOne({ category:id }).select("_id").lean()
    if(productIsUsing){
      return res.status(400).json({ message:"Category is assigned to products, cannot delete"})
    }
    const deleted = await Category.findByIdAndDelete(id);
    if(!deleted){
      return res.status(404).json({ message:"Category not found"})
    }
    res.json({ message:"Category deleted", category:deleted})
  }
  catch (error) {
    res.status(500).json({ message:"Server error"})
  }
}