import React from 'react';
import { formatCurrency } from '../utils/format';

const PurchaseItem = ({ purchase }) => {
  const product = purchase.product || {};
  const dateValue = purchase.date || purchase.createdAt;
  const date = dateValue ? new Date(dateValue) : null;

  return (
    <div className="glass-panel flex items-center justify-between rounded-[1.25rem] border border-white/10 p-4 shadow-lg">
      <div>
        <div className="font-medium text-[var(--text)]">{product.name || 'Product'}</div>
        <div className="text-sm text-[var(--muted)]">
          Qty: {purchase.quantity} | Cost: {formatCurrency(purchase.costPrice)} | Total: {formatCurrency(purchase.totalCost)}
        </div>
        {purchase.supplier ? <div className="text-xs text-[var(--muted)]/80">Supplier: {purchase.supplier}</div> : null}
      </div>
      <div className="text-sm text-[var(--muted)]">{date?.toLocaleString() || 'Date unavailable'}</div>
    </div>
  );
};

export default PurchaseItem;
