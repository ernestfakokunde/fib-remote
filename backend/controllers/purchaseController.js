import Purchase from "../models/purchaseModel.js";
import Products from "../models/productModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { notifyStockIn, notifyLowStock, notifyOutOfStock } from "../services/notificationService.js";
import { isPositiveWholeQuantity, isValidMoney, roundMoney } from "../utils/money.js";
import { buildDateRange } from "../utils/dateRange.js";

export const createPurchase = async (req, res) => {
  try {
    const { productId, quantity, costPrice, supplier, date } = req.body;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId || quantity === undefined || costPrice === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Product ID is invalid" });
    }

    const parsedQuantity = Number(quantity);
    const parsedCostPrice = Number(costPrice);

    if (!isPositiveWholeQuantity(parsedQuantity)) {
      return res.status(400).json({ message: "Quantity must be a positive whole number" });
    }

    if (!isValidMoney(parsedCostPrice) || parsedCostPrice <= 0) {
      return res.status(400).json({ message: "Cost price must be a finite amount greater than 0" });
    }

    const normalizedCostPrice = roundMoney(parsedCostPrice);
    if (normalizedCostPrice <= 0) return res.status(400).json({ message: "Cost price must be at least 0.01" });
    const totalCost = roundMoney(parsedQuantity * normalizedCostPrice);
    if (!isValidMoney(totalCost) || totalCost <= 0) return res.status(400).json({ message: "Purchase total must be at least 0.01 and within the supported amount" });

    const productExists = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const purchaseDate = date ? new Date(date) : new Date();
    if (!Number.isFinite(purchaseDate.getTime())) {
      return res.status(400).json({ message: "Purchase date is invalid" });
    }

    const newPurchase = new Purchase({
      product: productId,
      quantity: parsedQuantity,
      totalCost,
      date: purchaseDate,
      costPrice: normalizedCostPrice,
      supplier: supplier?.trim() || "Unknown",
      createdBy: workspaceOwnerId,
      recordedBy: req.user._id,
    });

    const updatedProduct = await Products.findOneAndUpdate(
      { _id: productId, createdBy: workspaceOwnerId, quantity: { $lte: Number.MAX_SAFE_INTEGER - parsedQuantity } },
      { $inc: { quantity: parsedQuantity } },
      { new: true }
    );
    if (!updatedProduct) {
      const exists = await Products.exists({ _id: productId, createdBy: workspaceOwnerId });
      return exists
        ? res.status(400).json({ message: "Purchase would exceed the supported stock quantity" })
        : res.status(404).json({ message: "Product not found" });
    }

    let savedPurchase;
    try {
      savedPurchase = await newPurchase.save();
    } catch (error) {
      await Products.updateOne({ _id: productId, createdBy: workspaceOwnerId }, { $inc: { quantity: -parsedQuantity } });
      throw error;
    }
    res.status(201).json({
      message: "Purchase added successfully",
      purchase: savedPurchase,
      product: updatedProduct,
      success: true,
    });

    void User.findById(workspaceOwnerId)
      .then(async (workspaceUser) => {
        if (!workspaceUser || !updatedProduct) return;
        if (updatedProduct.quantity === 0) await notifyOutOfStock(workspaceUser, updatedProduct);
        else if (updatedProduct.quantity <= updatedProduct.reOrderLevel) await notifyLowStock(workspaceUser, updatedProduct);
        await notifyStockIn(workspaceUser, updatedProduct, parsedQuantity);
      })
      .catch((error) => console.error("Stock-in notification failed:", error.message));
  } catch (error) {
    console.error("Error adding purchase:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { filter, start, end } = req.query;
    let dateQuery = {};
    const now = new Date();

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateQuery = { $gte: startOfDay, $lte: now };
    }
    if (filter === "yesterday") {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(now.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date();
      endOfYesterday.setDate(now.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);
      dateQuery = { $gte: startOfYesterday, $lte: endOfYesterday };
    }
    if (filter === "last7days") {
      const last7days = new Date();
      last7days.setDate(now.getDate() - 7);
      dateQuery = { $gte: last7days };
    }
    if (start || end) {
      const { range, error } = buildDateRange(start, end);
      if (error) return res.status(400).json({ success: false, message: error });
      dateQuery = range;
    }

    const query = {
      createdBy: userId,
      ...(Object.keys(dateQuery).length && { date: dateQuery }),
    };

    const [purchases, total, totalsAgg] = await Promise.all([
      Purchase.find(query)
        .populate("product", "name category quantity sellingPrice")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(query),
      Purchase.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$totalCost" },
          },
        },
      ]),
    ]);

    const totalsRow = totalsAgg[0] || { totalCost: 0 };

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPurchases: total,
      purchases,
      totalValue: roundMoney(totalsRow.totalCost || 0),
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProductsDropdown = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const products = await Products.find({ createdBy: userId }).select("_id name quantity");
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server Error Failed to load products" });
  }
};
