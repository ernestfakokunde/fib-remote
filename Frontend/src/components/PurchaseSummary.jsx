import React from 'react';
import { formatCurrency } from '../utils/format';

const PurchaseSummary = ({ totalValue = 0, transactions = 0 }) => {
  return (
    <div className="app-card p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-[var(--muted)]">Purchase value</div>
          <div className="money-value mt-2 text-xl font-semibold text-[var(--text)] sm:text-2xl">{formatCurrency(totalValue)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-[var(--muted)]">Transactions</div>
          <div className="mt-2 text-xl font-semibold tabular-nums text-[var(--text)]">{transactions}</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummary;
