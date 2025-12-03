import React from 'react'

const DashboardCard = ({ title, value, trend, Icon }) => {
  return (
    <div className="flex items-center justify-between p-10 bg-white shadow-sm rounded-xl border-none hover:shadow-md transition">
      <div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {trend && (
          <p className="text-green-600 text-xs mt-1 font-medium">{trend}</p>
        )}
      </div>

      <div className="p-3 rounded-lg bg-blue-50">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  )
}

export default DashboardCard