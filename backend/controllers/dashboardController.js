import Sales from "../models/salesModel.js";
import Purchase from "../models/purchaseModel.js";
import Product from "../models/productModel.js";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Sales Today
export const getSalesToday = async (req, res) => {
  try {
    const userId = req.user._id;
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
    const userId = req.user._id;

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
    const userId = req.user._id;

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
    const userId = req.user._id;

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
    const userId = req.user._id;

    const totalProducts = await Product.countDocuments({ createdBy: userId });

    res.json({ totalProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch total products" });
  }
};

