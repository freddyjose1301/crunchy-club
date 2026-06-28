import React, { createContext, useState, useContext, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser'; // Importación vital

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState(40.50);
  const [capital, setCapital] = useState(5000);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isBiometricLinked, setIsBiometricLinked] = useState(false); // Estado del botón temporal

  const API_URL = 'https://crunchy-backend-mtxo.onrender.com/api';

  const refreshDataFromDatabase = async () => {
    try {
      const resInsumos = await fetch(`${API_URL}/insumos`);
      setInventoryItems(await resInsumos.json());

      const resProductos = await fetch(`${API_URL}/productos`);
      setFinishedProducts(await resProductos.json());

      const resClientes = await fetch(`${API_URL}/clientes`);
      setClients(await resClientes.json());

      // Consultar si la huella ya está registrada en PostgreSQL
      const resCheck = await fetch(`${API_URL}/auth/check-biometric`);
      const dataCheck = await resCheck.json();
      setIsBiometricLinked(dataCheck.linked);
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

  // Función para registrar la huella dactilar usando el hardware del dispositivo
const registerBiometric = async () => {
    try {
      const resOptions = await fetch(`${API_URL}/auth/register-options`);
      
      // Validamos si el backend escupió un error antes de abrir el lector
      if (!resOptions.ok) {
        const errorData = await resOptions.json();
        throw new Error(errorData.error || "Falla al comunicarse con el backend");
      }

      const options = await resOptions.json();
      const regResponse = await startRegistration(options);

      const resVerify = await fetch(`${API_URL}/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResponse)
      });

      const verification = await resVerify.json();
      
      if (verification.verified) {
        setIsBiometricLinked(true);
        alert("¡Huella dactilar vinculada y guardada en PostgreSQL de forma exitosa!");
      } else {
        alert("La verificación biométrica falló.");
      }
    } catch (error) {
      console.error(error);
      // ALERTA DINÁMICA: Nos dirá exactamente qué se rompió en la pantalla de tu celular
      alert(`Error del sistema: ${error.message}`); 
    }
  };

  // Métodos puente para componentes
  const buyMaterials = async (category, title, quantity, costBs) => {
    const res = await fetch(`${API_URL}/insumos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, name: title, quantity, total_cost_bs: costBs }) });
    if (res.ok) { setCapital(prev => prev - parseFloat(costBs)); refreshDataFromDatabase(); }
  };

  const producePackages = async (productName, bagId, stickersQty, peanutCostBs, bagsAchieved, salePriceEur) => {
    const res = await fetch(`${API_URL}/produccion`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName, bagId, stickersQty, bagsAchieved, salePriceEur }) });
    if (res.ok) { setCapital(prev => prev - parseFloat(peanutCostBs)); refreshDataFromDatabase(); return { success: true }; }
    return { success: false };
  };

  const registerNewSale = async (clientName, productId, quantity) => {
    const product = finishedProducts.find(p => p.id === parseInt(productId));
    if (!product) return { success: false };
    const totalBs = (product.price_eur * parseInt(quantity)) * exchangeRate;
    const res = await fetch(`${API_URL}/ventas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName, productId, quantity, totalOwedBs: totalBs }) });
    if (res.ok) { refreshDataFromDatabase(); return { success: true }; }
    return { success: false, message: "Error al registrar la venta" };
  };

  const payDebt = async (clientId, exactPaidBs) => {
    const res = await fetch(`${API_URL}/clientes/${clientId}/pago`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exactPaidBs }) });
    if (res.ok) { setCapital(prev => prev + parseFloat(exactPaidBs)); refreshDataFromDatabase(); }
  };

  const checkLowStock = () => {
    const totalBags = inventoryItems.filter(i => i.category === 'bags').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalStickers = inventoryItems.filter(i => i.category === 'stickers').reduce((acc, curr) => acc + curr.quantity, 0);
    return totalBags < 20 || totalStickers < 20;
  };

  return (
    <GlobalContext.Provider value={{
      exchangeRate, capital, clients, payDebt, checkLowStock,
      inventoryItems, finishedProducts, buyMaterials, producePackages, registerNewSale, isBiometricLinked, registerBiometric,
      receivables: clients.filter(c => c.status === 'Debe').reduce((acc, curr) => acc + parseFloat(curr.total_held_bs || curr.total_owed_bs || 0), 0),
    }}>
      {children}
    </GlobalContext.Provider>
  );
};