import React from 'react';
import { formatCurrency } from '../utils/format';

const PurchaseSummary = ({ totalValue = 0, transactions = 0 }) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="app-card min-w-0 p-4 sm:p-5">
        <div className="text-xs font-medium text-[var(--muted)]">Purchase value</div>
        <div className="money-value mt-2 truncate text-xl font-semibold text-[var(--text)] sm:text-2xl">{formatCurrency(totalValue)}</div>
      </div>
      <div className="app-card min-w-0 p-4 sm:p-5">
        <div className="text-xs font-medium text-[var(--muted)]">Transactions</div>
        <div className="mt-2 text-xl font-semibold tabular-nums text-[var(--text)] sm:text-2xl">{transactions}</div>
      </div>
    </div>
  );
};

export default PurchaseSummary;
