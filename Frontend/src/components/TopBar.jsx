import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/context';

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
  const { user, logout } = useGlobalContext();

  const path = location.pathname === '/' ? '/' : location.pathname;
  const title = titleMap[path] || 'Inventory Management System';

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 mb-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-400">Inventory Management System</div>
        <h1 className="text-lg font-semibold text-gray-900 mt-1">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900"
        >
          Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">
              {user?.name || user?.fullName || 'User'}
            </span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

