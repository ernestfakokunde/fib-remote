import React from 'react';

const PurchaseItem = ({ purchase }) => {
  const product = purchase.product || {};
  const date = new Date(purchase.date || purchase.createdAt || Date.now());

  return (
    <div className="glass-panel flex items-center justify-between rounded-[1.25rem] border border-white/10 p-4 shadow-lg">
      <div>
        <div className="font-medium text-[var(--text)]">{product.name || 'Product'}</div>
        <div className="text-sm text-[var(--muted)]">
          Qty: {purchase.quantity} | Cost: NGN {Number(purchase.costPrice).toFixed(2)} | Total: NGN {Number(purchase.totalCost).toFixed(2)}
        </div>
        {purchase.supplier ? <div className="text-xs text-[var(--muted)]/80">Supplier: {purchase.supplier}</div> : null}
      </div>
      <div className="text-sm text-[var(--muted)]">{date.toLocaleString()}</div>
    </div>
  );
};

export default PurchaseItem;
