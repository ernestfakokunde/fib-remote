import React from 'react';
import { formatCurrency } from '../utils/format';

const PurchaseSummary = ({ totalValue = 0, transactions = 0 }) => {
  return (
    <div className="glass-panel mb-6 rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Total Purchase Value</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">{formatCurrency(totalValue)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Total Transactions</div>
          <div className="mt-2 text-xl font-medium text-[var(--text)]">{transactions}</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummary;
