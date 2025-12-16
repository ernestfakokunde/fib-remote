import React from 'react'

const currency = (v) => {
  const amount = Number(v || 0);
  return `NGN ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PurchaseSummary = ({ totalValue = 0, transactions = 0 }) => {
  return (
    <div className='bg-white rounded-lg p-6 shadow-sm mb-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <div className='text-sm text-gray-500'>Total Purchase Value</div>
          <div className='text-2xl font-semibold text-gray-900 mt-2'>{currency(totalValue)}</div>
        </div>
        <div className='text-right'>
          <div className='text-sm text-gray-500'>Total Transactions</div>
          <div className='text-xl font-medium text-gray-900 mt-2'>{transactions}</div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseSummary
