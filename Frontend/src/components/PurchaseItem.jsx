import React from 'react'

const PurchaseItem = ({ purchase }) => {
  const product = purchase.product || {};
  const date = new Date(purchase.date || purchase.createdAt || Date.now());
  return (
    <div className='bg-white p-3 rounded shadow-sm flex items-center justify-between'>
      <div>
        <div className='font-medium'>{product.name || 'Product'}</div>
        <div className='text-sm text-gray-500'>Qty: {purchase.quantity} • Cost: NGN {Number(purchase.costPrice).toFixed(2)} • Total: NGN {Number(purchase.totalCost).toFixed(2)}</div>
        {purchase.supplier && <div className='text-xs text-gray-400'>Supplier: {purchase.supplier}</div>}
      </div>
      <div className='text-sm text-gray-500'>{date.toLocaleString()}</div>
    </div>
  )
}

export default PurchaseItem
