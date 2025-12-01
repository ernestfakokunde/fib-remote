import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}/>
     <Routes>
        <Route>
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
        </Route>
     </Routes>
    </>
    
  )
}

export default App