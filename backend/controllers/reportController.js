import Sales from "../models/salesModel.js";
import Products from "../models/productModel.js";
import { roundMoney } from "../utils/money.js";
import { parseDateBoundary } from "../utils/dateRange.js";

export const generateSalesReport = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { start, end } = req.query;
    const now = new Date();
    const endDate = end ? parseDateBoundary(end, true) : now;
    const startDate = start ? parseDateBoundary(start) : endDate && new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() - 6));
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Report date range is invalid' });
    if (startDate > endDate) return res.status(400).json({ success: false, message: 'Start date must be on or before end date' });

    // totals (revenue & cost)
    const totalsAgg = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalRevenue" }, totalCost: { $sum: "$totalCost" } } }
    ]);
    const totals = totalsAgg[0] || { totalRevenue: 0, totalCost: 0 };
    const totalRevenue = roundMoney(totals.totalRevenue || 0);
    const totalCost = roundMoney(totals.totalCost || 0);
    const grossProfit = roundMoney(totalRevenue - totalCost);
    const profitMargin = totalRevenue ? roundMoney((grossProfit / totalRevenue) * 100) : 0;

    // revenue & profit trend (grouped by day)
    const trend = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: { $subtract: ["$totalRevenue", "$totalCost"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // best-selling products (by quantity)
    const bestSellingProducts = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$product", quantitySold: { $sum: "$quantity" }, revenue: { $sum: "$totalRevenue" } } },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $project: { productId: "$_id", name: "$product.name", sku: "$product.sku", quantitySold: 1, revenue: 1 } }
    ]);

    // slow-selling products (lowest sold). Note: only products that have sales will appear here;
    // to include zero-sales products we'd need a different pipeline joining products and left-joining sales.
    const slowSellingProducts = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$product", quantitySold: { $sum: "$quantity" } } },
      { $sort: { quantitySold: 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $project: { productId: "$_id", name: "$product.name", sku: "$product.sku", product: { quantity: "$product.quantity" }, quantitySold: 1 } }
    ]);

    return res.json({
      success: true,
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      trend: trend.map((item) => ({ ...item, revenue: roundMoney(item.revenue || 0), profit: roundMoney(item.profit || 0) })),
      bestSellingProducts: bestSellingProducts.map((item) => ({ ...item, revenue: roundMoney(item.revenue || 0) })),
      slowSellingProducts
    });
  } catch (error) {
    console.error('Generate sales report error:', error);
    res.status(500).json({ success: false, message: "Failed to load report data" });
  }
};
