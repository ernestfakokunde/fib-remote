import React from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useGlobalContext } from './context/context'

const Layout = () => {
  const { toggleSidebar, sidebarOpen } = useGlobalContext();
  return (
    <div className='flex'>
        {/* Global hamburger: fixed and available on all pages */}
        <button onClick={() => toggleSidebar()} className='fixed top-4 left-4 z-60 p-2 bg-white rounded-md shadow-md'>
          <Menu />
        </button>
        <Sidebar/>
        {/**main content here */}
        <main className={`flex-1 bg-gray-100 min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <TopBar />
          <div className="px-6 pb-6">
            <Outlet />
          </div>
        </main>
    </div>
  )
}

export default Layout