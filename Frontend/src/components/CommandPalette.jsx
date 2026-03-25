import React from 'react';
import SpectraAI from './SpectraAI';
import { X } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className='glass-overlay fixed inset-0 z-50 flex items-start justify-center pt-20'>
      <div className='glass-modal animate-fade-up relative w-full max-w-2xl rounded-3xl'>
        <button
          onClick={onClose}
          className='absolute right-3 top-3 rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]'
        >
          <X size={18} />
        </button>
        <div className='p-4'>
          <SpectraAI />
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
