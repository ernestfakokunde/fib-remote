import React from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className='min-h-screen bg-[var(--bg)]'>
      <Sidebar />
      <main
        className={`min-h-screen transition-all duration-300 lg:pl-64`}
      >
        <TopBar />
        <div className='page-shell pb-6 lg:pb-10'>
          <Outlet />
          
        </div>
      </main>
      
    </div>
  )
}

export default Layout
