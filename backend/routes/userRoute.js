import express from "express";
import { Login, Register, getProfile } from "../controllers/userController.js";
import { Protect } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login" , Login);
router.get("/profile", Protect, getProfile);

export default router;