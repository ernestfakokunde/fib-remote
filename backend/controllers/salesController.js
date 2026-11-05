import Products from "../models/productModel.js";
import Sales from "../models/salesModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import { notifySaleMade } from "../services/notificationService.js";
import { isPositiveWholeQuantity, isValidMoney, roundMoney } from "../utils/money.js";
import { buildDateRange } from "../utils/dateRange.js";
import { resolveTimeZone } from "../utils/timezone.js";
import { postMovement } from "../services/inventoryService.js";
import SalesReturn from "../models/salesReturnModel.js";

const setDateRange = (filter, startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const { range, error } = buildDateRange(startDate, endDate);
  if (error) return error;
  filter.date = range;
  return null;
};

export const createSale = async (req, res) => {
  try {
    const { productId, variantId, locationId, quantity, sellingPrice, date, customer } = req.body;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Product ID is invalid" });
    }

    const parsedQuantity = Number(quantity);
    if (!isPositiveWholeQuantity(parsedQuantity)) {
      return res.status(400).json({ message: "Quantity must be a positive whole number" });
    }

    const productExists = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId });
    if (!productExists) {
      return res.status(404).json({ message: "Product does not exist" });
    }

    const variant = variantId ? productExists.variants.id(variantId) : null;
    if (variantId && !variant) return res.status(404).json({ message: "Product variant does not exist" });
    const conversionToBase = variant ? Number(variant.conversionToBase || 1) : 1;
    const quantityBase = parsedQuantity * conversionToBase;
    if (!Number.isFinite(quantityBase) || quantityBase <= 0 || !Number.isFinite(quantityBase * 1e6)) return res.status(400).json({ message: "Converted quantity is outside the supported range" });
    const effectivePrice = sellingPrice ?? variant?.sellingPrice ?? (Number(productExists.sellingPrice) * conversionToBase);
    const parsedSellingPrice = Number(effectivePrice);
    if (!isValidMoney(parsedSellingPrice) || parsedSellingPrice <= 0) return res.status(400).json({ message: "Selling price must be a finite amount greater than 0" });
    const normalizedSellingPrice = roundMoney(parsedSellingPrice);
    if (normalizedSellingPrice <= 0) return res.status(400).json({ message: "Selling price must be at least 0.01" });
    const costPrice = roundMoney(variant?.costPrice ?? (Number(productExists.costPrice) * conversionToBase));
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
    let movementResult;
    try {
      movementResult = await postMovement({ productId, variantId: variant?._id || null, locationId: locationId || null, workspaceId: workspaceOwnerId, actorId: req.user._id, delta: -quantityBase, type: "sale", reason: "Stock issued for sale", referenceType: "sale" });
    } catch (error) {
      return res.status(error.message === "Product not found" ? 404 : 400).json({ message: error.message });
    }
    const updatedProduct = movementResult.product;

    let newSale;
    try {
      newSale = await Sales.create({
        product: productId,
        locationId: movementResult.location._id,
        variantId: variant?._id || null,
        variantName: variant?.name || "",
        quantityBase,
        conversionToBase,
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
      await Products.updateOne({ _id: productId, createdBy: workspaceOwnerId }, { $inc: { quantity: quantityBase } });
      await import("../models/stockBalanceModel.js").then(({ default: StockBalance }) => StockBalance.updateOne({ product: productId, createdBy: workspaceOwnerId, location: movementResult.location._id, variantId: variant?._id || null }, { $inc: { quantity: quantityBase } }));
      const { default: StockMovement } = await import("../models/stockMovementModel.js");
      await StockMovement.create({ product: productId, variantId: variant?._id || null, location: movementResult.location._id, quantityDelta: quantityBase, type: "adjustment", reason: "Compensation for failed sale record", actor: req.user._id, createdBy: workspaceOwnerId });
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
    const returnRows = await SalesReturn.aggregate([
      { $match: { createdBy: userId, sale: { $in: sales.map((sale) => sale._id) } } },
      { $group: { _id: "$sale", quantityReturned: { $sum: "$quantity" }, refundValue: { $sum: "$refundValue" }, costReversal: { $sum: "$costReversal" } } },
    ]);
    const returnMap = new Map(returnRows.map((row) => [String(row._id), row]));
    for (const sale of sales) {
      const returned = returnMap.get(String(sale._id));
      sale.quantityReturned = returned?.quantityReturned || 0;
      sale.netRevenue = roundMoney(Number(sale.totalRevenue || 0) - Number(returned?.refundValue || 0));
      sale.netProfit = roundMoney(Number(sale.profit || 0) - Number(returned?.refundValue || 0) + Number(returned?.costReversal || 0));
    }
    const returnedRows = await SalesReturn.aggregate([
      { $match: { createdBy: userId, ...(filter.date ? { createdAt: filter.date } : {}) } },
      { $lookup: { from: "sales", localField: "sale", foreignField: "_id", as: "sale" } },
      { $unwind: "$sale" },
      { $match: { "sale.createdBy": userId } },
      { $group: { _id: null, refundValue: { $sum: "$refundValue" }, costReversal: { $sum: "$costReversal" } } },
    ]);
    const returnedRevenue = Number(returnedRows[0]?.refundValue || 0);
    const returnedProfit = returnedRevenue - Number(returnedRows[0]?.costReversal || 0);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      sales,
      totalRevenue: roundMoney((totalsRow.totalRevenue || 0) - returnedRevenue),
      totalProfit: roundMoney((totalsRow.totalProfit || 0) - returnedProfit),
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
    const returnMatch = { createdBy: userId };
    if (match.date) returnMatch.createdAt = match.date;
    const returnsByDay = await SalesReturn.aggregate([
      { $match: returnMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } }, refund: { $sum: '$refundValue' }, cost: { $sum: '$costReversal' } } },
    ]);
    const returnDayMap = new Map(returnsByDay.map((item) => [item._id, item]));

    res.json({
      success: true,
      data: data.map((item) => {
        const returned = returnDayMap.get(item.date) || { refund: 0, cost: 0 };
        return { ...item, totalSales: roundMoney((item.totalSales || 0) - returned.refund), totalProfit: roundMoney((item.totalProfit || 0) - returned.refund + returned.cost) };
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales per day' });
  }
};

export const createSalesReturn = async (req, res) => {
  let reservedSaleId = null;
  let reservedQuantity = 0;
  let postedReturn = null;
  try {
    const { saleId, quantity, reason, disposition = "restock" } = req.body;
    const parsedQuantity = Number(quantity);
    if (!mongoose.isValidObjectId(saleId) || !isPositiveWholeQuantity(parsedQuantity) || !String(reason || "").trim() || !["restock", "damaged"].includes(disposition)) return res.status(400).json({ success: false, message: "Provide a valid sale, quantity, reason, and return disposition" });
    const sale = await Sales.findOne({ _id: saleId, createdBy: req.workspaceOwnerId });
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
    const reservedSale = await Sales.findOneAndUpdate({ _id: sale._id, createdBy: req.workspaceOwnerId, $expr: { $lte: [{ $add: [{ $ifNull: ["$quantityReturned", 0] }, parsedQuantity] }, "$quantity"] } }, { $inc: { quantityReturned: parsedQuantity } }, { new: true });
    if (!reservedSale) return res.status(400).json({ success: false, message: "Return quantity exceeds the remaining sold quantity" });
    reservedSaleId = sale._id;
    reservedQuantity = parsedQuantity;
    const product = await Products.findOne({ _id: sale.product, createdBy: req.workspaceOwnerId });
    if (!product) return res.status(404).json({ success: false, message: "Sale product no longer exists" });
    const refundValue = roundMoney(parsedQuantity * sale.sellingPrice);
    const costReversal = roundMoney(parsedQuantity * sale.costPrice);
    if (disposition === "restock") postedReturn = await postMovement({ productId: sale.product, variantId: sale.variantId || null, locationId: sale.locationId || null, workspaceId: req.workspaceOwnerId, actorId: req.user._id, delta: parsedQuantity * Number(sale.conversionToBase || 1), type: "return", reason: String(reason).trim(), referenceType: "sales_return", referenceId: sale._id });
    else await (await import("../models/stockMovementModel.js")).default.create({ product: sale.product, variantId: sale.variantId || null, location: sale.locationId || null, quantityDelta: 0, type: "return", reason: `${String(reason).trim()} (damaged; not restocked)`, referenceType: "sales_return", referenceId: sale._id, actor: req.user._id, createdBy: req.workspaceOwnerId });
    const salesReturn = await SalesReturn.create({ sale: sale._id, product: sale.product, quantity: parsedQuantity, refundValue, costReversal, reason: String(reason).trim(), disposition, createdBy: req.workspaceOwnerId, recordedBy: req.user._id });
    reservedSaleId = null;
    return res.status(201).json({ success: true, salesReturn, product: await Products.findById(product._id) });
  } catch (error) {
    if (postedReturn) {
      try { await postMovement({ productId: postedReturn.movement.product, variantId: postedReturn.movement.variantId, workspaceId: req.workspaceOwnerId, actorId: req.user._id, delta: -postedReturn.movement.quantityDelta, type: "adjustment", reason: "Compensation for failed return record", locationId: postedReturn.location._id, referenceType: "sales_return" }); }
      catch (compensationError) { console.error("Sales return compensation failed:", compensationError.message); }
    }
    if (reservedSaleId && reservedQuantity) await Sales.updateOne({ _id: reservedSaleId, createdBy: req.workspaceOwnerId }, { $inc: { quantityReturned: -reservedQuantity } });
    console.error("Record sales return failed:", error);
    return res.status(500).json({ success: false, message: "Could not record sales return" });
  }
};
