import express from 'express';
import { getAllSales, createSale } from '../controllers/salesController.js';
import { Protect } from '../middlewares/Authentication.js'

const router = express.Router();

router.post('/createSale', Protect, createSale);
router.get('/getAllSales', Protect, getAllSales);

export default router;