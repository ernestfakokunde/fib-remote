import express from 'express';
import { createProduct, getSingleProduct, getAllProducts,  } from '../controllers/productController.js';
import { Protect } from '../middlewares/Authentication.js';

const router = express.Router();

router.post("/", Protect, createProduct);
router.get("/", Protect, getAllProducts);
router.get("/:id", Protect, getSingleProduct);


export default router;