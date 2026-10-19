import React from 'react'

const DashboardCard = ({ title, value, trend, Icon }) => {
  return (
    <div className="glass-panel animate-fade-up flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] p-5 shadow-[var(--shadow)] transition-colors hover:bg-[var(--surface)]">
      <div>
        <h3 className="text-sm font-medium text-[var(--muted)]">{title}</h3>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
        {trend && <p className="mt-1 text-xs font-medium text-[var(--success)]">{trend}</p>}
      </div>

      <div className="rounded-xl bg-[var(--primary-soft)] p-3">
        {React.createElement(Icon, { className: "h-4 w-4 text-[var(--primary)]" })}
      </div>
    </div>
  )
}

export default DashboardCard
