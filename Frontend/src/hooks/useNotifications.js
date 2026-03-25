import { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { toast } from 'react-toastify';

const POLL_INTERVAL = 30000;

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const { data } = await API.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Could not fetch notifications. The endpoint was not found.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { data } = await API.patch(`/notifications/${notificationId}/read`);
      if (data.success) {
        setNotifications((current) =>
          current.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch {
      // Axios interceptor handles the toast
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
  };
};

export default useNotifications;
