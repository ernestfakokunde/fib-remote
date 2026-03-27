import React from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from './Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StockIn from './pages/StockIn.jsx';
import StockOut from './pages/StockOut.jsx';
import Expenses from './pages/Expenses.jsx';
import ProtectedRoute from './protectedRoute/protectedRoute.jsx';
import Products from './pages/Products.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import Premium from './pages/Premium.jsx';
import StaffAccounts from './pages/StaffAccounts.jsx';

const App = () => {
  return (
    <>
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}/>
     <Routes>
          <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
             <Route index element={<Dashboard/>}/>
             <Route path='/stock-in' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><StockIn/></ProtectedRoute>}/>
             <Route path='/stock-out' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><StockOut/></ProtectedRoute>}/>
             <Route path='/expenses' element={<ProtectedRoute allowedRoles={['manager']}><Expenses/></ProtectedRoute>}/>
             <Route path='/products' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><Products/></ProtectedRoute>}/>
             <Route path='/reports' element={<ProtectedRoute allowedRoles={['manager']}><Reports/></ProtectedRoute>}/>
             <Route path='/profile' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><Profile/></ProtectedRoute>}/>
             <Route path='/premium' element={<ProtectedRoute allowedRoles={['manager','salesperson']}><Premium/></ProtectedRoute>}/>
             <Route path='/team' element={<ProtectedRoute allowedRoles={['manager']}><StaffAccounts/></ProtectedRoute>}/>
             <Route path='/settings' element={<ProtectedRoute allowedRoles={['manager']}><Settings/></ProtectedRoute>}/>
          </Route>
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
         
     </Routes>
    </>
    
  )
}

export default App
