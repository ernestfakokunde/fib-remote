import React from 'react';

const SaleCard = ({ title, value }) => {
  return (
    <div className="app-card min-w-0 p-4 sm:p-5">
      <p className="text-xs font-medium text-[var(--muted)]">{title}</p>
      <p className="money-value mt-2 truncate text-xl font-semibold text-[var(--text)] sm:text-2xl">{value}</p>
    </div>
  );
};

export default SaleCard;
