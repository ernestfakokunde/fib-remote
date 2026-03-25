import React from 'react';
import { Bell } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { formatNotificationTime, getNotificationIcon } from '../utils/notificationMeta';

const RecentActivities = () => {
  const { notifications, loading, markAsRead } = useNotifications();

  return (
    <div className="glass-panel rounded-3xl border p-5">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--text)]">
        <Bell className="mr-2" size={20} /> Recent Activities
      </h2>
      <div className="max-h-80 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="text-[var(--muted)]">Loading activities...</p>
        ) : notifications.length === 0 ? (
          <p className="text-[var(--muted)]">No recent activities to show.</p>
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
