import React from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useGlobalContext } from './context/context'

const Layout = () => {
  const { toggleSidebar, sidebarOpen } = useGlobalContext();
  return (
    <div className='min-h-screen bg-[var(--bg)]'>
      {/* Global hamburger: fixed and available on all pages */}
      <button
        onClick={() => toggleSidebar()}
        className='fixed top-4 left-4 z-60 p-2 bg-[var(--surface)] rounded-md shadow-md lg:hidden'
      >
        <Menu />
      </button>

      <Sidebar />

      {/* overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/30 lg:hidden'
          onClick={toggleSidebar}
        />
      )}

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <TopBar />
        <div className='px-6 pb-6'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout