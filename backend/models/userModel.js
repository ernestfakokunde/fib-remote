import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username:{ type: String, required: true, unique: true },
  email:{ type: String, required: true, unique: true },
  password:{ type: String, required: true, minlength: 8},
  isAdmin:{ type: Boolean, default: true },
  role: { type: String, enum: ['manager', 'admin', 'salesperson'], default: 'manager' },
  ownerAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  subscriptionPlan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
},
{
  timestamps: true,
})
 const User = mongoose.model("User", userSchema);
 export default User;
