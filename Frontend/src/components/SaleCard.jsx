import React from 'react';

const SaleCard = ({ title, value }) => {
  return (
    <div className="glass-panel rounded-[1.6rem] border border-white/10 p-6 shadow-xl">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-wide text-[var(--text)]">{value}</p>
    </div>
  );
};

export default SaleCard;
