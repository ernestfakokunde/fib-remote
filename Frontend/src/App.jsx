import React from 'react'
import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from './Layout.jsx';
import ProtectedRoute from './protectedRoute/protectedRoute.jsx';
import { lazy, Suspense } from 'react';
import LoadingScreen from './components/LoadingScreen.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Sales = lazy(() => import('./pages/Sales.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const StockIn = lazy(() => import('./pages/StockIn.jsx'));
const StockOut = lazy(() => import('./pages/StockOut.jsx'));
const Expenses = lazy(() => import('./pages/Expenses.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Premium = lazy(() => import('./pages/Premium.jsx'));
const StaffAccounts = lazy(() => import('./pages/StaffAccounts.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen label="Opening your workspace" />}>
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}/>
     <Routes>
          <Route path='/' element={<Landing/>}/>
          <Route path='/welcome' element={<Navigate to='/' replace />} />
          <Route element={<ProtectedRoute allowedRoles={['manager','salesperson']} redirectTo='/admin'><Layout /></ProtectedRoute>}>
             <Route path='/dashboard' element={<Dashboard/>}/>
             <Route path='/sales' element={<Sales/>}/>
             <Route path='/stock-in' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><StockIn/></ProtectedRoute>}/>
             <Route path='/stock-out' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><StockOut/></ProtectedRoute>}/>
             <Route path='/expenses' element={<ProtectedRoute allowedRoles={['manager']}><Expenses/></ProtectedRoute>}/>
             <Route path='/products' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><Products/></ProtectedRoute>}/>
             <Route path='/reports' element={<ProtectedRoute allowedRoles={['manager']}><Reports/></ProtectedRoute>}/>
             <Route path='/profile' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><Profile/></ProtectedRoute>}/>
             <Route path='/premium' element={<ProtectedRoute allowedRoles={['manager']}><Premium/></ProtectedRoute>}/>
             <Route path='/team' element={<ProtectedRoute allowedRoles={['manager']}><StaffAccounts/></ProtectedRoute>}/>
             <Route path='/settings' element={<ProtectedRoute allowedRoles={['manager']}><Settings/></ProtectedRoute>}/>
          </Route>
          <Route path='/register' element={<Register />} />
          <Route path='/admin/login' element={<Navigate to='/login' replace />} />
          <Route path='/admin' element={<ProtectedRoute allowedRoles={['superadmin']} redirectTo='/' loginTo='/login'><AdminDashboard /></ProtectedRoute>} />
          <Route path='/login' element={<Login />} />
         
     </Routes>
    </Suspense>
    
  )
}

export default App
