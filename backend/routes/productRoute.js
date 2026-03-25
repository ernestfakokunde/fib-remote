import express from "express";
import {
  createProduct,
  getSingleProduct,
  getAllProducts,
} from "../controllers/productController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/", Protect, requireRoles("admin"), createProduct);
router.get("/", Protect, getAllProducts);
router.get("/:id", Protect, getSingleProduct);

export default router;
