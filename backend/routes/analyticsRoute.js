import express from 'express';
import { getSalesAnalytics, getMonthlyProfit } from '../controllers/analyticsController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.get('/analytics',Protect, getSalesAnalytics);
router.get('/analytics/monthly-profit', Protect, getMonthlyProfit);
export default router;