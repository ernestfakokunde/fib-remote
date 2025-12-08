import express from 'express';
import { generateSalesReport } from '../controllers/reportController.js';
import { Protect } from "../middlewares/Authentication.js";

const router = express.Router();

router.get('/', Protect , generateSalesReport );

export default router;