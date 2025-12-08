import Sales from "../models/salesModel.js";
import Products from "../models/productModel.js";

export const generateSalesReport = async (req, res) => {
  try {
    const userTd = req.user._Id;
    const { start, end } = req.query;
      const startDate = startDate ? newDate(startDate) : newDate()
      const endDate = endDate ? newDate(endDate) : newDate();

      //normalize dates to cover entire days
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);

      //fetch all sales to in range
      const sales = await Sales.find({
        user:userTd,
        date:{
          $gte: startDate,
          $lte: endDate
        }
      });
          let totalRevenue = 0;
          let totalCost = 0;

            sales.forEach(sale=>{
              totalRevenue +=sale.totalAmount;
              totalCost += sale.costAmount;
            }) 
              
            const grossProfit = totalRevenue - totalCost;
            const profitMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
            
            //revenue & profit trends(daily)
            const trend = await Sales.aggregate([
              {$match:{user: userTd, date:{ $gte:startDate, $lte:endDate}}},

              {
                $group:{
                  _id:{
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                  },
                  revenue:{$sum: "$totalAmount"},
                  profit:{ $sum: {$subtract: ["$totalAmount", "$costAmount"] } }
                }
              },
              { sort: { _id: 1 } },
            ])

            //5 best-selling products
            const bestSellingProduts = await sales.aggregate([
              { $match: { user: userTd, date: { $gte: startDate, $lte: endDate } } },
                        { $unwind: "$items" },
                {
                  $group: {
                    _id: "$items.productId",
                    quantitySold: { $sum: "$items.quantity" }
                  }
                },
                { $sort: { quantitySold: -1 } },
                { $limit: 5 }
            ]);

             const slowSelling = await Sales.aggregate([
                  { $match: { User: userId, date: { $gte: startDate, $lte: endDate } } },
                  { $unwind: "$items" },
                  {
                    $group: {
                      _id: "$items.productId",
                      quantitySold: { $sum: "$items.quantity" }
                    }
                  },
                  { $sort: { quantitySold: 1 } },
                  { $limit: 5 }
                ]);

                return res.json({
                  success:true,
                  totalRevenue,
                  totalCost,
                  grossProfit,
                  profitMargin,
                  trend,
                  bestSellingProduts,
                  slowSelling
                })

                    
          } catch (error) {
            console.error(error);
            res.status(500).json({
              message:"Failed to load report data",
            })
          }
        }