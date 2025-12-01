import { createCategory,
   updateCategory, 
   deleteCategory } from "../controllers/categoryController.js";
   import { Protect } from "../middlewares/Authentication.js";
   import express from "express";

   const router = express.Router();

   router.post("/", Protect , createCategory);
   router.patch("/:id",  Protect , updateCategory);
   router.delete("/:id",Protect, deleteCategory);

    export default router;