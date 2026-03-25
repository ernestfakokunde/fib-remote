import React from 'react';
import { Bell } from 'lucide-react';
import { getNotificationIcon, formatNotificationTime } from '../utils/notificationMeta';

const NotificationsPanel = ({
  isOpen,
  notifications = [],
  loading = false,
  unreadCount = 0,
  onNotificationClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className='notification-panel absolute right-0 top-full z-[120] mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl'>
      <div className='flex items-center justify-between border-b border-[var(--border)] px-4 py-4'>
        <h3 className='flex items-center gap-2 font-semibold text-[var(--text)]'>
          <Bell size={18} />
          Notifications
        </h3>
        <span className='rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]'>
          {unreadCount} unread
        </span>
      </div>
      <div className='max-h-96 space-y-2 overflow-y-auto p-3'>
        {loading && notifications.length === 0 ? (
          <p className='px-2 py-8 text-center text-sm text-[var(--muted)]'>
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className='px-2 py-8 text-center text-sm text-[var(--muted)]'>
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              type='button'
              onClick={() => onNotificationClick?.(notification)}
              className='glass-hover flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-all duration-200'
            >
              <div className='mt-0.5 rounded-xl bg-[var(--surface)] p-2'>
                {getNotificationIcon(notification.type)}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='mb-1 flex items-start justify-between gap-3'>
                  <p className='text-sm font-medium leading-5 text-[var(--text)]'>
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <span
                      className='mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--primary)]'
                      title='Unread'
                    />
                  )}
                </div>
                <p className='text-xs text-[var(--muted)]'>
                  {formatNotificationTime(notification.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      <div className='border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)]'>
        Recent activity and the bell panel are now synced.
      </div>
    </div>
  );
};

export default NotificationsPanel;
