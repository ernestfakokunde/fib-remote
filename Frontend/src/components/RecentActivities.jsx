import React, { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { toast } from 'react-toastify';

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
        // The interceptor will show the toast
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No recent activities.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification._id} className="border-b last:border-b-0 py-2">
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivities;
