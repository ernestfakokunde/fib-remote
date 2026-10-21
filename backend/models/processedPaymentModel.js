import mongoose from 'mongoose';

const processedPaymentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['pro', 'enterprise'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paidAt: { type: Date, required: true },
  source: { type: String, enum: ['checkout', 'renewal'], default: 'checkout' },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ProcessedPayment', processedPaymentSchema);
