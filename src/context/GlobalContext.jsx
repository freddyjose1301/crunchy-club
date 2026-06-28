import React, { createContext, useState, useContext } from 'react';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState(40.50);
  const [capital, setCapital] = useState(5000);
  
  // Inventario modificado: Solo Bolsas y el Sticker Único
  const [inventoryItems, setInventoryItems] = useState([
    { id: 'b1', category: 'bags', name: 'Bolsa Clásica Transparente', quantity: 150, totalCostBs: 375 },
    { id: 's1', category: 'stickers', name: 'Sticker Crunchy Club', quantity: 150, totalCostBs: 150 }
  ]);
  
  // Productos terminados ahora es un Array para separar por tipos (Surtido, Salado, etc.)
  const [finishedProducts, setFinishedProducts] = useState([
    { id: 'fp1', name: 'Maní Salado', quantity: 20, priceEur: 1.5 },
    { id: 'fp2', name: 'Maní Surtido', quantity: 15, priceEur: 2.0 }
  ]);

  const [clients, setClients] = useState([
    { id: 1, name: 'María V.', packages: 2, totalOwedBs: 200, status: 'Debe' }
  ]);

  // Registrar una nueva venta (Descuenta producto terminado y crea cuenta por cobrar)
  const registerNewSale = (clientName, productId, quantity) => {
    const product = finishedProducts.find(p => p.id === productId);
    
    if (!product) return { success: false, message: "Producto no encontrado." };
    if (product.quantity < parseInt(quantity)) {
      return { 
        success: false, 
        message: `Stock insuficiente de ${product.name}. Solo quedan ${product.quantity} paquetes disponibles.` 
      };
    }

    // 1. Descontar del inventario de productos terminados
    setFinishedProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, quantity: p.quantity - parseInt(quantity) } : p
    ));

    // 2. Calcular los montos con la tasa actual
    const totalEur = product.priceEur * parseInt(quantity);
    const totalBs = totalEur * exchangeRate;

    // 3. Crear el registro del cliente en la lista de "Debe"
    setClients(prev => [
      ...prev,
      { 
        id: Date.now(), 
        name: clientName, 
        packages: parseInt(quantity), 
        totalOwedBs: totalBs, 
        status: 'Debe' 
      }
    ]);

    return { success: true };
  };

  const payDebt = (clientId, exactPaidBs) => {
    setClients(clients.map(c => c.id === clientId ? { ...c, status: 'Pagado' } : c));
    setCapital(prev => prev + parseFloat(exactPaidBs));
  };

  // Comprar Insumos (Maneja la lógica del sticker único)
  const buyMaterials = (category, title, quantity, costBs) => {
    setCapital(prev => prev - parseFloat(costBs));
    
    // Si es sticker, forzamos el nombre para que siempre se agrupe en el mismo
    const finalTitle = category === 'stickers' ? 'Sticker Crunchy Club' : title;
    
    setInventoryItems(prev => {
      const existing = prev.find(item => item.name.toLowerCase() === finalTitle.toLowerCase() && item.category === category);
      if (existing) {
        return prev.map(item => item.id === existing.id ? {
          ...item,
          quantity: item.quantity + parseFloat(quantity),
          totalCostBs: item.totalCostBs + parseFloat(costBs)
        } : item);
      }
      return [...prev, { id: Date.now().toString(), category, name: finalTitle, quantity: parseFloat(quantity), totalCostBs: parseFloat(costBs) }];
    });
  };

  // Nueva Lógica de Producción Just-in-Time
  const producePackages = (productName, bagId, stickersQty, peanutCostBs, bagsAchieved, salePriceEur) => {
    // 1. Descontar el costo del maní del capital (compra directa para producción)
    setCapital(prev => prev - parseFloat(peanutCostBs));

    // 2. Descontar bolsas y stickers del stock
    setInventoryItems(prev => prev.map(item => {
      if (item.id === bagId) return { ...item, quantity: item.quantity - parseInt(bagsAchieved) };
      if (item.category === 'stickers') return { ...item, quantity: item.quantity - parseInt(stickersQty) };
      return item;
    }));

    // 3. Registrar el producto terminado (crea uno nuevo o suma al existente)
    setFinishedProducts(prev => {
      const existing = prev.find(p => p.name.toLowerCase() === productName.toLowerCase());
      if (existing) {
        return prev.map(p => p.id === existing.id ? { 
          ...p, 
          quantity: p.quantity + parseInt(bagsAchieved),
          priceEur: parseFloat(salePriceEur) // Actualiza al último precio de venta indicado
        } : p);
      }
      return [...prev, { id: Date.now().toString(), name: productName, quantity: parseInt(bagsAchieved), priceEur: parseFloat(salePriceEur) }];
    });
  };

  const checkLowStock = () => {
    const totalBags = inventoryItems.filter(i => i.category === 'bags').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalStickers = inventoryItems.filter(i => i.category === 'stickers').reduce((acc, curr) => acc + curr.quantity, 0);
    return totalBags < 20 || totalStickers < 20;
  };

  const value = {
    exchangeRate, capital, clients, payDebt, checkLowStock,
    inventoryItems, finishedProducts, buyMaterials, producePackages,
    receivables: clients.filter(c => c.status === 'Debe').reduce((acc, curr) => acc + curr.totalOwedBs, 0),
    registerNewSale
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};