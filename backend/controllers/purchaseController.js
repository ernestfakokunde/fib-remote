import Purchase from "../models/purchaseModel.js";
import Products from "../models/productModel.js";

export const createPurchase = async (req, res) => {
  try {
    const { productId, quantity, costPrice, supplier, date } = req.body;
    const userId = req.user._id;

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

    const productExists = await Products.findOne({ _id: productId, createdBy: userId });
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
      createdBy: userId,
    });

    const savedPurchase = await newPurchase.save();
    res.status(201).json({
      message: "Purchase added successfully",
      purchase: savedPurchase,
      product: productExists,
      success: true,
    });
  } catch (error) {
    console.error("Error adding purchase:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const userId = req.user._id;
    const purchases = await Purchase.find({ createdBy: userId })
      .populate("product", "name category quantity sellingPrice")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Server Error" });
  }
};