import React from 'react';
import {
  AlertTriangle,
  Bell,
  CircleDollarSign,
  CreditCard,
  PackagePlus,
  Rocket,
  Siren,
} from 'lucide-react';

export const getNotificationIcon = (type, className = 'h-5 w-5') => {
  switch (type) {
    case 'PRODUCT_ADDED':
      return <Rocket className={`${className} text-sky-500`} />;
    case 'LOW_STOCK':
      return <AlertTriangle className={`${className} text-amber-500`} />;
    case 'OUT_OF_STOCK':
      return <Siren className={`${className} text-rose-500`} />;
    case 'STOCK_IN':
      return <PackagePlus className={`${className} text-emerald-500`} />;
    case 'SALE_MADE':
      return <CircleDollarSign className={`${className} text-green-500`} />;
    case 'EXPENSE_RECORDED':
      return <CreditCard className={`${className} text-orange-500`} />;
    default:
      return <Bell className={`${className} text-[var(--muted)]`} />;
  }
};

export const formatNotificationTime = (value) => {
  const date = new Date(value);
  const diffInSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return 'Just now';

  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [label, seconds] of units) {
    const amount = Math.floor(diffInSeconds / seconds);
    if (amount >= 1) {
      return `${amount} ${label}${amount > 1 ? 's' : ''} ago`;
    }
  }

  return date.toLocaleString();
};
