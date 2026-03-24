// backend/routes/notificationRoute.js
import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notificationsController.js";
import { isAuthenticated } from "../middlewares/Authentication.js";

const router = express.Router();

router.get("/", isAuthenticated, getNotifications);
router.patch("/:id/read", isAuthenticated, markNotificationAsRead);

export default router;
