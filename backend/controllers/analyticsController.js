 import Sales from "../models/salesModel.js";

export const getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // DAILY SALES CHART (last 7 days)
    const last7Days = await Sales.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: "$profit" },
          salesCount: { $sum: "$quantity" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // TODAY STATS
    const todayStats = await Sales.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: today,
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: "$profit" },
          salesCount: { $sum: "$quantity" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      dailyChart: last7Days,
      todayStats: todayStats[0] || {
        revenue: 0,
        profit: 0,
        salesCount: 0
      }
    });

  } catch (error) {
    console.log("Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales analytics"
    });
  }
};

export const getMonthlyProfit = async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months, 10) || 6;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // Aggregate by year and month
    const agg = await Sales.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: "$profit" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Map aggregated results for quick lookup
    const map = new Map();
    agg.forEach((item) => {
      const year = item._id.year;
      const monthIndex = item._id.month - 1; // JS months 0-11
      map.set(`${year}-${monthIndex}`, {
        revenue: item.revenue || 0,
        profit: item.profit || 0
      });
    });

    // Build result array for the requested months window
    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = map.get(key) || { revenue: 0, profit: 0 };
      const label = d.toLocaleString('en-US', { month: 'short' });
      result.push({ month: label, year: d.getFullYear(), revenue: entry.revenue, profit: entry.profit });
    }

    return res.status(200).json({ success: true, months: result });
  } catch (error) {
    console.error('Monthly profit error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly profit' });
  }
};
