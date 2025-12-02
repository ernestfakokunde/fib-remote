import Sales from "../models/salesModel.js";
import Purchase from "../models/purchaseModel.js";
import Product from "../models/productModel.js";

// Sales Today
export const getSalesToday = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sales = await Sales.find({
      User: userId,
      date: { $gte: startOfDay },
    });

    const totalSalesToday = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    console.log(totalSalesToday);

    res.json({ totalSalesToday });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sales today" });
  }
};

// Purchases Today
export const getPurchasesToday = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const purchases = await Purchase.find({
      User: userId,
      date: { $gte: startOfDay },
    });

    const totalPurchasesToday = purchases.reduce(
      (acc, p) => acc + p.totalCost,
      0
    );

    res.json({ totalPurchasesToday });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch purchases today" });
  }
};

// Profit Today
export const getTodayProfit = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sales = await Sales.find({
      User: userId,
      date: { $gte: startOfDay },
    });

    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      totalCost += sale.costPriceTotal;
    });

    const totalProfitToday = totalRevenue - totalCost;

    res.json({ totalProfitToday });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profit today" });
  }
};

// Low Stock Count
export const getLowStockCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const lowStockProducts = await Product.find({
      User: userId,
      stock: { $lt: 10 },
    });

    res.json({ lowStockCount: lowStockProducts.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock items" });
  }
};
