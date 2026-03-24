import React, { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaBell } from 'react-icons/fa';

const RecentActivities = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/notifications');
        if (data.success) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        // The interceptor will show a toast for other errors,
        // but for 404, we can show a specific message.
        if (error.response?.status === 404) {
          toast.error("Could not fetch recent activities. The endpoint was not found.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up polling to fetch notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'PRODUCT_ADDED': return '🚀';
      case 'LOW_STOCK': return '⚠️';
      case 'OUT_OF_STOCK': return '🚨';
      case 'STOCK_IN': return '📦';
      case 'SALE_MADE': return '💰';
      case 'EXPENSE_RECORDED': return '💸';
      default: return '🔔';
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg shadow-lg rounded-lg p-4 border border-gray-200/50">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
        <FaBell className="mr-2" /> Recent Activities
      </h2>
      <div className="max-h-80 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="text-gray-600">Loading activities...</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-600">No recent activities to show.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li key={notification._id} className="flex items-start p-2 rounded-lg hover:bg-white/20 transition-colors duration-200">
                <span className="text-xl mr-3">{getIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full self-center ml-2" title="Unread"></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
