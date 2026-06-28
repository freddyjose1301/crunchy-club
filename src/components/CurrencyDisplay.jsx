// src/components/CurrencyDisplay.jsx
import React from 'react';
import { useGlobalContext } from '../context/GlobalContext';

export const CurrencyDisplay = ({ amountBs, size = 'normal' }) => {
  const { exchangeRate } = useGlobalContext();
  const amountEur = (amountBs / exchangeRate).toFixed(2);
  
  return (
    <div className="flex flex-col items-start">
      <span className={`font-bold text-gray-900 ${size === 'large' ? 'text-3xl' : 'text-xl'}`}>
        {amountBs.toLocaleString('es-VE')} Bs
      </span>
      <span className={`text-gray-500 font-medium ${size === 'large' ? 'text-lg' : 'text-sm'}`}>
        € {amountEur}
      </span>
    </div>
  );
};