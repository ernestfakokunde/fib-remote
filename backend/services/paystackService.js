const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const paystackRequest = async (path, options = {}, { retries = 2 } = {}) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('Paystack is not configured. Set PAYSTACK_SECRET_KEY.');
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
        ...options,
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      let payload;
      try { payload = await response.json(); } catch { payload = {}; }
      if (response.ok && payload.status) return payload.data;
      const error = new Error(payload.message || 'Paystack request failed.');
      error.status = response.status;
      if (response.status < 500 && response.status !== 429) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (error.status && error.status < 500 && error.status !== 429) throw error;
    }
    if (attempt < retries) await sleep(250 * (2 ** attempt) + Math.floor(Math.random() * 100));
  }
  throw lastError || new Error('Paystack request failed.');
};

export const initializePaystackTransaction = (body) => paystackRequest('/transaction/initialize', {
  method: 'POST',
  body: JSON.stringify(body),
}, { retries: 0 });

export const verifyPaystackTransaction = (reference) => paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);

export const chargePaystackAuthorization = (body) => paystackRequest('/transaction/charge_authorization', {
  method: 'POST',
  body: JSON.stringify(body),
}, { retries: 0 });

export const validatePaystackSignature = async (rawBody, signature) => {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;
  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest();
  let actual;
  try { actual = Buffer.from(signature, 'hex'); } catch { return false; }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
