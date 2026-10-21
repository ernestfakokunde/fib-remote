import Products from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import User from "../models/userModel.js";
import Sales from "../models/salesModel.js";
import Purchase from "../models/purchaseModel.js";
import mongoose from "mongoose";
import { getProductLimit, getPlanEntitlements } from "../utils/accessScope.js";
import SnapUsage from "../models/snapUsageModel.js";
import {
  notifyLowStock,
  notifyOutOfStock,
  notifyProductAdded,
} from "../services/notificationService.js";
import { z } from "zod";
import { isValidMoney, roundMoney } from "../utils/money.js";
import { GoogleGenAI } from "@google/genai";

const productImageResultSchema = z.object({
  productName: z.string().trim().min(1).max(160),
  brand: z.string().trim().max(100).nullable(),
  category: z.string().trim().max(100),
  netQuantityOrWeight: z.string().trim().max(80).nullable(),
  estimatedPrice: z.number().nonnegative().nullable(),
  description: z.string().trim().max(500),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).strict();

const productImageResponseSchema = {
  type: 'object',
  properties: {
    productName: { type: 'string', description: 'A concise, specific product name visible on the package.' },
    brand: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Visible brand, or null if not identifiable.' },
    category: { type: 'string', description: 'Likely product category, or an empty string if unclear.' },
    netQuantityOrWeight: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Visible size/weight/volume such as 500g or 1L, or null if not shown.' },
    estimatedPrice: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'Only a price visibly printed on the product; null if none is shown. Do not infer market price.' },
    description: { type: 'string', description: 'Brief description based only on visible product details.' },
    expiryDate: { anyOf: [{ type: 'string', format: 'date' }, { type: 'null' }], description: 'Visible expiry date in YYYY-MM-DD format, or null if not shown/readable.' },
  },
  required: ['productName', 'brand', 'category', 'netQuantityOrWeight', 'estimatedPrice', 'description', 'expiryDate'],
  additionalProperties: false,
};

let geminiClient;
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return geminiClient;
};

export const analyzeProductImage = async (req, res) => {
  const logFailure = (reason, details = {}) => {
    console.error("Product image analysis failed", {
      userId: String(req.user?._id || "unknown"),
      reason,
      ...details,
    });
  };

  try {
    const workspaceUser = await User.findById(req.workspaceOwnerId).select('subscriptionPlan subscriptionStatus subscriptionCurrentPeriodEnd');
    const entitlement = getPlanEntitlements(workspaceUser?.subscriptionPlan);
    const active = ['pro', 'enterprise'].includes(workspaceUser?.subscriptionPlan)
      && workspaceUser?.subscriptionStatus === 'active'
      && (!workspaceUser.subscriptionCurrentPeriodEnd || new Date(workspaceUser.subscriptionCurrentPeriodEnd) > new Date());
    if (!active || !entitlement.snapsPerDay) return res.status(403).json({ success: false, message: 'Snap to add is available on active Pro and Enterprise plans.' });
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dailySnapCount = await SnapUsage.countDocuments({ workspaceOwner: req.workspaceOwnerId, createdAt: { $gte: dayStart } });
    if (dailySnapCount >= entitlement.snapsPerDay) return res.status(429).json({ success: false, message: `You have reached today's ${entitlement.snapsPerDay} snap limit.`, snapsUsed: dailySnapCount, snapsLimit: entitlement.snapsPerDay });
    const ai = getGeminiClient();
    if (!ai) {
      logFailure("missing_api_key");
      return res.status(503).json({ success: false, message: "Image analysis is not configured right now. You can enter product details manually." });
    }

    // Count attempted Gemini calls too, so provider errors cannot be used to bypass the daily quota.
    await SnapUsage.create({ workspaceOwner: req.workspaceOwnerId, user: req.user._id });

    let geminiResponse;
    try {
      let timeoutId;
      try {
        geminiResponse = await Promise.race([
          ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
            contents: [
              'You catalogue retail products from photos. Read only details visible on the package. Never guess a brand, size, expiry date, or price; use null when absent or unclear. Return the requested structured JSON.',
              { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
            ],
            config: { responseMimeType: 'application/json', responseJsonSchema: productImageResponseSchema, temperature: 0.1 },
          }),
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(Object.assign(new Error('Gemini request timed out'), { name: 'TimeoutError' })), 20_000);
            timeoutId.unref?.();
          }),
        ]);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logFailure("gemini_timeout");
        return res.status(504).json({ success: false, message: "Image analysis took too long. Please try again or enter product details manually." });
      }
      logFailure("gemini_unavailable", { error: error.name, status: error.status || error.statusCode });
      return res.status(502).json({ success: false, message: "Image analysis is temporarily unavailable. Please try again or enter product details manually." });
    }

    const generatedText = geminiResponse.text?.trim();
    let parsed;
    try {
      if (!generatedText) throw new Error("Empty model response");
      parsed = productImageResultSchema.parse(JSON.parse(generatedText));
    } catch (error) {
      logFailure("invalid_model_output", { error: error.name });
      return res.status(502).json({ success: false, message: "Image analysis could not identify valid product details. Please enter them manually." });
    }

    const categories = await Category.find({ createdBy: req.workspaceOwnerId })
      .select("_id name")
      .lean();
    const normalizedCategory = parsed.category.toLocaleLowerCase();
    const matchedCategory = normalizedCategory
      ? categories.find((category) => category.name.trim().toLocaleLowerCase() === normalizedCategory)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        ...parsed,
        name: parsed.productName,
        brand: parsed.brand || '',
        category: matchedCategory?.name || parsed.category,
        categoryId: matchedCategory?._id?.toString() || null,
      },
    });
  } catch (error) {
    logFailure("request_failed", { error: error.name });
    return res.status(500).json({ success: false, message: "Could not analyze this image. Please enter product details manually." });
  }
};

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
    if (req.user?.role !== "manager") {
      return res.status(403).json({ message: "Only managers can add products" });
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
    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ message: "Category ID is invalid" });
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
    const parsedQuantity = Number(quantity);
    const parsedReOrderLevel = Number(reOrderLevel);
    if (!Number.isFinite(parsedQuantity) || !Number.isFinite(parsedReOrderLevel)) {
      return res.status(400).json({ message: "Quantity and reorder level must be valid numbers" });
    }

    if (!isValidMoney(parsedCostPrice) || !isValidMoney(parsedSellingPrice) || parsedCostPrice < 0 || parsedSellingPrice < 0) {
      return res.status(400).json({ message: "Cost and selling prices must be finite amounts greater than or equal to 0" });
    }
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity must be a whole number greater than or equal to 0" });
    }
    if (!Number.isSafeInteger(parsedReOrderLevel) || parsedReOrderLevel < 0) {
      return res.status(400).json({ message: "Reorder level must be a whole number greater than or equal to 0" });
    }

    const normalizedCostPrice = roundMoney(parsedCostPrice);
    const normalizedSellingPrice = roundMoney(parsedSellingPrice);

    if (normalizedSellingPrice <= normalizedCostPrice) {
      return res.status(400).json({
        message: "Selling price should be greater than cost price. Take another look!",
      });
    }

    const product = new Products({
      name: normalizedName,
      sku: normalizedSku,
      supplier: supplier?.trim() || "Unknown",
      category,
      costPrice: normalizedCostPrice,
      sellingPrice: normalizedSellingPrice,
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

    void (async () => {
      await notifyProductAdded(workspaceUser, savedProduct);
      const stockStatus = getStockStatus(savedProduct.quantity, savedProduct.reOrderLevel);
      if (stockStatus === "Low Stock") await notifyLowStock(workspaceUser, savedProduct);
      else if (stockStatus === "Out of Stock") await notifyOutOfStock(workspaceUser, savedProduct);
    })().catch((error) => console.error("Product notification failed:", error.message));
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

export const deleteProduct = async (req, res) => {
  try {
    if (req.user?.role !== "manager") {
      return res.status(403).json({ message: "Only managers can delete products" });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const workspaceOwnerId = req.workspaceOwnerId;
    const product = await Products.findOne({ _id: id, createdBy: workspaceOwnerId })
      .select("_id name")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const [hasSales, hasPurchases] = await Promise.all([
      Sales.exists({ product: id, createdBy: workspaceOwnerId }),
      Purchase.exists({ product: id, createdBy: workspaceOwnerId }),
    ]);

    if (hasSales || hasPurchases) {
      return res.status(400).json({
        success: false,
        message: "Product has stock history and cannot be deleted",
      });
    }

    await Products.deleteOne({ _id: id, createdBy: workspaceOwnerId });

    return res.json({
      success: true,
      message: "Product deleted successfully",
      deletedProductId: id,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
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
      filter.$expr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reOrderLevel"] }] };
    } else if (stock === "in-stock") {
      filter.$expr = { $gt: ["$quantity", "$reOrderLevel"] };
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
