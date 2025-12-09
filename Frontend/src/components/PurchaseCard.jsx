import React from 'react'

const  PurchaseCard = ({title, value }) => {
  return (
    <div className='flex p-8 items-center rounded-xl shadow-md transition flex-col gap-2 bg-white'> 
        <h2 className='text-shadow-gray-300'>{title}</h2>
        <p className='text-green-500'>{ value }</p>
    </div>
  )
}

export default PurchaseCard