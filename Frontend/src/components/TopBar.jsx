import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/context';
import { Sun, Moon, Menu, Bell, Command, X } from 'lucide-react';
import CommandPalette from './CommandPalette';
import NotificationsPanel from './NotificationsPanel';

const titleMap = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/stock-in': 'Stock In',
  '/stock-out': 'Stock Out',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    isPaletteOpen,
    openPalette,
    closePalette,
  } = useGlobalContext();
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);

  const path = location.pathname === '/' ? '/' : location.pathname;
  const title = titleMap[path] || 'Inventory Management System';

  const handleLogout = () => {
    logout();
  };

  return (
    <header className='w-full bg-[var(--topbar)] border-b border-[var(--border)] flex items-center justify-between px-6 py-3 mb-4'>
      <div className='flex items-center gap-4'>
        <button
          onClick={toggleSidebar}
          className='lg:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className='hidden lg:block text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text'>
          Spectra-inventory
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <button
          onClick={openPalette}
          className='hidden sm:inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]'
        >
          <Command size={16} />
          <span>AI Command</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className='hidden sm:inline-flex text-sm text-[var(--muted)] hover:text-[var(--text)]'
        >
          Settings
        </button>

        <button
          onClick={toggleTheme}
          className='inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
          title={`Switch to ${theme === 'white' ? 'blue' : 'white'} mode`}
        >
          {theme === 'white' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className='relative'>
          <button
            onClick={() => setAreNotificationsOpen((prev) => !prev)}
            className='inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
          >
            <Bell size={18} />
          </button>
          <NotificationsPanel isOpen={areNotificationsOpen} />
        </div>

        <div className='flex items-center gap-3'>
          <div className='hidden sm:flex flex-col items-end'>
            <span className='text-sm font-medium text-[var(--text)]'>
              {user?.name || user?.fullName || 'User'}
            </span>
            <span className='text-xs text-[var(--muted)]'>{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className='text-xs sm:text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]'
          >
            Sign out
          </button>
        </div>
      </div>
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={closePalette}
      />
    </header>
  );
};

export default TopBar;
