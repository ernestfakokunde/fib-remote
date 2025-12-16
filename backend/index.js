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
import expenseRoutes from './routes/expenseRoute.js';
import dashboardRoutes from './routes/dashboardRoute.js'
import reportRoutes from './routes/reportRoute.js';

//load environent variables
dotenv.config();

//connect to databse 
connectDB();

//initialize express app
const app = express();

//middlewares
// Update your CORS configuration like this:
const allowedOrigins = [
  'http://localhost:5173', // Local development
  process.env.FRONTEND_URL, // Your production frontend
  // Remove the line below in production unless needed
  // 'https://yourfrontend.onrender.com' // If frontend also on Render
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // If using cookies/sessions
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Error handling for middleware 
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error, Route not found",
  });
})

// Add this before other routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

  //routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportRoutes)

app.get('/', (req, res) => {
   console.log("App is running")
  res.status(200).json({
    message: 'Backend API is running! 🚀',
    version: '1.0.0',
    endpoints: [
      '/api/users',
      '/api/categories',
      '/api/products',
      '/api/sales',
      '/api/purchases',
      '/api/expenses',
      '/api/dashboard',
      '/api/reports',
      '/api/analytics',
      '/health'
    ],
    documentation: 'Add your API docs link here',
    timestamp: new Date().toISOString()
  });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`Server is running on port ${PORT}`);
})
 