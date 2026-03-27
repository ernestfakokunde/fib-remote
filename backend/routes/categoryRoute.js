import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "../controllers/categoryController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/", Protect, requireRoles("manager"), createCategory);
router.get("/", Protect, getCategories);
router.patch("/:id", Protect, requireRoles("manager"), updateCategory);
router.delete("/:id", Protect, requireRoles("manager"), deleteCategory);

export default router;
