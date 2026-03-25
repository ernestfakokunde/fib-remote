import React from 'react'

const DashboardCard = ({ title, value, trend, Icon }) => {
  return (
    <div className="glass-panel animate-fade-up flex items-center justify-between rounded-3xl border p-8 transition-transform duration-300 hover:-translate-y-1">
      <div>
        <h3 className="text-sm font-medium text-[var(--muted)]">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-[var(--text)]">{value}</p>
        {trend && (
          <p className="text-green-600 text-xs mt-1 font-medium">{trend}</p>
        )}
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-3">
        {React.createElement(Icon, { className: "h-4 w-4 text-[var(--primary)]" })}
      </div>
    </div>
  )
}

export default DashboardCard
