import React from 'react'

const Modal = ({ children, onClose, widthClass = 'max-w-md', topOffset = 'pt-10' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div className="glass-overlay animate-pop-in absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 ${topOffset} animate-fade-up w-full ${widthClass} mx-4 sm:mx-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
