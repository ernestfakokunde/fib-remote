import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/context';
import { Sun, Moon, Menu, Bell, X } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';
import useNotifications from '../hooks/useNotifications';
import SpectraLogo from '../assets/spectra.png';

const TopBar = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    permissions,
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
  } = useGlobalContext();
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const { notifications, loading, unreadCount, markAsRead } = useNotifications();

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };

  return (
    <header className='relative z-[35] mb-6 flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 sm:px-6 lg:px-8'>
      <div className='flex items-center gap-2 sm:gap-3'>
        <button
          onClick={toggleSidebar}
          className='lg:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className='hidden lg:flex items-center gap-3'>
          <div className='rounded-xl bg-[var(--primary-soft)] p-2'><img src={SpectraLogo} alt='Spectra' className='h-7 w-7 object-contain' /></div>
          <div>
            <p className='text-sm font-semibold text-[var(--text)]'>Spectra Inventory</p>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        {permissions.canAccessSettings ? (
          <button
            onClick={() => navigate('/settings')}
            className='hidden sm:inline-flex text-sm text-[var(--muted)] hover:text-[var(--text)]'
          >
            Settings
          </button>
        ) : null}

        <button
          onClick={toggleTheme}
          className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]'
          title={`Switch to ${theme === 'white' ? 'blue' : 'white'} mode`}
        >
          {theme === 'white' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className='relative z-[121]'>
          <button
            onClick={() => setAreNotificationsOpen((prev) => !prev)}
            className='relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]'
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className='absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-semibold text-white'>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            isOpen={areNotificationsOpen}
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
          />
        </div>

        <div className='flex items-center gap-3'>
          <div className='hidden sm:flex flex-col items-end'>
            <span className='text-sm font-medium text-[var(--text)]'>
              {user?.username || user?.name || user?.fullName || 'User'}
            </span>
            <span className='text-xs text-[var(--muted)]'>{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className='text-xs sm:text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)]'
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
