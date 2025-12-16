import React from 'react'

const Modal = ({ children, onClose, widthClass = 'max-w-md', topOffset = 'pt-10' }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center z-50">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 ${topOffset} w-full ${widthClass} mx-4 sm:mx-0`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default Modal
