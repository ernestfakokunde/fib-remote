import React from 'react';
import SpectraAI from './SpectraAI';
import { X } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 z-50'>
      <div className='relative bg-gray-900/50 border border-gray-700 rounded-xl w-full max-w-2xl'>
        <button
          onClick={onClose}
          className='absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-700/50'
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
