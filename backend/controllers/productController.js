import Products from "../models/productModel.js";
import Category from "../models/categoryModel.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      sku,
      supplier,
      costPrice,
      sellingPrice,
      description = "",
      quantity = 0,
      reOrderLevel = 10,
    } = req.body;

    if (!name || !category || !sku || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: "Bad request. Missing required fields" });
    }

    const userId = req.user._id;
    const categoryexists = await Category.findOne({ _id: category, createdBy: userId });
    if (!categoryexists) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    const normalizedName = name.trim();
    const normalizedSku = sku.trim().toUpperCase();

    const duplicateName = await Products.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
      createdBy: userId,
    });
    if (duplicateName) {
      return res.status(409).json({ message: "Product name already exists" });
    }

    const duplicateSku = await Products.findOne({ sku: normalizedSku, createdBy: userId });
    if (duplicateSku) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    const parsedCostPrice = Number(costPrice);
    const parsedSellingPrice = Number(sellingPrice);
    const parsedQuantity = Math.max(0, Number(quantity) || 0);
    const parsedReOrderLevel = Math.max(0, Number(reOrderLevel) || 10);

    if (Number.isNaN(parsedCostPrice) || Number.isNaN(parsedSellingPrice)) {
      return res.status(400).json({ message: "Cost price and selling price must be numbers" });
    }

    if (parsedSellingPrice <= parsedCostPrice) {
      return res.status(400).json({
        message: "Selling price should be greater than cost price. Take another look!",
      });
    }

    const product = new Products({
      name: normalizedName,
      sku: normalizedSku,
      supplier: supplier?.trim() || "Unknown",
      category,
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
      description: description?.trim() || "",
      quantity: parsedQuantity,
      reOrderLevel: parsedReOrderLevel,
      createdBy: userId,
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
      success: true,
    });
  } catch (error) {
    console.error(error);
    // Handle duplicate key error from MongoDB (e.g., stray unique index)
    if (error && error.code === 11000) {
      const dupKey = Object.keys(error.keyValue || {})[0];
      const dupVal = error.keyValue ? error.keyValue[dupKey] : undefined;
      return res.status(409).json({ message: `${dupKey || 'Field'} already exists`, details: { [dupKey]: dupVal } });
    }
    res.status(500).json({ message: "Server error product creation failed try again" });
  }
};

const getStockStatus = (quantity, reOrderLevel = 10) => {
  if (quantity === 0) {
    return "Out of Stock";
  }
  if (quantity <= reOrderLevel) {
    return "Low Stock";
  }
  return "In Stock";
};
export const getAllProducts = async (req, res) => {
  try {
    const { search, category, stock, sort, page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    const filter = { createdBy: userId };

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 12);

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (stock === "out-of-stock") {
      filter.quantity = 0;
    } else if (stock === "low-stock") {
      filter.quantity = { $gt: 0, $lte: 10 };
    } else if (stock === "in-stock") {
      filter.quantity = { $gt: 10 };
    }

    const skip = (pageNumber - 1) * limitNumber;
    const sortQuery = sort || "-createdAt";

    const totalProducts = await Products.countDocuments(filter);
    console.log(totalProducts);

    const products = await Products.find(filter)
      .populate("category", "name")
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const productsWithStatus = products.map((product) => {
      const profit = product.sellingPrice - product.costPrice;
      const stockStatus = getStockStatus(product.quantity, product.reOrderLevel);

      return {
        ...product,
        profit,
        stockStatus,
      };
    });

    res.json({
      success: true,
      total: totalProducts,
      pages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products: productsWithStatus,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};


export const getSingleProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    // Validate ID format (MongoDB ObjectId)
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Products.findOne({ _id: productId, createdBy: userId })
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Calculate profit
    const profit = product.sellingPrice - product.costPrice;

    // Determine stock status
    const stockStatus = getStockStatus(product.quantity, product.reOrderLevel);

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