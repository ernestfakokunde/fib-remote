import User from '../models/userModel.js';
import Sales from '../models/salesModel.js';

const requireSuperAdmin = (req, res) => {
  if (req.user?.role !== 'superadmin' || !req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Super admin access is required.' });
    return false;
  }
  return true;
};

export const getAdminOverview = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const [totalUsers, planCounts, newUsers, paidWorkspaces, revenue, monthlyUsers, monthlyPaid] = await Promise.all([
      User.countDocuments({ role: { $in: ['manager', 'admin'] } }),
      User.aggregate([{ $match: { role: { $in: ['manager', 'admin'] } } }, { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }]),
      User.countDocuments({ role: { $in: ['manager', 'admin'] }, createdAt: { $gte: sixMonthsAgo } }),
      User.countDocuments({ role: { $in: ['manager', 'admin'] }, subscriptionStatus: 'active', subscriptionPlan: { $in: ['pro', 'enterprise'] } }),
      User.aggregate([
        { $match: { role: { $in: ['manager', 'admin'] }, subscriptionPlan: { $in: ['pro', 'enterprise'] }, subscriptionStatus: 'active' } },
        { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: { $in: ['manager', 'admin'] }, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, users: { $sum: 1 } } }, { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: { $in: ['manager', 'admin'] }, subscriptionPlan: { $in: ['pro', 'enterprise'] }, subscriptionStatus: 'active', subscriptionStartedAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$subscriptionStartedAt' } }, subscriptions: { $sum: 1 } } }, { $sort: { _id: 1 } },
      ]),
    ]);
    const salesCount = await Sales.countDocuments({ date: { $gte: sixMonthsAgo } });
    const monthMap = new Map(monthlyUsers.map((item) => [item._id, item.users]));
    const paidMap = new Map(monthlyPaid.map((item) => [item._id, item.subscriptions]));
    const growth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      return { month: key, newUsers: monthMap.get(key) || 0, newSubscriptions: paidMap.get(key) || 0 };
    });
    const planMap = Object.fromEntries(planCounts.map(({ _id, count }) => [_id, count]));
    const estimatedMonthlyUsd = revenue.reduce((sum, item) => sum + item.count * (item._id === 'pro' ? 5 : 9) / 2, 0);
    res.json({
      totals: { workspaces: totalUsers, newWorkspacesLastSixMonths: newUsers, activePaidSubscriptions: paidWorkspaces, estimatedMonthlyRecurringUsd: Math.round(estimatedMonthlyUsd * 100) / 100, salesLastSixMonths: salesCount },
      plans: { free: planMap.free || 0, pro: planMap.pro || 0, enterprise: planMap.enterprise || 0 },
      growth,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ message: 'Could not load admin metrics.' });
  }
};
