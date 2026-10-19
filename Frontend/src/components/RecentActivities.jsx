import React from 'react';
import { Bell } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { formatNotificationTime, getNotificationIcon } from '../utils/notificationMeta';
import { Skeleton } from './ui';
import { Link } from 'react-router-dom';

const RecentActivities = () => {
  const { notifications, loading, markAsRead } = useNotifications();

  return (
    <div className="glass-panel rounded-[var(--radius-card)] border p-5 shadow-[var(--shadow)]">
      <h2 className="mb-4 flex items-center text-sm font-semibold text-[var(--text)]">
        <Bell className="mr-2" size={20} /> Recent Activities
      </h2>
      <div className="max-h-80 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="space-y-3">{[1,2,3].map((item)=><Skeleton key={item} className="h-12"/>)}</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center"><p className="text-sm font-medium">You’re all caught up</p><p className="mt-1 text-xs text-[var(--muted)]">New business activity will appear here.</p><Link to="/stock-out" className="mt-3 inline-block text-xs font-semibold text-[var(--primary)]">Record a sale</Link></div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification._id}
                className="glass-hover flex items-center rounded-2xl border border-transparent p-3 transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification._id);
                    }
                  }}
                  className="flex w-full items-center text-left"
                >
                  <div className="mr-3 rounded-xl bg-[var(--surface)] p-2">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text)]">{notification.message}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div
                      className="ml-2 h-2.5 w-2.5 self-center rounded-full bg-[var(--primary)]"
                      title="Unread"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
