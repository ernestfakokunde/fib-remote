import Products from "../models/productModel.js";
import Sales from "../models/salesModel.js";

export const createSale = async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, date, customer } = req.body;
    const userId = req.user._id;

    //validate products input
    if(!productId || !quantity || !sellingPrice || !date || !costPrice){
      return res.status(400).json({message:"All fields are required !!!"})
    }
    //check if selected productts exists

    const productExists = await Products.findOne({_id:productId})
    //check if the product exists
    if(!productExists){
      return res.status(404).json({message:"Product does not exists"})
    }

    //const stock availability
     if (quantity > productExists.quantity) {
      return res.status(400).json({
        message: `Only ${productExists.quantity} items left in stock`,
      });
    }

    
    //use the product cost price
    const costPrice = productExists.costPrice;;
    //calculations
    const totalRevenue = sellingPrice * quantity;
    const totalCost = costPrice * quantity;
    const profit = totalRevenue - totalCost;

    //create the new sale

    const newSale = await Sales.create({
      product: productId,
      quantity,
      sellingPrice,  
      totalRevenue,
      costPrice,
      profit,
      date: date || Date.now(),
      customer: customer || "Walk-in Customer",
      User: userId
    })

    //update product stock
    productExists.quantity -= quantity;
    await productExists.save();

    //send response
    res.status(201).json({
      message: "Sale added successfully",
      sale: newSale,
      product: productExists,
      success: true,
    })

  } catch (error) {
    console.error("Error adding sale:", error);
    res.status(500).json({message: "Server Error"});
  }
}

export const getAllSales = async (req, res) => {
  try {
    const userId = req.user._id;
    const sales = await Sales.find({User: userId}).populate("product", "name").sort({createdAt: -1});
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
}