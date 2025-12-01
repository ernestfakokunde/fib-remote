import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema(
  {
  product:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Products",
    required:true,
  },
  quantity:{
    type:Number,
    required:true,
  },
  costPrice:{
    type:Number,
    required:true,
  },
  supplier:{
    type: String,
    default:"Unknown",
  },
  date:{
    type:Date,
    dafault: Date.now,
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },
}, { timestamps:true})

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;