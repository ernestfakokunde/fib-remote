import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username:{ type: String, required: true, unique: true },
  email:{ type: String, required: true, unique: true },
  password:{ type: String, required: true, minlength: 8},
  isAdmin:{ type: Boolean, default: true },
  role: { type: String, enum: ['manager', 'admin', 'salesperson', 'superadmin'], default: 'manager' },
  ownerAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  subscriptionPlan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  subscriptionStatus: { type: String, enum: ['free', 'pending', 'active', 'past_due', 'cancelled'], default: 'free' },
  subscriptionStartedAt: { type: Date, default: null },
  subscriptionCurrentPeriodEnd: { type: Date, default: null },
  subscriptionIntroEndsAt: { type: Date, default: null },
  paystackCustomerCode: { type: String, default: null },
  paystackSubscriptionCode: { type: String, default: null },
  lastPaymentReference: { type: String, default: null },
  paystackAuthorizationCode: { type: String, default: null },
  paystackEmailToken: { type: String, default: null },
  pendingPayment: {
    reference: { type: String, default: null },
    plan: { type: String, enum: ['pro', 'enterprise', null], default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    introEndsAt: { type: Date, default: null },
    createdAt: { type: Date, default: null },
  },
  renewalClaim: {
    reference: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: null },
    state: { type: String, enum: ['idle', 'processing', 'uncertain', 'failed'], default: 'idle' },
  },
  isSuperAdmin: { type: Boolean, default: false },
},
{
  timestamps: true,
})
 const User = mongoose.model("User", userSchema);
 export default User;
