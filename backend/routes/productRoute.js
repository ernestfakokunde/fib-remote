import express from "express";
import {
  createProduct,
  getSingleProduct,
  getAllProducts,
  deleteProduct,
  analyzeProductImage,
} from "../controllers/productController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";
import { uploadProductImage } from "../middlewares/productImageUpload.js";
import { productImageRateLimit } from "../middlewares/productImageRateLimit.js";

const router = express.Router();

router.post("/", Protect, requireRoles("manager"), createProduct);
router.post(
  "/analyze-image",
  Protect,
  requireRoles("manager", "salesperson"),
  productImageRateLimit,
  uploadProductImage,
  analyzeProductImage
);
router.post(
  "/snap-to-add",
  Protect,
  requireRoles("manager", "salesperson"),
  productImageRateLimit,
  uploadProductImage,
  analyzeProductImage
);
router.get("/", Protect, getAllProducts);
router.get("/:id", Protect, getSingleProduct);
router.delete("/:id", Protect, requireRoles("manager"), deleteProduct);

export default router;
