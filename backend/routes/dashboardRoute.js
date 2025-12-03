import express from "express";
import {
  getSalesToday,
  getPurchasesToday,
  getTodayProfit,
  getLowStockCount,
  getTotalProducts,
} from "../controllers/dashboardController.js";
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.get("/sales/today",  Protect, getSalesToday);
router.get("/purchases/today",  Protect, getPurchasesToday);
router.get("/profit/today",  Protect, getTodayProfit);
router.get("/inventory/low-stock",  Protect, getLowStockCount);
router.get("/products/total",  Protect, getTotalProducts);

export default router;
