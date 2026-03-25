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
    <div className='glass-panel animate-fade-up mx-auto w-full max-w-lg rounded-3xl border p-5 text-[var(--text)]'>
      <div className='flex items-center gap-2 mb-4'>
        <Sparkles className='text-[var(--primary)]' />
        <h3 className='text-lg font-semibold'>Ask Spectra AI</h3>
      </div>
      <input
        type='text'
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder='e.g., "Show me top selling products"'
        className='theme-input rounded-2xl px-3 py-2'
      />
      <div className='mt-4 text-sm text-[var(--muted)]'>
        <p className='font-semibold mb-2'>Suggestions:</p>
        <div className='grid grid-cols-2 gap-2'>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInputValue(s)}
              className='glass-hover rounded-2xl border border-transparent p-2 text-left transition-colors'
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
