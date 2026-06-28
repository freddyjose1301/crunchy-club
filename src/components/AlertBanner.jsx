import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext'; // Ajusta la ruta si es necesario

export const AlertBanner = () => {
  const { checkLowStock, inventoryItems } = useGlobalContext();
  
  if (!checkLowStock()) return null;

  // Calculamos las cantidades leyendo el nuevo arreglo de PostgreSQL
  const bagsCount = inventoryItems?.filter(i => i.category === 'bags').reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  const stickersCount = inventoryItems?.filter(i => i.category === 'stickers').reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 flex items-center shadow-sm animate-pulse rounded-xl">
      <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
      <p className="font-semibold text-sm">
        ¡Atención! Tienes bajo stock operativo para los empaques. 
        (Bolsas: {bagsCount} | Stickers: {stickersCount})
      </p>
    </div>
  );
};