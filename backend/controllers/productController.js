import Products from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import User from "../models/userModel.js";
import { getProductLimit } from "../utils/accessScope.js";
import {
  notifyLowStock,
  notifyOutOfStock,
  notifyProductAdded,
} from "../services/notificationService.js";

const getStockStatus = (quantity, reOrderLevel = 10) => {
  if (quantity === 0) {
    return "Out of Stock";
  }
  if (quantity <= reOrderLevel) {
    return "Low Stock";
  }
  return "In Stock";
};

export const createProduct = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add products" });
    }

    const workspaceOwnerId = req.workspaceOwnerId;
    const workspaceUser = await User.findById(workspaceOwnerId);
    if (!workspaceUser) {
      return res.status(404).json({ message: "Workspace owner not found" });
    }

    const productsCount = await Products.countDocuments({ createdBy: workspaceOwnerId });
    const productLimit = getProductLimit(workspaceUser.subscriptionPlan);

    if (productLimit !== null && productsCount >= productLimit) {
      return res.status(403).json({
        message: "You have reached the maximum number of products allowed under your subscription plan.",
        currentProductCount: productsCount,
        productLimit,
      });
    }

    const {
      name,
      category,
      sku,
      supplier,
      costPrice,
      sellingPrice,
      description = "",
      quantity = 0,
      reOrderLevel = 10,
    } = req.body;

    if (!name || !category || !sku || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: "Bad request. Missing required fields" });
    }

    const categoryexists = await Category.findOne({ _id: category, createdBy: workspaceOwnerId });
    if (!categoryexists) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    const normalizedName = name.trim();
    const normalizedSku = sku.trim().toUpperCase();

    const duplicateName = await Products.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
      createdBy: workspaceOwnerId,
    });
    if (duplicateName) {
      return res.status(409).json({ message: "Product name already exists" });
    }

    const duplicateSku = await Products.findOne({ sku: normalizedSku, createdBy: workspaceOwnerId });
    if (duplicateSku) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    const parsedCostPrice = Number(costPrice);
    const parsedSellingPrice = Number(sellingPrice);
    const parsedQuantity = Math.max(0, Number(quantity) || 0);
    const parsedReOrderLevel = Math.max(0, Number(reOrderLevel) || 10);

    if (Number.isNaN(parsedCostPrice) || Number.isNaN(parsedSellingPrice)) {
      return res.status(400).json({ message: "Cost price and selling price must be numbers" });
    }

    if (parsedSellingPrice <= parsedCostPrice) {
      return res.status(400).json({
        message: "Selling price should be greater than cost price. Take another look!",
      });
    }

    const product = new Products({
      name: normalizedName,
      sku: normalizedSku,
      supplier: supplier?.trim() || "Unknown",
      category,
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
      description: description?.trim() || "",
      quantity: parsedQuantity,
      reOrderLevel: parsedReOrderLevel,
      createdBy: workspaceOwnerId,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
      success: true,
      currentProductCount: productsCount + 1,
    });

    await notifyProductAdded(workspaceUser, savedProduct);

    const stockStatus = getStockStatus(savedProduct.quantity, savedProduct.reOrderLevel);
    if (stockStatus === "Low Stock") {
      await notifyLowStock(workspaceUser, savedProduct);
    } else if (stockStatus === "Out of Stock") {
      await notifyOutOfStock(workspaceUser, savedProduct);
    }
  } catch (error) {
    console.error(error);
    if (error && error.code === 11000) {
      const dupKey = Object.keys(error.keyValue || {})[0];
      const dupVal = error.keyValue ? error.keyValue[dupKey] : undefined;
      return res.status(409).json({ message: `${dupKey || 'Field'} already exists`, details: { [dupKey]: dupVal } });
    }
    res.status(500).json({ message: "Server error product creation failed try again" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search, category, stock, sort, page = 1, limit = 12 } = req.query;
    const workspaceOwnerId = req.workspaceOwnerId;
    const filter = { createdBy: workspaceOwnerId };
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 12);

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }
    if (category) {
      filter.category = category;
    }
    if (stock === "out-of-stock") {
      filter.quantity = 0;
    } else if (stock === "low-stock") {
      filter.quantity = { $gt: 0, $lte: 10 };
    } else if (stock === "in-stock") {
      filter.quantity = { $gt: 10 };
    }

    const skip = (pageNumber - 1) * limitNumber;
    const sortQuery = sort || "-createdAt";
    const totalProducts = await Products.countDocuments(filter);
    const products = await Products.find(filter)
      .populate("category", "name")
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    res.json({
      success: true,
      total: totalProducts,
      pages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products: products.map((product) => ({
        ...product,
        profit: product.sellingPrice - product.costPrice,
        stockStatus: getStockStatus(product.quantity, product.reOrderLevel),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId })
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      product: {
        ...product._doc,
        stockStatus: getStockStatus(product.quantity, product.reOrderLevel),
        profit: product.sellingPrice - product.costPrice,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error fetching product" });
  }
};
