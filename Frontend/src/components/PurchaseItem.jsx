import React from 'react';
import { formatCurrency } from '../utils/format';

const PurchaseItem = ({ purchase }) => {
  const product = purchase.product || {};
  const dateValue = purchase.date || purchase.createdAt;
  const date = dateValue ? new Date(dateValue) : null;

  return (
    <div className="app-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--text)]">{product.name || 'Product'}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">{purchase.quantity} units · {formatCurrency(purchase.costPrice)} each</div>
        {purchase.supplier ? <div className="mt-1 text-xs text-[var(--muted)]">Supplier: {purchase.supplier}</div> : null}
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
        <span className="money-value text-sm font-semibold text-[var(--text)]">{formatCurrency(purchase.totalCost)}</span>
        <span className="text-xs text-[var(--muted)]">{date?.toLocaleDateString() || 'Date unavailable'}</span>
      </div>
    </div>
  );
};

export default PurchaseItem;
