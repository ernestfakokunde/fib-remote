import Sales from "../models/salesModel.js";
import Products from "../models/productModel.js";

export const generateSalesReport = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { start, end } = req.query;
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 1000 * 60 * 60 * 24 * 6); // default to last 7 days

    // normalize to full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // totals (revenue & cost)
    const totalsAgg = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalRevenue" }, totalCost: { $sum: "$totalCost" } } }
    ]);
    const totals = totalsAgg[0] || { totalRevenue: 0, totalCost: 0 };
    const totalRevenue = totals.totalRevenue || 0;
    const totalCost = totals.totalCost || 0;
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;

    // revenue & profit trend (grouped by day)
    const trend = await Sales.aggregate([
      { $match: { createdBy: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: "$profit" }
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
      { $project: { productId: "$_id", name: "$product.name", sku: "$product.sku", quantitySold: 1 } }
    ]);

    return res.json({
      success: true,
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      trend,
      bestSellingProducts,
      slowSellingProducts
    });
  } catch (error) {
    console.error('Generate sales report error:', error);
    res.status(500).json({ success: false, message: "Failed to load report data" });
  }
};