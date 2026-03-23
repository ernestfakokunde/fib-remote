import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

const SpectraAI = () => {
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    'What should I restock?',
    'Forecast sales for next month',
    'Summarize yesterdays sales',
    'Any unusual activity?',
  ];

  return (
    <div className='bg-gray-900/50 text-white rounded-lg p-4 w-full max-w-lg mx-auto'>
      <div className='flex items-center gap-2 mb-4'>
        <Sparkles className='text-purple-400' />
        <h3 className='text-lg font-semibold'>Ask Spectra AI</h3>
      </div>
      <input
        type='text'
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder='e.g., "Show me top selling products"'
        className='w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500'
      />
      <div className='mt-4 text-sm text-gray-400'>
        <p className='font-semibold mb-2'>Suggestions:</p>
        <div className='grid grid-cols-2 gap-2'>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInputValue(s)}
              className='text-left bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-md transition-colors'
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpectraAI;
