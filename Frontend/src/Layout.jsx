import React from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useGlobalContext } from './context/context'
import Footer from './components/Footer'

const Layout = () => {
  const { toggleSidebar, sidebarOpen } = useGlobalContext();
  return (
    <div className='min-h-screen bg-[var(--bg)]' style={{ backgroundImage: 'var(--gradient)' }}>
      <Sidebar />
      <main
        className={`min-h-screen transition-all duration-300 lg:pl-64`}
      >
        <TopBar />
        <div className='page-shell pb-6'>
          <Outlet />
          
        </div>
        <Footer/>
      </main>
      
    </div>
  )
}

export default Layout
