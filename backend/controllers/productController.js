import Products from "../models/productModel.js";
import Category from "../models/categoryModel.js";

export const createProduct = async (req, res)=>{
  try {
    const { name, category, costPrice, sellingPrice, status, description, quantity, reOrderLevel } = req.body;
    if( ! name || !category || !costPrice || !sellingPrice || !status || !description || !quantity || !reOrderlevel ){
      return res.status(400).json({message:"Bad request. All fields are required"});
    }
    //check if category exists
    const categoryexists = await Category.findById(category)
    if(!categoryexists){
      return res.status(400).json({message:"Category does not exist"});
    }
  
    //check if name already exists to avoid duplicates
    const nameexists = await Products.findOne({name})
    if(nameexists){
      return res.status(409).json({message:"Product name already exists"});
    }

    //selling price should be greater than cost price
    if( sellingPrice <= costPrice){
      return res.status(400).json({ message:"Selling price should be greater than cost price Take another look !!!"});
    }

    const product = new Products({
      name,
      category,
      costPrice,
      sellingPrice,
      status,
      description,
      quantity: quantity || 0,
      reOrderLevel: reOrderLevel || 10,
      createdBy: req.user._id,
    })

    const savedProduct = await product.save();
    res.status(201).json({
      message:"product created succesfully",
      product: savedProduct,
      sucess:true,
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error product creation failed try again" });
  }
} 

const getStockStatus = (quantity) => {
  if( quantity === 0){
    return "Out of Stock";
  }
  if( quantity <= 10){
    return "Low Stock";
  }
  return "In Stock";
}
  
export const getAllProducts = async (req, res)=>{
  try {
    const { search , category, stock, sort, page = 1, limit = 12 } = req.query;
    //search filter

    const filter = {}

    if(search){
      filter.name = { $regex: search, $options:"i"}
    }
    //category filter
    if(category){
      filter.category = category;
    }

     if (stock === "out-of-stock") {
      filter.quantity = 0;
    } else if (stock === "low-stock") {
      filter.quantity = { $gt: 0, $lte: 10 };
    } else if (stock === "in-stock") {
      filter.quantity = { $gt: 10 };
    }
    
    const skip = (page - 1) * limit;
    const sortQuery = sort || "-createdAt";

    const totalProducts = await Products.countDocuments(filter);

    const products = await Products.find(filter)
    .populate("category", "name")
    .sort(sortQuery)
    .skip(skip)
    .limit(Number(limit));

    const productsWithStatus = await Products.map((product)=>{
      const profit = product.sellingPrice - product.costPrice;
      let stockStatus = "in stock";
      if(product.quantity === 0){
        stockStatus = "Out of Stock";
      }
      else if(product.quantity <=10){
        stockStatus = "Low Stock";
      } ;

      return{
        ...product._doc,
        profit,
        stockStatus,
      }
    })

    res.json({
      success:true,
       total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      products: productsWithStatus,
    })

  } catch (error) {
     console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
}

export const getSingleProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate ID format (MongoDB ObjectId)
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Products.findById(productId)
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Calculate profit
    const profit = product.sellingPrice - product.costPrice;

    // Determine stock status
    let stockStatus = "in stock";
    if (product.quantity === 0) stockStatus = "out of stock";
    else if (product.quantity <= 10) stockStatus = "low stock";

    return res.status(200).json({
      success: true,
      product: {
        ...product._doc,
        stockStatus,
        profit,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error fetching product" });
  }
};