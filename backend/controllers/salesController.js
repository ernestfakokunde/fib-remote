import Products from "../models/productModel.js";
import Sales from "../models/salesModel.js";
import User from "../models/userModel.js";
import { notifySaleMade } from "../services/notificationService.js";

export const createSale = async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, date, customer } = req.body;
    const workspaceOwnerId = req.workspaceOwnerId;

    if (!productId || quantity === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedQuantity = Number(quantity);
    const parsedSellingPrice = Number(sellingPrice);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      return res.status(400).json({ message: "Selling price must be greater than 0" });
    }

    const productExists = await Products.findOne({ _id: productId, createdBy: workspaceOwnerId });
    if (!productExists) {
      return res.status(404).json({ message: "Product does not exist" });
    }

    if (parsedQuantity > productExists.quantity) {
      return res.status(400).json({
        message: `Only ${productExists.quantity} items left in stock`,
      });
    }

    const costPrice = productExists.costPrice;
    const totalRevenue = parsedSellingPrice * parsedQuantity;
    const totalCost = costPrice * parsedQuantity;
    const profit = totalRevenue - totalCost;

    const newSale = await Sales.create({
      product: productId,
      quantity: parsedQuantity,
      sellingPrice: parsedSellingPrice,
      totalRevenue,
      totalCost,
      costPrice,
      profit,
      date: date ? new Date(date) : Date.now(),
      customer: customer?.trim() || "Walk-in Customer",
      createdBy: workspaceOwnerId,
      recordedBy: req.user._id,
    });

    productExists.quantity -= parsedQuantity;
    await productExists.save();

    res.status(201).json({
      message: "Sale added successfully",
      sale: newSale,
      product: productExists,
      success: true,
    });

    const workspaceUser = await User.findById(workspaceOwnerId);
    if (workspaceUser) {
      await notifySaleMade(workspaceUser, newSale, productExists);
    }
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

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

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
            totalProfit: { $sum: '$profit' },
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
      totalRevenue: totalsRow.totalRevenue || 0,
      totalProfit: totalsRow.totalProfit || 0,
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
    const { startDate, endDate } = req.query;
    let match = { createdBy: userId };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) match.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const data = await Sales.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalSales: { $sum: '$totalRevenue' }
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

    res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales per day' });
  }
};
