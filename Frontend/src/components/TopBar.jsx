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
    <header className='glass-panel relative z-[80] mb-4 flex w-full items-center justify-between border px-6 py-3 overflow-visible'>
      <div className='flex items-center gap-4'>
        <button
          onClick={toggleSidebar}
          className='lg:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className='hidden lg:flex items-center gap-3'>
          <div className='rounded-2xl bg-white/10 p-2 shadow-lg ring-1 ring-white/10'>
            <img src={SpectraLogo} alt='Spectra' className='h-10 w-10 object-contain' />
          </div>
          <div>
            <p className='text-lg font-semibold tracking-wide text-[var(--text)]'>Spectra</p>
            <p className='text-xs uppercase tracking-[0.32em] text-[var(--muted)]'>Inventory Hub</p>
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
          className='inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
          title={`Switch to ${theme === 'white' ? 'blue' : 'white'} mode`}
        >
          {theme === 'white' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className='relative z-[121]'>
          <button
            onClick={() => setAreNotificationsOpen((prev) => !prev)}
            className='relative inline-flex items-center justify-center rounded-full p-2 hover:bg-[var(--surface)]'
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
            className='text-xs sm:text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]'
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
