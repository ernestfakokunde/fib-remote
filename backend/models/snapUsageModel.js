import mongoose from 'mongoose';

const snapUsageSchema = new mongoose.Schema({
  workspaceOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
snapUsageSchema.index({ workspaceOwner: 1, createdAt: 1 });
export default mongoose.model('SnapUsage', snapUsageSchema);
