import mongoose from "mongoose";
import Products from "../models/productModel.js";
import Location from "../models/locationModel.js";
import Supplier from "../models/supplierModel.js";
import SupplierPayment from "../models/supplierPaymentModel.js";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import StockMovement from "../models/stockMovementModel.js";
import StockBalance from "../models/stockBalanceModel.js";
import Purchase from "../models/purchaseModel.js";
import { createTransfer, ensureLegacyBalance, getDefaultLocation, postMovement } from "../services/inventoryService.js";

const tenant = (req) => req.workspaceOwnerId;
const validId = (id) => mongoose.isValidObjectId(id);

export async function listLocations(req, res) {
  const location = await getDefaultLocation(tenant(req));
  const locations = await Location.find({ createdBy: tenant(req), active: true }).sort({ isDefault: -1, name: 1 }).lean();
  res.json({ success: true, defaultLocation: location._id, locations });
}

export async function createLocation(req, res) {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Location name is required" });
  try {
    if (req.body.isDefault) await Location.updateMany({ createdBy: tenant(req) }, { $set: { isDefault: false } });
    const location = await Location.create({ name, address: req.body.address || "", isDefault: Boolean(req.body.isDefault), createdBy: tenant(req) });
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? "Location already exists" : "Could not create location" });
  }
}

export async function listBalances(req, res) {
  const legacy = await Products.find({ createdBy: tenant(req), quantity: { $gt: 0 } }).select("_id quantity").lean();
  for (const product of legacy) await ensureLegacyBalance(product, tenant(req), req.user._id);
  const filter = { createdBy: tenant(req) };
  if (req.query.productId) filter.product = req.query.productId;
  const balances = await StockBalance.find(filter).populate("product", "name sku variants").populate("location", "name").sort({ updatedAt: -1 }).lean();
  res.json({ success: true, balances: balances.map((balance) => ({ ...balance, variant: balance.variantId ? balance.product?.variants?.find((item) => String(item._id) === String(balance.variantId)) || null : null })) });
}

export async function adjustStock(req, res) {
  const { productId, variantId, locationId, quantity, direction, reason, type = "adjustment" } = req.body;
  const amount = Number(quantity);
  if (!validId(productId) || !Number.isSafeInteger(amount) || amount <= 0 || !["increase", "decrease"].includes(direction) || !String(reason || "").trim()) return res.status(400).json({ success: false, message: "Provide a product, positive whole quantity, direction, and reason" });
  if (!["adjustment", "damage", "loss", "return"].includes(type)) return res.status(400).json({ success: false, message: "Invalid stock movement type" });
  if ((["damage", "loss"].includes(type) && direction !== "decrease") || (type === "return" && direction !== "increase")) return res.status(400).json({ success: false, message: "Damage and loss reduce stock; customer returns increase it" });
  try {
    const record = await Products.findOne({ _id: productId, createdBy: tenant(req) });
    const variant = variantId ? record?.variants.id(variantId) : null;
    if (variantId && !variant) return res.status(404).json({ success: false, message: "Product variant not found" });
    const delta = amount * Number(variant?.conversionToBase || 1) * (direction === "increase" ? 1 : -1);
    const { product, movement } = await postMovement({ productId, variantId: variant?._id || null, workspaceId: tenant(req), actorId: req.user._id, delta, type, reason: String(reason).trim(), locationId: locationId || null });
    res.status(201).json({ success: true, product, movement });
  } catch (error) { res.status(error.message === "Product not found" || error.message === "Location not found" ? 404 : 400).json({ success: false, message: error.message }); }
}

export async function transferStock(req, res) {
  const { productId, variantId, fromLocationId, toLocationId, quantity, reason } = req.body;
  const amount = Number(quantity);
  if (![productId, fromLocationId, toLocationId].every(validId) || !Number.isSafeInteger(amount) || amount < 1 || !String(reason || "").trim()) return res.status(400).json({ success: false, message: "Provide product, both locations, positive quantity, and reason" });
  try {
    const [from, to] = await Promise.all([Location.exists({ _id: fromLocationId, createdBy: tenant(req), active: true }), Location.exists({ _id: toLocationId, createdBy: tenant(req), active: true })]);
    if (!from || !to) return res.status(404).json({ success: false, message: "Location not found" });
    const product = await Products.findOne({ _id: productId, createdBy: tenant(req) }).select("variants");
    const variant = variantId ? product?.variants.id(variantId) : null;
    if (variantId && !variant) return res.status(404).json({ success: false, message: "Product variant not found" });
    const convertedQuantity = amount * Number(variant?.conversionToBase || 1);
    const result = await createTransfer({ productId, variantId: variant?._id || null, workspaceId: tenant(req), actorId: req.user._id, quantity: convertedQuantity, fromLocationId, toLocationId, reason: String(reason).trim() });
    res.status(201).json({ success: true, transfer: result });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
}

export async function listMovements(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const filter = { createdBy: tenant(req) };
  if (req.query.productId && validId(req.query.productId)) filter.product = req.query.productId;
  if (req.query.locationId && validId(req.query.locationId)) filter.location = req.query.locationId;
  const [movements, total] = await Promise.all([
    StockMovement.find(filter).populate("product", "name sku").populate("location", "name").populate("actor", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    StockMovement.countDocuments(filter),
  ]);
  res.json({ success: true, movements, total, page, pages: Math.ceil(total / limit) });
}

export async function listSuppliers(req, res) {
  const suppliers = await Supplier.find({ createdBy: tenant(req) }).sort({ name: 1 }).lean();
  const [received, paid] = await Promise.all([
    PurchaseOrder.aggregate([{ $match: { createdBy: tenant(req), status: { $in: ["partially_received", "received"] } } }, { $unwind: "$lines" }, { $group: { _id: "$supplier", total: { $sum: { $multiply: ["$lines.receivedQuantity", "$lines.unitCost"] } } } }]),
    SupplierPayment.aggregate([{ $match: { createdBy: tenant(req) } }, { $group: { _id: "$supplier", total: { $sum: "$amount" } } }]),
  ]);
  const receivedMap = new Map(received.map((x) => [String(x._id), x.total]));
  const paidMap = new Map(paid.map((x) => [String(x._id), x.total]));
  res.json({ success: true, suppliers: suppliers.map((supplier) => ({ ...supplier, balance: Number(supplier.openingBalance || 0) + (receivedMap.get(String(supplier._id)) || 0) - (paidMap.get(String(supplier._id)) || 0) })) });
}

export async function createSupplier(req, res) {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Supplier name is required" });
  const openingBalance = Number(req.body.openingBalance || 0);
  if (!Number.isFinite(openingBalance) || openingBalance < 0 || !Number.isSafeInteger(Math.round(openingBalance * 100))) return res.status(400).json({ success: false, message: "Opening balance must be a valid non-negative amount" });
  try { const supplier = await Supplier.create({ name, email: req.body.email || "", phone: req.body.phone || "", address: req.body.address || "", notes: req.body.notes || "", openingBalance: Math.round(openingBalance * 100) / 100, createdBy: tenant(req) }); res.status(201).json({ success: true, supplier }); }
  catch (error) { res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? "Supplier already exists" : "Could not create supplier" }); }
}

export async function recordSupplierPayment(req, res) {
  const { supplierId } = req.params, amount = Number(req.body.amount);
  if (!validId(supplierId) || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: "Enter a valid payment amount" });
  if (!await Supplier.exists({ _id: supplierId, createdBy: tenant(req) })) return res.status(404).json({ success: false, message: "Supplier not found" });
  const payment = await SupplierPayment.create({ supplier: supplierId, amount: Math.round(amount * 100) / 100, date: req.body.date || new Date(), reference: req.body.reference || "", notes: req.body.notes || "", createdBy: tenant(req), recordedBy: req.user._id });
  res.status(201).json({ success: true, payment });
}

export async function listPurchaseOrders(req, res) {
  const orders = await PurchaseOrder.find({ createdBy: tenant(req) }).populate("supplier", "name").populate("lines.product", "name sku").sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
}

export async function createPurchaseOrder(req, res) {
  const { supplierId, lines = [] } = req.body;
  if (!validId(supplierId) || !Array.isArray(lines) || !lines.length || lines.length > 200) return res.status(400).json({ success: false, message: "Choose a supplier and add at least one order line" });
  if (!await Supplier.exists({ _id: supplierId, createdBy: tenant(req) })) return res.status(404).json({ success: false, message: "Supplier not found" });
  const normalized = [];
  for (const line of lines) {
    const quantity = Number(line.orderedQuantity), unitCost = Number(line.unitCost);
    if (!validId(line.product) || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isFinite(unitCost) || unitCost < 0 || !await Products.exists({ _id: line.product, createdBy: tenant(req) })) return res.status(400).json({ success: false, message: "Each line needs a valid product, positive whole quantity, and non-negative cost" });
    const product = await Products.findOne({ _id: line.product, createdBy: tenant(req) }).select("variants");
    const variant = line.variantId ? product?.variants.id(line.variantId) : null;
    if (line.variantId && !variant) return res.status(400).json({ success: false, message: "Purchase order contains an invalid product variant" });
    normalized.push({ product: line.product, variantId: variant?._id || null, orderedQuantity: quantity, receivedQuantity: 0, unitCost: Math.round(unitCost * 100) / 100, conversionToBase: Number(variant?.conversionToBase || 1) });
  }
  const number = `PO-${Date.now().toString(36).toUpperCase()}`;
  const order = await PurchaseOrder.create({ number, supplier: supplierId, lines: normalized, notes: req.body.notes || "", expectedAt: req.body.expectedAt || null, status: "draft", createdBy: tenant(req), recordedBy: req.user._id });
  res.status(201).json({ success: true, order });
}

export async function updatePurchaseOrderStatus(req, res) {
  const allowed = ["approved", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Status must be approved or cancelled" });
  const order = await PurchaseOrder.findOne({ _id: req.params.id, createdBy: tenant(req) }).populate("supplier", "name");
  if (!order) return res.status(404).json({ success: false, message: "Purchase order not found" });
  if (order.status !== "draft" || (req.body.status === "cancelled" && order.status !== "draft")) return res.status(409).json({ success: false, message: "Only draft orders can be approved or cancelled" });
  order.status = req.body.status; await order.save();
  res.json({ success: true, order });
}

export async function receivePurchaseOrder(req, res) {
  const order = await PurchaseOrder.findOne({ _id: req.params.id, createdBy: tenant(req) }).populate("supplier", "name");
  if (!order) return res.status(404).json({ success: false, message: "Purchase order not found" });
  if (!["approved", "partially_received"].includes(order.status)) return res.status(409).json({ success: false, message: "Only approved orders can be received" });
  const receipts = req.body.lines;
  if (!Array.isArray(receipts) || !receipts.length) return res.status(400).json({ success: false, message: "Add quantities received for this delivery" });
  const claimed = [];
  const compensations = [];
  try {
    const receivedLineIds = new Set();
    for (const receipt of receipts) {
      const line = order.lines.id(receipt.lineId), quantity = Number(receipt.quantity);
      if (!line || !Number.isSafeInteger(quantity) || quantity < 1 || receivedLineIds.has(String(receipt.lineId))) throw new Error("Receipt needs a unique order line and positive whole quantity");
      receivedLineIds.add(String(receipt.lineId));
      const claim = await PurchaseOrder.findOneAndUpdate(
        { _id: order._id, createdBy: tenant(req), status: { $in: ["approved", "partially_received"] }, lines: { $elemMatch: { _id: line._id, receivedQuantity: { $lte: line.orderedQuantity - quantity } } } },
        { $inc: { "lines.$.receivedQuantity": quantity } }, { new: true }
      );
      if (!claim) throw new Error("Receipt quantity exceeds the remaining order quantity");
      claimed.push({ lineId: line._id, quantity });
      const movement = await postMovement({ productId: line.product, variantId: line.variantId || null, workspaceId: tenant(req), actorId: req.user._id, delta: quantity * Number(line.conversionToBase || 1), type: "purchase", reason: `Received against ${order.number}`, referenceType: "purchase_order", referenceId: order._id });
      const product = await Products.findById(line.product).select("name variants").lean();
      const variant = line.variantId ? product?.variants?.find((item) => String(item._id) === String(line.variantId)) : null;
      const purchaseRecord = await Purchase.create({ product: line.product, locationId: movement.location._id, variantId: line.variantId || null, variantName: variant?.name || "", conversionToBase: Number(line.conversionToBase || 1), quantity, costPrice: line.unitCost, totalCost: Math.round(quantity * line.unitCost * 100) / 100, supplier: order.supplier?.name || "Purchase order supplier", date: new Date(), createdBy: tenant(req), recordedBy: req.user._id });
      compensations.push({ productId: line.product, variantId: line.variantId || null, quantity: quantity * Number(line.conversionToBase || 1), locationId: movement.location._id, purchaseId: purchaseRecord._id });
    }
    const updatedOrder = await PurchaseOrder.findOne({ _id: order._id, createdBy: tenant(req) });
    const fullyReceived = updatedOrder.lines.every((line) => line.receivedQuantity === line.orderedQuantity);
    if (fullyReceived) await PurchaseOrder.updateOne({ _id: order._id, createdBy: tenant(req) }, { $set: { status: "received" } });
    else await PurchaseOrder.updateOne({ _id: order._id, createdBy: tenant(req), status: { $ne: "received" } }, { $set: { status: "partially_received" } });
    res.json({ success: true, order: await PurchaseOrder.findById(order._id).populate("supplier", "name").populate("lines.product", "name sku") });
  } catch (error) {
    for (const item of compensations.reverse()) {
      try { await postMovement({ productId: item.productId, variantId: item.variantId, workspaceId: tenant(req), actorId: req.user._id, delta: -item.quantity, type: "adjustment", reason: `Compensation for failed receipt ${order.number}`, locationId: item.locationId }); }
      catch (compensationError) { console.error("Purchase receipt compensation failed:", compensationError.message); }
      if (item.purchaseId) await Purchase.deleteOne({ _id: item.purchaseId, createdBy: tenant(req) });
    }
    for (const claim of claimed.reverse()) await PurchaseOrder.updateOne({ _id: order._id, createdBy: tenant(req), "lines._id": claim.lineId }, { $inc: { "lines.$.receivedQuantity": -claim.quantity } });
    res.status(400).json({ success: false, message: error.message });
  }
}
