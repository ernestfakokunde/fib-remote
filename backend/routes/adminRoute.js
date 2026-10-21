import express from 'express';
import { getAdminOverview } from '../controllers/adminController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();
router.get('/overview', Protect, getAdminOverview);
export default router;
