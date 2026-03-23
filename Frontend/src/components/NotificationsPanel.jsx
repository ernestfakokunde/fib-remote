import React from 'react';
import { Bell, Package, AlertTriangle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    icon: <AlertTriangle className='text-yellow-400' />,
    title: 'Low Stock Alert',
    description: 'Product "Quantum Stabilizer" is running low.',
    time: '2 minutes ago',
  },
  {
    id: 2,
    icon: <Package className='text-green-400' />,
    title: 'New Sale',
    description: 'A new sale of $250.00 was recorded.',
    time: '1 hour ago',
  },
  {
    id: 3,
    icon: <AlertTriangle className='text-red-500' />,
    title: 'Urgent: Stock Out',
    description: 'Product "Photon Emitter" is now out of stock.',
    time: '3 hours ago',
  },
];

const NotificationsPanel = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className='absolute top-full right-0 mt-2 w-80 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg z-50'>
      <div className='p-4 border-b border-gray-700'>
        <h3 className='font-semibold text-white flex items-center gap-2'>
          <Bell size={18} />
          Notifications
        </h3>
      </div>
      <div className='p-2 max-h-80 overflow-y-auto'>
        {notifications.map((note) => (
          <div
            key={note.id}
            className='flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50'
          >
            <div className='mt-1'>{note.icon}</div>
            <div className='text-white'>
              <p className='font-semibold text-sm'>{note.title}</p>
              <p className='text-xs text-gray-400'>{note.description}</p>
              <p className='text-xs text-gray-500 mt-1'>{note.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className='p-2 border-t border-gray-700 text-center'>
        <button className='text-sm text-purple-400 hover:underline'>
          See all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
