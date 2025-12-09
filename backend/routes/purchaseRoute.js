import express from 'express';
import {
  createPurchase, getAllPurchases  , getProductsDropdown
} from '../controllers/purchaseController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.post('/addPurchase', Protect,  createPurchase);
router.get('/getAllPurchases', Protect, getAllPurchases);
router.get('/getProductsDropdown', Protect, getProductsDropdown);


export default router;