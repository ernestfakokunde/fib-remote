import express from 'express';
import {
  createPurchase, getAllPurchases  
} from '../controllers/purchaseController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.post('/addPurchase', Protect,  createPurchase);
router.get('/getAllPurchases', Protect, getAllPurchases);

export default router;