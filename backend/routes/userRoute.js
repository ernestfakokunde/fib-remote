import express from "express";
import {
  Login,
  Register,
  getProfile,
  updateProfile,
  changePassword,
  createSalesperson,
  getSalespeople,
} from "../controllers/userController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.get("/profile", Protect, getProfile);
router.put("/profile", Protect, updateProfile);
router.put("/change-password", Protect, changePassword);
router.post("/salespeople", Protect, requireRoles("admin"), createSalesperson);
router.get("/salespeople", Protect, requireRoles("admin"), getSalespeople);

export default router;
