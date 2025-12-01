import Purchase from "../models/purchaseModel.js";
import Products from "../models/productModel.js";

export const createPurchase = async(req, res)=>{
  try {
    const { product, quantity, costPrice, supplier, date } = req.body;

    //validate user inputs 
    if(!product || !quantity || !costPrice || !supplier){
    return res.status(400).json({message: "All fields are required"});
    }
    //find product from the dataase

    const productExists = await Products.findById(product);
    if(!productExists){
      return res.status(404).json({message: "Product not found"});
    }
    //increaase quantity of the product in the database
    productExists.quantity += quantity;
    await productExists.save();

    //calculate total cost
    const totalCost = quantity * costPrice;

    //create a new purchase
    const newPurchase = new Purchase({
      product,
      quantity,
      totalCost,
      Date: date || new Date(),
      costPrice,
      supplier: supplier || "unknown",
      User: req.user._id,
    });

    const savedPurchase = await newPurchase.save();
    res.status(201).json({
      message:"Purchase added successfully",
      purchase: savedPurchase,
      product: productExists,
      success: true,
    })

  } catch (error) {
    console.error("Error adding purchase:", error);
    res.status(500).json({message: "Server Error"});
  }
}

export const getAllPurchases = async (req, res)=>{
  try {
    const purchases = await Purchase.find()
    .populate("product", "name category quantity sellingPrice")
    .sort({ date: -1});

    res.json({
      success: true,
      count: purchases.length,
      purchases,
    })
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({message: "Server Error"});
  }
}