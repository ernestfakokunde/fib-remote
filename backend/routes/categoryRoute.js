import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "../controllers/categoryController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/", Protect, requireRoles("admin"), createCategory);
router.get("/", Protect, getCategories);
router.patch("/:id", Protect, requireRoles("admin"), updateCategory);
router.delete("/:id", Protect, requireRoles("admin"), deleteCategory);

export default router;
