import React from 'react'
import Sidebar from './components/Sidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className='flex'>
        <Sidebar/>
        {/**main content here */}
        <main className='flex-1 lg:ml-64 p-6 bg-gray-100 min-h-screen'>
          <Outlet />
        </main>
    </div>
  )
}

export default Layout