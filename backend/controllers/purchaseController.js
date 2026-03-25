import Purchase from "../models/purchaseModel.js";
import Products from "../models/productModel.js";
import User from "../models/userModel.js";
import { notifyStockIn, notifyLowStock, notifyOutOfStock } from "../services/notificationService.js";

export const createPurchase = async (req, res) => {
  try {
    const { productId, quantity, costPrice, supplier, date } = req.body;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId || quantity === undefined || costPrice === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedQuantity = Number(quantity);
    const parsedCostPrice = Number(costPrice);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    if (Number.isNaN(parsedCostPrice) || parsedCostPrice <= 0) {
      return res.status(400).json({ message: "Cost price must be greater than 0" });
    }

    const productExists = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    productExists.quantity += parsedQuantity;
    await productExists.save();

    const totalCost = parsedQuantity * parsedCostPrice;

    const newPurchase = new Purchase({
      product: productId,
      quantity: parsedQuantity,
      totalCost,
      date: date ? new Date(date) : new Date(),
      costPrice: parsedCostPrice,
      supplier: supplier?.trim() || "Unknown",
      createdBy: workspaceOwnerId,
      recordedBy: req.user._id,
    });

    const savedPurchase = await newPurchase.save();
    res.status(201).json({
      message: "Purchase added successfully",
      purchase: savedPurchase,
      product: productExists,
      success: true,
    });

    const workspaceUser = await User.findById(workspaceOwnerId);
    if (workspaceUser) {
      if (productExists.quantity === 0) {
        await notifyOutOfStock(workspaceUser, productExists);
      } else if (productExists.quantity <= productExists.reOrderLevel) {
        await notifyLowStock(workspaceUser, productExists);
      }
      await notifyStockIn(workspaceUser, productExists, parsedQuantity);
    }
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
    if (start && end) {
      dateQuery = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
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
      totalValue: totalsRow.totalCost || 0,
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
