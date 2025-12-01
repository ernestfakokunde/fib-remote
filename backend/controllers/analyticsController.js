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
