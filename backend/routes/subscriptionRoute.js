import express from 'express';
import { initializeSubscription, verifySubscription } from '../controllers/subscriptionController.js';
import { Protect, requireRoles } from '../middlewares/Authentication.js';

const router = express.Router();
router.post('/initialize', Protect, requireRoles('manager'), initializeSubscription);
router.post('/verify', Protect, requireRoles('manager'), verifySubscription);
export default router;
