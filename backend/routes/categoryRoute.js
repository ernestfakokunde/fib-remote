import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "../controllers/categoryController.js";
import { Protect } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/", Protect, createCategory);
router.get("/", Protect, getCategories);
router.patch("/:id", Protect, updateCategory);
router.delete("/:id", Protect, deleteCategory);

export default router;