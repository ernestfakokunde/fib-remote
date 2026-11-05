import mongoose from "mongoose";
import Products from "../models/productModel.js";
import Location from "../models/locationModel.js";
import StockMovement from "../models/stockMovementModel.js";
import StockBalance from "../models/stockBalanceModel.js";

export async function getDefaultLocation(workspaceId) {
  let location = await Location.findOne({ createdBy: workspaceId, isDefault: true, active: true });
  if (!location) {
    location = await Location.findOneAndUpdate(
      { createdBy: workspaceId, name: "Main location" },
      { $setOnInsert: { createdBy: workspaceId, name: "Main location", isDefault: true, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Location.updateMany({ createdBy: workspaceId, _id: { $ne: location._id } }, { $set: { isDefault: false } });
  }
  return location;
}

export async function ensureLegacyBalance(product, workspaceId, actorId) {
  if (Number(product.quantity) <= 0 || await StockBalance.exists({ product: product._id, createdBy: workspaceId })) return;
  const location = await getDefaultLocation(workspaceId);
  try {
    await StockBalance.create({ product: product._id, location: location._id, variantId: null, quantity: product.quantity, createdBy: workspaceId });
  } catch (error) {
    if (error.code === 11000) return;
    throw error;
  }
  try {
    await StockMovement.create({ product: product._id, location: location._id, quantityDelta: product.quantity, type: "opening", reason: "Opening balance migrated from existing inventory", actor: actorId, createdBy: workspaceId });
  } catch (error) {
    await StockBalance.deleteOne({ product: product._id, location: location._id, variantId: null, createdBy: workspaceId });
    throw error;
  }
}

// Product.quantity remains the compatibility balance used by existing screens.
// Every mutation is recorded; if the append fails, the cached balance is restored.
export async function postMovement({ productId, workspaceId, actorId, delta, type, reason, locationId = null, referenceType = "", referenceId = null, transferId = null, variantId = null }) {
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Stock movement must be a non-zero finite quantity");
  const location = locationId
    ? await Location.findOne({ _id: locationId, createdBy: workspaceId, active: true })
    : await getDefaultLocation(workspaceId);
  if (!location) throw new Error("Location not found");
  const productBefore = await Products.findOne({ _id: productId, createdBy: workspaceId }).select("quantity").lean();
  if (!productBefore) throw new Error("Product not found");
  await ensureLegacyBalance({ _id: productId, quantity: productBefore.quantity }, workspaceId, actorId);
  const balanceFilter = { product: productId, createdBy: workspaceId, location: location._id, variantId };
  const balanceGuard = { ...balanceFilter };
  if (delta < 0) balanceGuard.quantity = { $gte: Math.abs(delta) };
  const balance = await StockBalance.findOneAndUpdate(balanceGuard, { $inc: { quantity: delta } }, { new: true, upsert: delta > 0, setDefaultsOnInsert: true });
  if (!balance) throw new Error("Insufficient stock at the selected location");
  const guard = { _id: productId, createdBy: workspaceId };
  if (delta < 0) guard.quantity = { $gte: Math.abs(delta) };
  else guard.quantity = { $lte: Number.MAX_SAFE_INTEGER - delta };
  const product = await Products.findOneAndUpdate(guard, { $inc: { quantity: delta } }, { new: true });
  if (!product) {
    await StockBalance.updateOne(balanceFilter, { $inc: { quantity: -delta } });
    const exists = await Products.exists({ _id: productId, createdBy: workspaceId });
    if (!exists) throw new Error("Product not found");
    const current = await Products.findById(productId).select("quantity").lean();
    if (delta < 0) throw new Error(`Only ${current?.quantity || 0} items left in stock`);
    throw new Error("Stock quantity exceeds the supported limit");
  }
  try {
    const movement = await StockMovement.create({ product: productId, variantId, location: location._id, quantityDelta: delta, type, reason, referenceType, referenceId, transferId, actor: actorId, createdBy: workspaceId });
    return { product, movement, location };
  } catch (error) {
    await Products.updateOne({ _id: productId, createdBy: workspaceId }, { $inc: { quantity: -delta } });
    await StockBalance.updateOne(balanceFilter, { $inc: { quantity: -delta } });
    throw error;
  }
}

export async function createTransfer({ productId, variantId = null, workspaceId, actorId, quantity, fromLocationId, toLocationId, reason }) {
  if (String(fromLocationId) === String(toLocationId)) throw new Error("Choose two different locations");
  const transferId = new mongoose.Types.ObjectId();
  const result = await postMovement({ productId, variantId, workspaceId, actorId, delta: -quantity, type: "transfer_out", reason, locationId: fromLocationId, transferId });
  let destinationBalanceUpdated = false;
  try {
    const incomingBalance = await StockBalance.findOneAndUpdate(
      { product: productId, createdBy: workspaceId, location: toLocationId, variantId },
      { $inc: { quantity } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    destinationBalanceUpdated = true;
    const incoming = await StockMovement.create({ product: productId, variantId, location: toLocationId, quantityDelta: quantity, type: "transfer_in", reason, transferId, actor: actorId, createdBy: workspaceId });
    await Products.updateOne({ _id: productId, createdBy: workspaceId }, { $inc: { quantity } });
    return { transferId, outgoing: result.movement, incoming };
  } catch (error) {
    if (destinationBalanceUpdated) await StockBalance.updateOne({ product: productId, createdBy: workspaceId, location: toLocationId, variantId }, { $inc: { quantity: -quantity } });
    await Products.updateOne({ _id: productId, createdBy: workspaceId }, { $inc: { quantity } });
    await StockBalance.updateOne({ product: productId, createdBy: workspaceId, location: fromLocationId, variantId }, { $inc: { quantity } });
    await StockMovement.create({ product: productId, variantId, location: result.location._id, quantityDelta: quantity, type: "adjustment", reason: "Compensation for incomplete location transfer", transferId, actor: actorId, createdBy: workspaceId });
    throw error;
  }
}
