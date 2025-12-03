import Products from "../models/productModel.js";
import Sales from "../models/salesModel.js";

export const createSale = async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, date, customer } = req.body;
    const userId = req.user._id;

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

    const productExists = await Products.findOne({ _id: productId, createdBy: userId });
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
      createdBy: userId,
    });

    productExists.quantity -= parsedQuantity;
    await productExists.save();

    res.status(201).json({
      message: "Sale added successfully",
      sale: newSale,
      product: productExists,
      success: true,
    });
  } catch (error) {
    console.error("Error adding sale:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const userId = req.user._id;
    const sales = await Sales.find({ createdBy: userId })
      .populate("product", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      totalSales: sales.length,
      sales,
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