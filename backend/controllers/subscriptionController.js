import { randomUUID } from 'node:crypto';
import User from '../models/userModel.js';
import ProcessedPayment from '../models/processedPaymentModel.js';
import { getPlanEntitlements } from '../utils/accessScope.js';
import { initializePaystackTransaction, verifyPaystackTransaction, chargePaystackAuthorization } from '../services/paystackService.js';

const BILLING_DAYS = 60;
const RETRY_DELAYS_HOURS = [1, 24, 72];
const currency = () => process.env.PAYSTACK_CURRENCY || 'USD';
const planPrice = (plan, intro) => Math.round((intro ? getPlanEntitlements(plan).introPriceUsd : getPlanEntitlements(plan).regularPriceUsd) * 100);
const accessEndFrom = (date) => { const end = new Date(date); end.setUTCDate(end.getUTCDate() + BILLING_DAYS); return end; };

const activateSubscription = async (user, transaction, plan, paidAt) => {
  try {
    await ProcessedPayment.create({
      reference: transaction.reference,
      user: user._id,
      plan,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt,
      source: transaction.metadata?.renewal ? 'renewal' : 'checkout',
    });
  } catch (error) {
    if (error.code === 11000) return { user: (await User.findById(user._id)) || user, alreadyProcessed: true };
    throw error;
  }

  const paidThrough = user.subscriptionCurrentPeriodEnd && new Date(user.subscriptionCurrentPeriodEnd) > paidAt
    ? new Date(user.subscriptionCurrentPeriodEnd)
    : paidAt;
  const samePlan = user.subscriptionPlan === plan && user.subscriptionStartedAt;
  user.subscriptionPlan = plan;
  user.subscriptionStatus = 'active';
  user.subscriptionStartedAt = samePlan ? user.subscriptionStartedAt : paidAt;
  user.subscriptionIntroEndsAt = samePlan && user.subscriptionIntroEndsAt
    ? user.subscriptionIntroEndsAt
    : new Date(paidAt.getTime() + BILLING_DAYS * 24 * 60 * 60 * 1000);
  user.subscriptionCurrentPeriodEnd = accessEndFrom(paidThrough);
  user.lastPaymentReference = transaction.reference;
  user.paystackEmailToken = user.paystackEmailToken || user.email;
  if (user.pendingPayment?.reference === transaction.reference) user.pendingPayment = undefined;
  user.renewalClaim = undefined;
  await user.save();
  return { user, alreadyProcessed: false };
};

const verifyCheckout = async (reference, user) => {
  const transaction = await verifyPaystackTransaction(reference);
  const pending = user.pendingPayment;
  if (!pending?.reference || pending.reference !== reference) {
    const processed = await ProcessedPayment.findOne({ reference, user: user._id });
    if (processed) return { transaction, alreadyProcessed: true };
    throw Object.assign(new Error('Payment reference is not an open checkout for this account.'), { statusCode: 400 });
  }
  if (transaction.status !== 'success') {
    throw Object.assign(new Error('Payment is not yet confirmed as successful.'), { statusCode: 409 });
  }
  if (transaction.status !== 'success'
    || transaction.reference !== pending.reference
    || transaction.metadata?.userId !== user._id.toString()
    || transaction.metadata?.plan !== pending.plan
    || transaction.amount !== pending.amount
    || transaction.currency !== pending.currency) {
    throw Object.assign(new Error('Payment status, owner, plan, amount, or currency did not match checkout.'), { statusCode: 400 });
  }
  return { transaction, pending };
};

export const initializeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['pro', 'enterprise'].includes(plan)) return res.status(400).json({ message: 'Choose Pro or Enterprise.' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const pending = user.pendingPayment;
    const pendingIsFresh = pending?.reference && pending.createdAt && Date.now() - new Date(pending.createdAt).getTime() < 30 * 60 * 1000;
    if (pendingIsFresh) {
      if (pending.plan !== plan) return res.status(409).json({ message: 'Finish or wait for the existing checkout before starting another payment.' });
      const transaction = await initializePaystackTransaction({
        email: user.email,
        amount: pending.amount,
        currency: pending.currency,
        reference: pending.reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium?payment=complete`,
        metadata: { userId: user._id.toString(), plan: pending.plan, billingDays: BILLING_DAYS },
      });
      if (!transaction.authorization_url) throw new Error('Paystack did not return a checkout URL.');
      return res.json({ authorizationUrl: transaction.authorization_url, reference: pending.reference, amount: pending.amount / 100, currency: pending.currency });
    }

    if (pending?.reference) {
      const previous = await verifyPaystackTransaction(pending.reference).catch(() => null);
      if (previous?.status === 'success') return res.status(409).json({ message: 'A previous checkout appears paid. Confirm it before starting another payment.' });
      if (!previous) return res.status(503).json({ message: 'Could not confirm the status of your previous checkout. Please retry shortly.' });
      if (!['failed', 'abandoned'].includes(previous.status)) return res.status(409).json({ message: 'The previous payment is still pending. Please finish it or wait before starting another payment.' });
      if (!['failed', 'abandoned'].includes(previous.status)) return res.status(409).json({ message: 'The previous payment is still pending. Please finish it or wait before starting another payment.' });
      user.pendingPayment = undefined;
    }

    const intro = !user.subscriptionIntroEndsAt || new Date(user.subscriptionIntroEndsAt) > new Date();
    const amount = planPrice(plan, intro);
    const reference = `spectra_${user._id}_${randomUUID()}`;
    const pendingRecord = { reference, plan, amount, currency: currency(), introEndsAt: user.subscriptionIntroEndsAt || null, createdAt: new Date() };
    user.pendingPayment = pendingRecord;
    await user.save();
    const transaction = await initializePaystackTransaction({
      email: user.email,
      amount,
      currency: pendingRecord.currency,
      reference,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium?payment=complete`,
      metadata: { userId: user._id.toString(), plan, billingDays: BILLING_DAYS },
    });
    if (!transaction.authorization_url) throw new Error('Paystack did not return a checkout URL.');
    return res.json({ authorizationUrl: transaction.authorization_url, reference, amount: amount / 100, currency: pendingRecord.currency });
  } catch (error) {
    console.error('Paystack initialization failed:', error.message);
    return res.status(error.statusCode || 503).json({ message: error.message || 'Could not start payment.' });
  }
};

export const verifySubscription = async (req, res) => {
  try {
    const reference = typeof req.body.reference === 'string' ? req.body.reference.trim() : '';
    if (!reference) return res.status(400).json({ message: 'Payment reference is required.' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    let checkout;
    try {
      checkout = await verifyCheckout(reference, user);
    } catch (error) {
      if (error.statusCode) throw error;
      error.statusCode = 502;
      throw error;
    }
    const { transaction, alreadyProcessed } = checkout;
    if (alreadyProcessed) return res.json({ success: true, alreadyProcessed: true, user: { subscriptionPlan: user.subscriptionPlan, subscriptionStatus: user.subscriptionStatus, subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd } });
    const authorization = transaction.authorization || {};
    if (authorization.reusable && authorization.authorization_code) user.paystackAuthorizationCode = authorization.authorization_code;
    if (transaction.customer?.customer_code) user.paystackCustomerCode = transaction.customer.customer_code;
    const result = await activateSubscription(user, transaction, user.pendingPayment.plan, new Date(transaction.paid_at || Date.now()));
    return res.json({ success: true, alreadyProcessed: result.alreadyProcessed, user: { subscriptionPlan: result.user.subscriptionPlan, subscriptionStatus: result.user.subscriptionStatus, subscriptionCurrentPeriodEnd: result.user.subscriptionCurrentPeriodEnd } });
  } catch (error) {
    console.error('Paystack verification failed:', error.message);
    return res.status(error.statusCode || 502).json({ message: error.message || 'Could not verify payment. Please try again.' });
  }
};

export const paystackWebhook = async (req, res) => {
  try {
    if (req.body?.event !== 'charge.success') return res.sendStatus(200);
    const reference = req.body.data?.reference;
    if (typeof reference !== 'string' || !reference) return res.sendStatus(200);
    const transaction = await verifyPaystackTransaction(reference);
    const userId = transaction.metadata?.userId;
    const plan = transaction.metadata?.plan;
    if (!userId || !['pro', 'enterprise'].includes(plan)) return res.sendStatus(200);
    const user = await User.findById(userId);
    if (!user) return res.sendStatus(200);
    if (await ProcessedPayment.exists({ reference: transaction.reference })) return res.sendStatus(200);
    if (transaction.metadata?.renewal) {
      const expectedAmount = planPrice(plan, Boolean(transaction.metadata.introductory));
      if (transaction.status !== 'success' || transaction.amount !== expectedAmount || transaction.currency !== currency() || transaction.metadata?.userId !== user._id.toString()) return res.sendStatus(200);
      if (user.renewalClaim?.reference !== transaction.reference) return res.sendStatus(200);
      await activateSubscription(user, transaction, plan, new Date(transaction.paid_at || Date.now()));
      return res.sendStatus(200);
    }
    let pendingCheckout;
    try {
      pendingCheckout = await verifyCheckout(reference, user);
    } catch (error) {
      if (error.statusCode === 409) return res.sendStatus(200);
      throw error;
    }
    const { pending } = pendingCheckout;
    if (transaction.amount !== pending.amount || transaction.currency !== pending.currency) return res.sendStatus(200);
    const authorization = transaction.authorization || {};
    if (authorization.reusable && authorization.authorization_code) user.paystackAuthorizationCode = authorization.authorization_code;
    if (transaction.customer?.customer_code) user.paystackCustomerCode = transaction.customer.customer_code;
    await activateSubscription(user, transaction, pending.plan, new Date(transaction.paid_at || Date.now()));
    return res.sendStatus(200);
  } catch (error) {
    console.error('Paystack webhook failed:', error.message);
    return res.sendStatus(500);
  }
};

const claimDueRenewal = async (user, now) => {
  const prior = user.renewalClaim || {};
  if (prior.claimedAt && now - new Date(prior.claimedAt) < 15 * 60 * 1000) return null;
  const reference = prior.reference || `spectra_renewal_${user._id}_${randomUUID()}`;
  const claimed = await User.findOneAndUpdate(
    { _id: user._id, subscriptionStatus: { $in: ['active', 'past_due'] }, subscriptionCurrentPeriodEnd: { $lte: now }, $or: [{ 'renewalClaim.claimedAt': null }, { 'renewalClaim.claimedAt': { $lt: new Date(now.getTime() - 15 * 60 * 1000) } }, { 'renewalClaim.claimedAt': { $exists: false } }], 'renewalClaim.state': { $nin: ['uncertain', 'failed'] } },
    { $set: { 'renewalClaim.reference': reference, 'renewalClaim.claimedAt': now, 'renewalClaim.retryCount': prior.retryCount || 0, 'renewalClaim.state': 'processing' } },
    { new: true },
  );
  return claimed;
};

export const renewSubscriptions = async () => {
  const now = new Date();
    const dueUsers = await User.find({ subscriptionStatus: { $in: ['active', 'past_due'] }, subscriptionPlan: { $in: ['pro', 'enterprise'] }, subscriptionCurrentPeriodEnd: { $lte: now }, paystackAuthorizationCode: { $exists: true, $ne: null }, $or: [{ 'renewalClaim.nextAttemptAt': null }, { 'renewalClaim.nextAttemptAt': { $lte: now } }, { 'renewalClaim.nextAttemptAt': { $exists: false } }] }).limit(100);
  for (const candidate of dueUsers) {
    const user = await claimDueRenewal(candidate, now);
    if (!user) continue;
    const intro = user.subscriptionIntroEndsAt && new Date(user.subscriptionCurrentPeriodEnd) < new Date(user.subscriptionIntroEndsAt);
    const amount = planPrice(user.subscriptionPlan, intro);
    try {
      let charge;
      try {
        charge = await chargePaystackAuthorization({
          authorization_code: user.paystackAuthorizationCode,
          email: user.email,
          amount,
          currency: currency(),
          reference: user.renewalClaim.reference,
          metadata: { userId: user._id.toString(), plan: user.subscriptionPlan, renewal: true, introductory: Boolean(intro) },
        });
      } catch (error) {
        let recovered;
        try {
          recovered = await verifyPaystackTransaction(user.renewalClaim.reference);
        } catch {
          user.subscriptionStatus = 'past_due';
          user.renewalClaim.state = 'uncertain';
          await user.save();
          console.error('Renewal state is uncertain; automatic retry paused:', user._id.toString());
          continue;
        }
        if (recovered?.status === 'success') charge = recovered;
        else if (recovered?.status === 'failed' || recovered?.status === 'abandoned') throw error;
        else {
          user.subscriptionStatus = 'past_due';
          user.renewalClaim.state = 'uncertain';
          await user.save();
          continue;
        }
      }
      const verified = await verifyPaystackTransaction(charge.reference);
      if (!verified || verified.status !== 'success' || verified.reference !== user.renewalClaim.reference || verified.amount !== amount || verified.currency !== currency() || verified.metadata?.userId !== user._id.toString() || verified.metadata?.plan !== user.subscriptionPlan || verified.metadata?.renewal !== true) throw new Error('Renewal transaction did not pass verification.');
      await activateSubscription(user, verified, user.subscriptionPlan, new Date(verified.paid_at || Date.now()));
    } catch (error) {
      const retryCount = (user.renewalClaim.retryCount || 0) + 1;
      user.subscriptionStatus = 'past_due';
      user.renewalClaim.retryCount = retryCount;
      if (retryCount > RETRY_DELAYS_HOURS.length) {
        user.renewalClaim.nextAttemptAt = null;
        user.renewalClaim.state = 'failed';
      } else {
        user.renewalClaim.nextAttemptAt = new Date(Date.now() + RETRY_DELAYS_HOURS[retryCount - 1] * 60 * 60 * 1000);
        user.renewalClaim.state = 'idle';
        user.renewalClaim.reference = `spectra_renewal_${user._id}_${randomUUID()}`;
      }
      await user.save();
      console.error('Subscription renewal failed:', user._id.toString(), error.message);
    }
  }
};
