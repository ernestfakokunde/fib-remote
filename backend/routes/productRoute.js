import express from "express";
import {
  createProduct,
  getSingleProduct,
  getAllProducts,
  deleteProduct,
} from "../controllers/productController.js";
import { Protect, requireRoles } from "../middlewares/Authentication.js";

const router = express.Router();

router.post("/", Protect, requireRoles("manager"), createProduct);
router.get("/", Protect, getAllProducts);
router.get("/:id", Protect, getSingleProduct);
router.delete("/:id", Protect, requireRoles("manager"), deleteProduct);

export default router;
