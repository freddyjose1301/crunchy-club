// src/components/AlertBanner.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

export const AlertBanner = () => {
  const { checkLowStock, inventory } = useGlobalContext();
  
  if (!checkLowStock()) return null;

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 flex items-center shadow-sm animate-pulse">
      <AlertTriangle className="mr-2" size={20} />
      <p className="font-semibold text-sm">
        ¡Atención! Tienes bajo stock de insumos. 
        (Bolsas: {inventory.bags} | Stickers: {inventory.stickers})
      </p>
    </div>
  );
};