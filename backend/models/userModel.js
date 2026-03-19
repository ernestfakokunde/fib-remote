import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username:{ type: String, required: true, unique: true },
  email:{ type: String, required: true, unique: true },
  password:{ type: String, required: true, minlength: 8},
  isAdmin:{ type: Boolean, default: false },
  subscriptionPlan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  productCount: { type: Number, default: 0 },
},
{
  timestamps: true,
})
 const User = mongoose.model("User", userSchema);
 export default User;