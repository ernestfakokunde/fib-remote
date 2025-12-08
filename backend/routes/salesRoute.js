import express from 'express';
import { getAllSales, createSale, getSalesPerDay } from '../controllers/salesController.js';
import { Protect } from '../middlewares/Authentication.js'

const router = express.Router();

router.post('/createSale', Protect, createSale);
router.get('/getAllSales', Protect, getAllSales);
router.get('/sales-per-day', Protect, getSalesPerDay);

export default router;