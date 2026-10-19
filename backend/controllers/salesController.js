import Products from "../models/productModel.js";
import Sales from "../models/salesModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { notifySaleMade } from "../services/notificationService.js";
import { isPositiveWholeQuantity, isValidMoney, roundMoney } from "../utils/money.js";
import { buildDateRange } from "../utils/dateRange.js";
import { resolveTimeZone } from "../utils/timezone.js";

const setDateRange = (filter, startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const { range, error } = buildDateRange(startDate, endDate);
  if (error) return error;
  filter.date = range;
  return null;
};

export const createSale = async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, date, customer } = req.body;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId || quantity === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Product ID is invalid" });
    }

    const parsedQuantity = Number(quantity);
    const parsedSellingPrice = Number(sellingPrice);

    if (!isPositiveWholeQuantity(parsedQuantity)) {
      return res.status(400).json({ message: "Quantity must be a positive whole number" });
    }

    if (!isValidMoney(parsedSellingPrice) || parsedSellingPrice <= 0) {
      return res.status(400).json({ message: "Selling price must be a finite amount greater than 0" });
    }
    const normalizedSellingPrice = roundMoney(parsedSellingPrice);
    if (normalizedSellingPrice <= 0) return res.status(400).json({ message: "Selling price must be at least 0.01" });

    const productExists = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId });
    if (!productExists) {
      return res.status(404).json({ message: "Product does not exist" });
    }

    const costPrice = roundMoney(productExists.costPrice);
    if (!isValidMoney(costPrice)) return res.status(400).json({ message: "Product cost price is invalid" });
    const totalRevenue = roundMoney(normalizedSellingPrice * parsedQuantity);
    const totalCost = roundMoney(costPrice * parsedQuantity);
    const profit = roundMoney(totalRevenue - totalCost);
    if (![totalRevenue, totalCost, profit].every(isValidMoney) || totalRevenue <= 0) {
      return res.status(400).json({ message: "Sale totals exceed the supported amount" });
    }

    const saleDate = date ? new Date(date) : new Date();
    if (!Number.isFinite(saleDate.getTime())) {
      return res.status(400).json({ message: "Sale date is invalid" });
    }

    // Reserve stock atomically so two simultaneous sales cannot sell the same units.
    const updatedProduct = await Products.findOneAndUpdate(
      { _id: productId, createdBy: workspaceOwnerId, quantity: { $gte: parsedQuantity } },
      { $inc: { quantity: -parsedQuantity } },
      { new: true }
    );
    if (!updatedProduct) {
      const latestProduct = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId }).select("quantity").lean();
      if (!latestProduct) return res.status(404).json({ message: "Product does not exist" });
      return res.status(400).json({ message: `Only ${latestProduct.quantity} items left in stock` });
    }

    let newSale;
    try {
      newSale = await Sales.create({
        product: productId,
        quantity: parsedQuantity,
        sellingPrice: normalizedSellingPrice,
        totalRevenue,
        totalCost,
        costPrice,
        profit,
        date: saleDate,
        customer: customer?.trim() || "Walk-in Customer",
        createdBy: workspaceOwnerId,
        recordedBy: req.user._id,
      });
    } catch (error) {
      await Products.updateOne({ _id: productId, createdBy: workspaceOwnerId }, { $inc: { quantity: parsedQuantity } });
      throw error;
    }

    res.status(201).json({
      message: "Sale added successfully",
      sale: newSale,
      product: updatedProduct,
      success: true,
    });

    void User.findById(workspaceOwnerId)
      .then((workspaceUser) => workspaceUser && notifySaleMade(workspaceUser, newSale, updatedProduct))
      .catch((error) => console.error("Sale notification failed:", error.message));
  } catch (error) {
    console.error("Error adding sale:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const { page = 1, limit = 100, startDate, endDate } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(1000, parseInt(limit, 10) || 100));
    const filter = { createdBy: userId };

    const rangeError = setDateRange(filter, startDate, endDate);
    if (rangeError) return res.status(400).json({ success: false, message: rangeError });

    const skip = (pageNumber - 1) * limitNumber;

    const [total, sales, totalsAgg] = await Promise.all([
      Sales.countDocuments(filter),
      Sales.find(filter)
        .populate('product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Sales.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalRevenue' },
            totalProfit: { $sum: { $subtract: ['$totalRevenue', '$totalCost'] } },
          },
        },
      ]),
    ]);

    const totalsRow = totalsAgg[0] || { totalRevenue: 0, totalProfit: 0 };

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      sales,
      totalRevenue: roundMoney(totalsRow.totalRevenue || 0),
      totalProfit: roundMoney(totalsRow.totalProfit || 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load sales data",
      error: error.message,
    });
  }
};

export const getSalesPerDay = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const { startDate, endDate, timeZone } = req.query;
    const timezone = resolveTimeZone(timeZone);
    let match = { createdBy: userId };

    const rangeError = setDateRange(match, startDate, endDate);
    if (rangeError) return res.status(400).json({ success: false, message: rangeError });

    const data = await Sales.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
          totalSales: { $sum: '$totalRevenue' },
          totalProfit: { $sum: { $subtract: ['$totalRevenue', '$totalCost'] } },
        }
      },
      {
        $project: {
          date: '$_id',
          totalSales: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: data.map((item) => ({
        ...item,
        totalSales: roundMoney(item.totalSales || 0),
        totalProfit: roundMoney(item.totalProfit || 0),
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales per day' });
  }
};
