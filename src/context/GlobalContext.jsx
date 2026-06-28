import React, { createContext, useState, useContext, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState(40.50);
  const [capital, setCapital] = useState(0); // Arranca en 0 y espera a la BD
  const [inventoryItems, setInventoryItems] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isBiometricLinked, setIsBiometricLinked] = useState(false);

  const API_URL = 'https://crunchy-backend-mtxo.onrender.com/api';

  const refreshDataFromDatabase = async () => {
    try {
      const resInsumos = await fetch(`${API_URL}/insumos`);
      if (resInsumos.ok) setInventoryItems(await resInsumos.json());

      const resProductos = await fetch(`${API_URL}/productos`);
      if (resProductos.ok) setFinishedProducts(await resProductos.json());

      const resClientes = await fetch(`${API_URL}/clientes`);
      if (resClientes.ok) setClients(await resClientes.json());

      const resCheck = await fetch(`${API_URL}/auth/check-biometric`);
        if (resCheck.ok) {
          const dataCheck = await resCheck.json();
          
          // NUEVO: Solo muestra que está vinculado si la BD dice que sí, 
          // Y si este dispositivo físico tiene el "Post-it" guardado.
          const isThisDeviceLinked = localStorage.getItem('crunchy_biometric_device') === 'true';
          setIsBiometricLinked(dataCheck.linked && isThisDeviceLinked);
      }

      // NUEVO: Traer el capital en vivo desde Supabase
      const resCap = await fetch(`${API_URL}/capital`);
      if (resCap.ok) {
        const dataCap = await resCap.json();
        setCapital(dataCap.capital);
      }
    } catch (error) {
      console.error("Error al sincronizar con el backend:", error);
    }
  };

  useEffect(() => {
    const fetchRealEuroRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await response.json();
        if (data?.rates?.VES) setExchangeRate(data.rates.VES);
      } catch (error) {
        console.warn("API de tasas caída, usando valor base.");
      }
    };
    fetchRealEuroRate();
    refreshDataFromDatabase();
  }, []);

  // --- LÓGICA DE SINCRONIZACIÓN DE CAJA ---
  // Modificar manualmente con el botón del lapicito
  const updateCapital = async (newAmount) => {
    const val = parseFloat(newAmount);
    setCapital(val); 
    await fetch(`${API_URL}/capital`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newCapital: val }) });
  };

  // Modificar automáticamente tras una operación comercial
  const modifyCapitalBy = (amount) => {
    setCapital(prev => {
      const newVal = prev + parseFloat(amount);
      fetch(`${API_URL}/capital`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newCapital: newVal }) });
      return newVal;
    });
  };

  // --- LÓGICA BIOMÉTRICA ---
  const registerBiometric = async () => {
    try {
      const resOptions = await fetch(`${API_URL}/auth/register-options`);
      if (!resOptions.ok) throw new Error((await resOptions.json()).error);
      const regResponse = await startRegistration(await resOptions.json());
      const resVerify = await fetch(`${API_URL}/auth/register-verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regResponse) });
      if ((await resVerify.json()).verified) {
        // NUEVO: Guarda el permiso físico en este dispositivo
        localStorage.setItem('crunchy_biometric_device', 'true');
        setIsBiometricLinked(true);
        alert("¡Huella guardada exitosamente!");
      }
    } catch (error) {
      alert(`Error del sistema: ${error.message}`); 
    }
  };

  const unlinkBiometric = async () => {
    try {
      if ((await fetch(`${API_URL}/auth/reset-biometric`, { method: 'DELETE' })).ok) {
        // NUEVO: Rompe el permiso físico
        localStorage.removeItem('crunchy_biometric_device');
        setIsBiometricLinked(false);
        alert("Huella borrada de la base de datos.");
      }
    } catch (error) { console.error(error); }
  };

  // --- REGLAS DE NEGOCIO ---
  const buyMaterials = async (category, title, quantity, costBs) => {
    const res = await fetch(`${API_URL}/insumos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, name: title, quantity, total_cost_bs: costBs }) });
    if (res.ok) { 
      modifyCapitalBy(-parseFloat(costBs)); // Restamos y guardamos en BD
      refreshDataFromDatabase(); 
    }
  };

  const producePackages = async (productName, bagId, stickersQty, peanutCostBs, bagsAchieved, salePriceEur) => {
    const res = await fetch(`${API_URL}/produccion`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName, bagId, stickersQty, bagsAchieved, salePriceEur }) });
    if (res.ok) { 
      modifyCapitalBy(-parseFloat(peanutCostBs)); // Restamos y guardamos en BD
      refreshDataFromDatabase(); 
      return { success: true }; 
    }
    return { success: false };
  };

  const registerNewSale = async (clientName, productId, quantity) => {
    const product = finishedProducts.find(p => p.id === parseInt(productId));
    if (!product) return { success: false };
    const totalBs = (parseFloat(product.price_eur) * parseInt(quantity)) * exchangeRate;
    const res = await fetch(`${API_URL}/ventas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName, productId, quantity, totalOwedBs: totalBs }) });
    if (res.ok) { refreshDataFromDatabase(); return { success: true }; }
    return { success: false, message: "Error al registrar la venta" };
  };

  const payDebt = async (clientId, exactPaidBs) => {
    const res = await fetch(`${API_URL}/clientes/${clientId}/pago`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exactPaidBs }) });
    if (res.ok) { 
      modifyCapitalBy(parseFloat(exactPaidBs)); // Sumamos y guardamos en BD
      refreshDataFromDatabase(); 
    }
  };

  const checkLowStock = () => {
    const totalBags = inventoryItems.filter(i => i.category === 'bags').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalStickers = inventoryItems.filter(i => i.category === 'stickers').reduce((acc, curr) => acc + curr.quantity, 0);
    return totalBags < 20 || totalStickers < 20;
  };

  return (
    <GlobalContext.Provider value={{
      exchangeRate, capital, clients, payDebt, checkLowStock,
      inventoryItems, finishedProducts, buyMaterials, producePackages, registerNewSale, 
      isBiometricLinked, registerBiometric, unlinkBiometric, updateCapital,
      receivables: Array.isArray(clients) ? clients.filter(c => c.status === 'Debe').reduce((acc, curr) => acc + parseFloat(curr.total_owed_bs || 0), 0) : 0,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};