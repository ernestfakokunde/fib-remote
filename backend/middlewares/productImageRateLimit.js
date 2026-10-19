const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const requestsByUser = new Map();
let checksSinceCleanup = 0;

export const productImageRateLimit = (req, res, next) => {
  const userId = String(req.user?._id || req.user?.id || "");
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication is required." });
  }

  const now = Date.now();
  checksSinceCleanup += 1;
  if (checksSinceCleanup >= 128) {
    for (const [id, entry] of requestsByUser) {
      if (entry.resetAt <= now) requestsByUser.delete(id);
    }
    checksSinceCleanup = 0;
  }
  const current = requestsByUser.get(userId);
  if (!current || current.resetAt <= now) {
    requestsByUser.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message: "Image analysis limit reached. Try again in a minute." });
  }

  current.count += 1;
  next();
};
