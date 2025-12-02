import React from 'react'
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

const App = () => {
  return (
    <>
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}/>
     <Routes>
          <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
             <Route index element={<Dashboard/>}/>
             <Route path='/stock-in' element={<StockIn/>}/>
             <Route path='/stock-out' element={<StockOut/>}/>
             <Route path='/expenses' element={<Expenses/>}/>
             <Route path='/products' element={<Products/>}/>
             <Route path='/reports' element={<Reports/>}/>
             <Route path='/settings' element={<Settings/>}/>
          </Route>
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
         
     </Routes>
    </>
    
  )
}

export default App