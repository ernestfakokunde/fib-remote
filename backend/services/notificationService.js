import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export const notifyProductAdded = async ( user, product)=>{
  await Notification.create({
    userId: user._id,
    type:"PRODUCT_ADDED",
    message: `🚀 Hello ${user.name}, ${product.name} has been added to your store!`
  });
};

export const notifyLowStock = async ( user, product) =>{
  await Notification.create({
    userId: user._id,
    type:"LOW_STOCK",
    message:`⚠️ Hi ${user.name}, your product ${product.name} is running low on stock. Only ${product.quantity} left! Consider restocking soon.`
  });
};

export const notifyOutOfStock = async ( user, product) =>{
  await Notification.create({
    userId: user._id,
    type:"OUT_OF_STOCK",
    message:`🚨 Attention ${user.name}, your product ${product.name} is now out of stock! Please restock to avoid losing sales.`
  });
}

export const notifyStockIn = async ( user, product, quantity) =>{
  await Notification.create({
    userId: user._id,
    type:"STOCK_IN",
    message:`📦 Good news ${user.name}! ${quantity} units of ${product.name} have been added to your inventory.`
  });
}
