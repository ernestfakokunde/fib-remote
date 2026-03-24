// backend/routes/notificationRoute.js
import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notificationsController.js";
import { Protect } from "../middlewares/Authentication.js";

const router = express.Router();

router.get("/", Protect, getNotifications);
router.patch("/:id/read", Protect, markNotificationAsRead);

export default router;
