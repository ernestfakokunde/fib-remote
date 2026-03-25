import express from 'express';
import { generateSalesReport } from '../controllers/reportController.js';
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.get('/', Protect, requireRoles("admin"), generateSalesReport );

export default router;
