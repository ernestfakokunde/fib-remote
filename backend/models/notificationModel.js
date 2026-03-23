import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:"true",
  },
  type:{
    type:String,
    enum: ["PRODUCT_ADDED", "LOW_STOCK", "OUT_OF_STOCK","STOCK_IN", "SALE_MADE", "EXPENSE_RECORDED"],
  },
  message: String,
  isRead:{
    type: Boolean,
    default: false,
  }
},
{
  timestamps: true,
})

export default mongoose.model("Notification", notificationSchema)