import express from 'express';
import { getSalesAnalytics } from '../controllers/analyticsController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.get('/analytics',Protect, getSalesAnalytics);
export default router;