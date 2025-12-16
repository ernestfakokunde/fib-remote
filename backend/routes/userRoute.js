import express from "express";
import {
  Login,
  Register,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { Protect } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.get("/profile", Protect, getProfile);
router.put("/profile", Protect, updateProfile);
router.put("/change-password", Protect, changePassword);

export default router;