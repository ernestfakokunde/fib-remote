import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoute.js';
import categoryRoutes from './routes/categoryRoute.js';
import analyticsRoutes from './routes/analyticsRoute.js';
import salesRoutes from './routes/salesRoute.js';
import productRoutes from './routes/productRoute.js';
import purchaseRoutes from './routes/purchaseRoute.js';

//load environent variables
dotenv.config();

//connect to databse 
connectDB();

//initialize express app
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Error handling for middleware 
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error, Route not found",
  });
})

  //routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`Server is running on port ${PORT}`);
})
 