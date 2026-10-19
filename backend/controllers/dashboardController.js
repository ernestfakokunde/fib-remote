import Sales from "../models/salesModel.js";
import Purchase from "../models/purchaseModel.js";
import Product from "../models/productModel.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const ownerId = req.workspaceOwnerId;
    const allowedRanges = [7, 30, 90];
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = allowedRanges.includes(requestedDays) ? requestedDays : 7;
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    const [dailySales, todayTotals, yesterdayTotals, inventory, lowStock, topProducts, recentSales] = await Promise.all([
      Sales.aggregate([
        { $match: { createdBy: ownerId, date: { $gte: startDate, $lte: now } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" } } },
        { $sort: { _id: 1 } },
      ]),
      Sales.aggregate([
        { $match: { createdBy: ownerId, date: { $gte: today, $lte: now } } },
        { $group: { _id: null, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Sales.aggregate([
        { $match: { createdBy: ownerId, date: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: { createdBy: ownerId } },
        { $group: { _id: null, value: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, count: { $sum: 1 } } },
      ]),
      Product.find({ createdBy: ownerId, $expr: { $lte: ["$quantity", "$reOrderLevel"] } })
        .select("name sku quantity reOrderLevel costPrice category")
        .populate("category", "name")
        .sort({ quantity: 1, name: 1 })
        .limit(6)
        .lean(),
      Sales.aggregate([
        { $match: { createdBy: ownerId, date: { $gte: startDate, $lte: now } } },
        { $group: { _id: "$product", unitsSold: { $sum: "$quantity" }, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" } } },
        { $sort: { unitsSold: -1 } }, { $limit: 5 },
        { $lookup: { from: Product.collection.name, localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, name: { $ifNull: ["$product.name", "Deleted product"] }, sku: "$product.sku", unitsSold: 1, revenue: 1, profit: 1 } },
      ]),
      Sales.find({ createdBy: ownerId }).select("product quantity totalRevenue profit date customer")
        .populate("product", "name sku").sort({ date: -1 }).limit(5).lean(),
    ]);

    const fillDays = Array.from({ length: days }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const entry = dailySales.find((item) => item._id === key);
      return { date: key, revenue: entry?.revenue || 0, profit: entry?.profit || 0 };
    });
    const todayData = todayTotals[0] || { revenue: 0, profit: 0, count: 0 };
    const yesterdayData = yesterdayTotals[0] || { revenue: 0, profit: 0, count: 0 };
    const delta = (current, previous) => yesterdayData.count && previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null;

    res.json({
      success: true,
      data: {
        rangeDays: days,
        kpis: {
          revenueToday: todayData.revenue,
          profitToday: todayData.profit,
          stockValue: inventory[0]?.value || 0,
          productCount: inventory[0]?.count || 0,
          lowStockCount: await Product.countDocuments({ createdBy: ownerId, $expr: { $lte: ["$quantity", "$reOrderLevel"] } }),
          revenueDelta: delta(todayData.revenue, yesterdayData.revenue),
          profitDelta: delta(todayData.profit, yesterdayData.profit),
        },
        chart: fillDays,
        lowStock,
        topProducts,
        recentSales,
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard overview" });
  }
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Sales Today
export const getSalesToday = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const sales = await Sales.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startOfToday() },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
    ]);

    const totalSalesToday = sales[0]?.totalRevenue || 0;
    res.json({ totalSalesToday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales today" });
  }
};

// Purchases Today
export const getPurchasesToday = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;

    const purchases = await Purchase.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startOfToday() },
        },
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$totalCost" },
        },
      },
    ]);

    const totalPurchasesToday = purchases[0]?.totalPurchases || 0;
    res.json({ totalPurchasesToday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch purchases today" });
  }
};

// Profit Today
export const getTodayProfit = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;

    const profit = await Sales.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startOfToday() },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalRevenue" },
          totalCost: { $sum: "$totalCost" },
        },
      },
    ]);

    const totalRevenue = profit[0]?.totalRevenue || 0;
    const totalCost = profit[0]?.totalCost || 0;
    const totalProfitToday = totalRevenue - totalCost;

    res.json({ totalProfitToday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profit today" });
  }
};

// Low Stock Count
export const getLowStockCount = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;

    const lowStockProducts = await Product.countDocuments({
      createdBy: userId,
      quantity: { $gt: 0, $lte: 10 },
    });

    res.json({ lowStockCount: lowStockProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch low stock items" });
  }
};

// Total Products
export const getTotalProducts = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;

    const totalProducts = await Product.countDocuments({ createdBy: userId });

    res.json({ totalProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch total products" });
  }
};
