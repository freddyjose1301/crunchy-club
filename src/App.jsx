// src/App.jsx
import React, { useState } from 'react';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import { CurrencyDisplay } from './components/CurrencyDisplay';
import { AlertBanner } from './components/AlertBanner';
import { Fingerprint, Wallet, Package, TrendingUp, Users, LogOut } from 'lucide-react';
import logoCrunchy from './assets/logo.png';
import { startAuthentication } from '@simplewebauthn/browser';

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const API_URL = 'https://crunchy-backend-mtxo.onrender.com/api'; // URL de tu backend

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    if (password === 'guacara') {
      onLogin();
    } else {
      alert('Contraseña incorrecta. Acceso denegado.');
      setPassword('');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // 1. Pedir desafío de login al backend
      const resOptions = await fetch(`${API_URL}/auth/login-options`);
      if (!resOptions.ok) {
        const errorData = await resOptions.json();
        throw new Error(errorData.error || "Falla de conexión.");
      }
      const options = await resOptions.json();

      // 2. Encender el lector físico para loguearse
      const authResponse = await startAuthentication(options);

      // 3. Verificar con el backend
      const resVerify = await fetch(`${API_URL}/auth/login-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResponse)
      });

      const verification = await resVerify.json();
      if (verification.verified) {
        onLogin(); // Te deja entrar directo al Dashboard
      } else {
        alert("Huella no reconocida.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-brandBlue">
        <div className="flex flex-col items-center mb-6">
          <img src={logoCrunchy} alt="Crunchy Club Logo" className="w-32 h-auto object-contain mb-2" />
          <p className="text-center text-gray-500 text-sm font-semibold tracking-wider uppercase">
            Sistema de Gestión
          </p>
        </div>
        
        <form onSubmit={handlePasswordLogin}>
          <input 
            type="password" placeholder="Contraseña Maestra" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brandBlue text-center font-bold tracking-widest text-lg"
          />
          <button type="submit" className="w-full bg-brandBlue text-white font-bold py-3 rounded-lg hover:bg-brandBlueLight transition-colors mb-4 shadow-md">
            Entrar al Sistema
          </button>
        </form>
        
        <div className="relative flex items-center justify-center mb-4">
          <hr className="w-full border-gray-300" />
          <span className="absolute bg-white px-3 text-sm text-gray-400">O ingresa con</span>
        </div>
        
        <button 
          type="button" onClick={handleBiometricLogin} 
          className="w-full border-2 border-brandBlue text-brandBlue font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
        >
          <Fingerprint size={20} /> Huella Dactilar
        </button>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const { capital, receivables, isBiometricLinked, registerBiometric } = useGlobalContext();
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600"><Wallet size={28} /></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase">Capital Disponible</p>
            <CurrencyDisplay amountBs={capital} size="large" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 rounded-full text-orange-600"><TrendingUp size={28} /></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase">Cuentas por Cobrar</p>
            <CurrencyDisplay amountBs={receivables} size="large" />
          </div>
        </div>
      </div>

      {/* SECCIÓN TEMPORAL: SE OCULTA SI LA HUELLA YA ESTÁ VINCULADA EN POSTGRES */}
      {!isBiometricLinked && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <div className="p-3 bg-brandBlue text-white rounded-xl shadow-md">
              <Fingerprint size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Seguridad Biométrica Desactivada</h3>
              <p className="text-xs text-gray-500 mt-0.5">Vincule el lector de este dispositivo para omitir la contraseña maestra en el inicio de sesión.</p>
            </div>
          </div>
          <button
            onClick={registerBiometric}
            className="w-full sm:w-auto bg-brandBlue text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-brandBlueLight transition-colors shadow-sm whitespace-nowrap"
          >
            Vincular mi Huella
          </button>
        </div>
      )}
    </div>
  );
};

import { UserPlus, ShoppingBag, Check, Plus, X } from 'lucide-react'; // Asegúrate de importar estos iconos arriba

const SalesModule = () => {
  const { clients, finishedProducts, payDebt, registerNewSale, exchangeRate } = useGlobalContext();
  const [activeTab, setActiveTab] = useState('Debe');
  
  // Estados para el Modal de Pago
  const [selectedClient, setSelectedClient] = useState(null);
  const [exactPayment, setExactPayment] = useState('');

  // Estados para el Formulario de Nueva Venta
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleData, setSaleData] = useState({ clientName: '', productId: '', quantity: '' });

  // Cálculos en tiempo real para la confirmación de la venta
  const selectedProduct = finishedProducts.find(p => p.id === saleData.productId);
  const calculatedTotalEur = selectedProduct ? selectedProduct.priceEur * (parseInt(saleData.quantity) || 0) : 0;
  const calculatedTotalBs = calculatedTotalEur * exchangeRate;

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if(exactPayment && selectedClient) {
      payDebt(selectedClient.id, exactPayment);
      setSelectedClient(null);
      setExactPayment('');
    }
  };

  const handleCreateSale = (e) => {
    e.preventDefault();
    const prodId = saleData.productId || finishedProducts[0]?.id;
    if (!prodId) return alert("No tienes productos terminados en stock para vender.");
    
    const result = registerNewSale(saleData.clientName, prodId, saleData.quantity);
    
    if (result.success) {
      alert("¡Venta registrada exitosamente!");
      setShowSaleForm(false);
      setSaleData({ clientName: '', productId: '', quantity: '' });
    } else {
      alert(result.message);
    }
  };

  const filteredClients = clients.filter(c => c.status === activeTab);

  return (
    <div className="space-y-4 mb-20">
      {/* CABECERA CON ACCIÓN PRINCIPAL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="text-brandBlue" size={24} /> Gestión de Ventas
        </h2>
        <button 
          onClick={() => {
            setShowSaleForm(true);
            if (finishedProducts.length > 0) {
              setSaleData(prev => ({ ...prev, productId: finishedProducts[0].id }));
            }
          }}
          className="bg-brandBlue text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-brandBlueLight transition-colors text-sm shadow-md"
        >
          <Plus size={18} /> Nueva Venta
        </button>
      </div>

      {/* LISTADO DE CLIENTES CON PESTAÑAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'Debe' ? 'border-b-4 border-brandBlue text-brandBlue bg-blue-50/30' : 'text-gray-400'}`}
            onClick={() => setActiveTab('Debe')}
          >
            CUENTAS POR COBRAR ({clients.filter(c => c.status === 'Debe').length})
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'Pagado' ? 'border-b-4 border-brandBlue text-brandBlue bg-blue-50/30' : 'text-gray-400'}`}
            onClick={() => setActiveTab('Pagado')}
          >
            HISTORIAL PAGADO ({clients.filter(c => c.status === 'Pagado').length})
          </button>
        </div>

        <div className="p-4 divide-y">
          {filteredClients.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm italic">No hay registros en esta sección.</p>
          ) : (
            filteredClients.map(client => (
              <div key={client.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-bold text-gray-800 text-base">{client.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{client.packages} Paquetes entregados</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {/* Ajustado para leer el formato de base de datos */}
                  <CurrencyDisplay amountBs={parseFloat(client.total_owed_bs)} />
                  {activeTab === 'Debe' && (
                    <button 
                      onClick={() => setSelectedClient(client)}
                      className="mt-1 bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-md hover:bg-green-600 shadow-sm transition-all flex items-center gap-1"
                    >
                      <Check size={12} /> Procesar Pago
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL / FORMULARIO: REGISTRAR NUEVA VENTA */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-brandBlue">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><UserPlus size={20} className="text-brandBlue"/> Despachar Pedido</h3>
              <button onClick={() => setShowSaleForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <form onSubmit={handleCreateSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Cliente</label>
                <input 
                  type="text" required placeholder="Ej. Abasto Los Centrales"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:border-brandBlue font-medium text-sm"
                  value={saleData.clientName} onChange={(e) => setSaleData({...saleData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto a Llevar</label>
                  <select 
                    className="w-full p-3 border rounded-xl bg-white text-sm font-medium focus:border-brandBlue focus:outline-none"
                    value={saleData.productId} onChange={(e) => setSaleData({...saleData, productId: e.target.value})}
                  >
                    {finishedProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.quantity} disp.)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad (Pqts)</label>
                  <input 
                    type="number" required min="1" placeholder="0"
                    className="w-full p-3 border rounded-xl font-bold text-sm"
                    value={saleData.quantity} onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                  />
                </div>
              </div>

              {/* CUADRO DE CONFIRMACIÓN FINANCIERA */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 mt-2">
                <div className="flex justify-between items-center border-b border-blue-200/60 pb-2">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total en Euros</span>
                  <span className="text-xl font-black text-brandBlue">€ {calculatedTotalEur.toFixed(2)}</span>
                </div>
                
                {/* Respetando la regla de oro financiera principal */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">Monto Total Base (Cuentas por cobrar)</span>
                  <div className="text-right">
                    <span className="font-black text-base text-gray-900 block">{calculatedTotalBs.toLocaleString('es-VE')} Bs</span>
                    <span className="text-[10px] text-gray-400 font-medium block">Indexado a la tasa actual</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSaleForm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-brandBlue text-white font-bold rounded-xl text-sm hover:bg-brandBlueLight shadow-md transition-colors">
                  Confirmar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PROCESAR DEUDA (Mantiene tu lógica previa intacta) */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Procesar Ingreso</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Cuánto pagó exactamente <b>{selectedClient.name}</b> en Bs?
            </p>
            <form onSubmit={handleProcessPayment}>
              <input 
                type="number" step="0.01" required autoFocus
                value={exactPayment} onChange={(e) => setExactPayment(e.target.value)}
                placeholder="Monto exacto en Bs"
                className="w-full p-3 border-2 border-brandBlue rounded-xl mb-4 text-2xl font-black text-center text-brandBlue focus:outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedClient(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-green-600">Registrar Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import { PackagePlus, Factory, Box, Tag, Layers } from 'lucide-react'; // Asegúrate de tener estos iconos

const InventoryModule = () => {
  const { inventoryItems, finishedProducts, buyMaterials, exchangeRate } = useGlobalContext();
  const [formData, setFormData] = useState({ category: 'bags', title: '', quantity: '', costBs: '' });

  const handlePurchase = (e) => {
    e.preventDefault();
    // Validar título solo si es bolsa
    if(formData.category === 'bags' && !formData.title) return alert("Ingresa el nombre de la bolsa.");
    if(formData.quantity && formData.costBs) {
      buyMaterials(formData.category, formData.title, formData.quantity, formData.costBs);
      setFormData({ category: 'bags', title: '', quantity: '', costBs: '' });
      alert("¡Compra registrada en stock!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
      {/* PANEL DE STOCK ACTUAL */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
        
        {/* Insumos */}
        <div>
          <h2 className="text-xl font-bold text-brandBlue mb-4 flex items-center gap-2"><Box size={24} /> Insumos en Stock</h2>
          <div className="space-y-3">
            {inventoryItems.map(item => {
              const unitCost = (item.totalCostBs / item.quantity) || 0;
              return (
                <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <span className="font-bold text-gray-800">{item.name}</span>
                    <span className="text-xs text-gray-400 block uppercase">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{item.quantity} und</span>
                    <span className="text-xs text-brandBlue block">{unitCost.toFixed(2)} Bs/u</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Productos Terminados Desglosados */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="font-bold text-brandBlue mb-3 flex items-center gap-2"><Tag size={18} /> Productos Terminados</h3>
          <div className="space-y-2">
            {finishedProducts.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay productos terminados.</p>
            ) : (
              finishedProducts.map(fp => (
                <div key={fp.id} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                  <span className="font-bold text-gray-700">{fp.name}</span>
                  <div className="text-right">
                    <span className="font-black text-brandBlue">{fp.quantity} Pqts</span>
                    <span className="text-[10px] text-gray-400 block">Venta: €{fp.price_eur} ({(fp.price_eur * exchangeRate).toFixed(2)} Bs)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FORMULARIO DE COMPRA DE INSUMOS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
        <h2 className="text-xl font-bold text-brandBlue mb-4 flex items-center gap-2"><PackagePlus size={24} /> Comprar Empaques</h2>
        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">¿Qué vas a ingresar?</label>
            <select 
              className="w-full p-3 border rounded-lg bg-white focus:ring-1 focus:border-brandBlue"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value, title: ''})}
            >
              <option value="bags">Bolsas</option>
              <option value="stickers">Stickers (Genérico)</option>
            </select>
          </div>
          
          {/* Este input se oculta mágicamente si seleccionas Stickers */}
          {formData.category === 'bags' && (
            <div className="animate-fadeIn">
              <label className="block text-sm text-gray-600 mb-1">Nombre de la Bolsa</label>
              <input 
                type="text" placeholder="Ej. Bolsa Kraft con Ventana"
                className="w-full p-3 border rounded-lg focus:ring-1 focus:border-brandBlue"
                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
              <input type="number" required min="1" className="w-full p-3 border rounded-lg"
                value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Costo Total (Bs)</label>
              <input type="number" step="0.01" required min="0.1" className="w-full p-3 border rounded-lg"
                value={formData.costBs} onChange={(e) => setFormData({...formData, costBs: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-brandBlue text-white font-bold py-3 rounded-lg hover:bg-brandBlueLight transition-colors">
            Sumar a Inventario
          </button>
        </form>
      </div>
    </div>
  );
};

const ProductionModule = () => {
  const { inventoryItems, producePackages } = useGlobalContext();
  
  const bagsList = inventoryItems.filter(i => i.category === 'bags');
  
  const [prodData, setProdData] = useState({ 
    productType: '', 
    bagId: bagsList[0]?.id || '', 
    stickersQty: '', 
    peanutKg: '', 
    peanutCostBs: '', 
    bagsAchieved: '', 
    gramsPerBag: '', 
    salePriceEur: '' 
  });

  const handleProduction = (e) => {
    e.preventDefault();
    producePackages(
      prodData.productType, 
      prodData.bagId, 
      prodData.stickersQty, 
      prodData.peanutCostBs, 
      prodData.bagsAchieved, 
      prodData.salePriceEur
    );
    alert(`¡Se han registrado ${prodData.bagsAchieved} paquetes de ${prodData.productType} con éxito!`);
    
    // Limpiar formulario excepto la bolsa seleccionada
    setProdData({ ...prodData, productType: '', stickersQty: '', peanutKg: '', peanutCostBs: '', bagsAchieved: '', gramsPerBag: '', salePriceEur: '' });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto mb-20">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="p-3 bg-brandBlue text-white rounded-xl"><Factory size={24} /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Línea de Producción</h2>
          <p className="text-sm text-gray-500">Registra el maní usado, los empaques y fija el precio de venta.</p>
        </div>
      </div>

      <form onSubmit={handleProduction} className="space-y-6">
        
        {/* BLOQUE 1: IDENTIFICACIÓN Y EMPAQUE */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Layers size={18}/> 1. Producto y Empaque</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Maní (Producto Final)</label>
              <input type="text" required placeholder="Ej. Maní Surtido, Salado..." className="w-full p-2.5 border rounded-lg font-bold text-brandBlue"
                value={prodData.productType} onChange={(e) => setProdData({...prodData, productType: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empaque a Utilizar</label>
              <select required className="w-full p-2.5 border rounded-lg bg-white" value={prodData.bagId} onChange={(e) => setProdData({...prodData, bagId: e.target.value})}>
                {bagsList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.quantity} disp.)</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 w-full md:w-1/2 md:pr-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stickers Usados</label>
            <input type="number" required placeholder="Cantidad de stickers" className="w-full p-2.5 border rounded-lg"
              value={prodData.stickersQty} onChange={(e) => setProdData({...prodData, stickersQty: e.target.value})} />
          </div>
        </div>

        {/* BLOQUE 2: MATERIA PRIMA (MANÍ) */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Box size={18}/> 2. Materia Prima Procesada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia Prima Usada (Kg)</label>
              <input type="number" step="0.01" required placeholder="Ej. 5.5" className="w-full p-2.5 border rounded-lg"
                value={prodData.peanutKg} onChange={(e) => setProdData({...prodData, peanutKg: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-500 uppercase mb-1">Costo del Maní (Bs)</label>
              <input type="number" step="0.01" required placeholder="Ej. 1200" className="w-full p-2.5 border border-red-200 bg-red-50 text-red-700 font-bold rounded-lg"
                value={prodData.peanutCostBs} onChange={(e) => setProdData({...prodData, peanutCostBs: e.target.value})} />
              <p className="text-[10px] text-gray-400 mt-1">*Este monto se descontará directo de tu capital.</p>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: RENDIMIENTO Y VENTA */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h3 className="font-bold text-brandBlue mb-3 flex items-center gap-2"><Tag size={18}/> 3. Rendimiento Final</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bolsas Logradas</label>
              <input type="number" required placeholder="Ej. 50" className="w-full p-2.5 border border-brandBlue rounded-lg text-lg font-black text-center"
                value={prodData.bagsAchieved} onChange={(e) => setProdData({...prodData, bagsAchieved: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gramos x Bolsa</label>
              <input type="number" required placeholder="Ej. 100" className="w-full p-2.5 border rounded-lg text-center"
                value={prodData.gramsPerBag} onChange={(e) => setProdData({...prodData, gramsPerBag: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Venta (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">€</span>
                <input type="number" step="0.01" required placeholder="1.50" className="w-full p-2.5 pl-7 border border-brandBlue bg-white font-bold text-brandBlue rounded-lg"
                  value={prodData.salePriceEur} onChange={(e) => setProdData({...prodData, salePriceEur: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-green-500 text-white font-black py-4 rounded-xl hover:bg-green-600 transition-colors shadow-lg text-lg">
          CONFIRMAR PRODUCCIÓN
        </button>
      </form>
    </div>
  );
};

import { Calculator, CheckCircle2, AlertTriangle, XCircle, DollarSign } from 'lucide-react';

export const InvestmentSimulator = () => {
  const { capital, exchangeRate, inventoryItems } = useGlobalContext();
  
  const [peanutCost, setPeanutCost] = useState('');
  const [peanutGrams, setPeanutGrams] = useState('');
  const [gramsPerBag, setGramsPerBag] = useState('');
  const [salePriceEur, setSalePriceEur] = useState('');

  // Listas de empaque extraídas del stock real
  const bagsInStock = inventoryItems.filter(i => i.category === 'bags');
  const stickersInStock = inventoryItems.filter(i => i.category === 'stickers');

  const [selectedBagId, setSelectedBagId] = useState(bagsInStock[0]?.id || '');
  const [selectedStickerId, setSelectedStickerId] = useState(stickersInStock[0]?.id || '');

  // Conversiones
  const pCost = parseFloat(peanutCost) || 0;
  const pGrams = parseFloat(peanutGrams) || 0;
  const gPerBag = parseFloat(gramsPerBag) || 0;
  const sPriceEur = parseFloat(salePriceEur) || 0;
  
  // EXTRAER COSTOS REALES DEL INVENTARIO
  const selectedBag = bagsInStock.find(i => i.id === selectedBagId);
  const unitBagCost = selectedBag ? (selectedBag.totalCostBs / selectedBag.quantity) : 0;

  const selectedSticker = stickersInStock.find(i => i.id === selectedStickerId);
  const unitStickerCost = selectedSticker ? (selectedSticker.totalCostBs / selectedSticker.quantity) : 0;

  const unitPackagingCost = unitBagCost + unitStickerCost;
  
  // --- LÓGICA DE PROYECCIÓN ---
  const estimatedBags = gPerBag > 0 ? Math.floor(pGrams / gPerBag) : 0;
  const totalPackagingCost = estimatedBags * unitPackagingCost; // Usa el costo real del stock
  const totalInvestmentBs = pCost + totalPackagingCost;
  const salePriceBs = sPriceEur * exchangeRate;
  
  const grossIncomeBs = estimatedBags * salePriceBs;
  const netProfitBs = grossIncomeBs - totalInvestmentBs;
  const marginPercentage = totalInvestmentBs > 0 ? ((netProfitBs / totalInvestmentBs) * 100).toFixed(1) : 0;

  let feasibility = {
    status: 'neutral',
    title: 'Esperando datos de simulación',
    message: 'Introduce los valores del lote. Los costos de empaque se toman automáticamente de tu stock real.',
    color: 'bg-gray-50 border-gray-200 text-gray-600',
    icon: <Calculator size={24} className="text-gray-400" />
  };

  if (pCost > 0 && pGrams > 0 && gPerBag > 0 && sPriceEur > 0) {
    if (totalInvestmentBs > capital) {
      feasibility = {
        status: 'danger', title: 'Inviable: Capital Insuficiente',
        message: 'La inversión total estimada supera el saldo disponible. Reduce el volumen.',
        color: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle size={24} className="text-red-600" />
      };
    } else if (netProfitBs <= 0) {
      feasibility = {
        status: 'danger', title: 'Proyección en Pérdida',
        message: 'Los costos superan los ingresos esperados. Incrementa el precio de venta en EUR.',
        color: 'bg-red-50 border-red-200 text-red-800', icon: <AlertTriangle size={24} className="text-red-600" />
      };
    } else {
      feasibility = {
        status: 'safe', title: 'Lote Seguro',
        message: 'Excelente proyección basada en tus costos reales de stock.',
        color: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle2 size={24} className="text-green-600" />
      };
    }
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto mb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-brandBlue text-white rounded-xl"><Calculator size={24} /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Simulador de Producción</h2>
          <p className="text-sm text-gray-500">Cálculo de empaque extraído del stock real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-brandBlue flex items-center gap-2 border-b pb-2"><Package size={18} /> Costos e Insumos base</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Maní (Bs)</label>
              <input type="number" className="w-full p-2.5 border rounded-lg focus:ring-1" value={peanutCost} onChange={(e) => setPeanutCost(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gramos Totales</label>
              <input type="number" className="w-full p-2.5 border rounded-lg focus:ring-1" value={peanutGrams} onChange={(e) => setPeanutGrams(e.target.value)} />
            </div>
          </div>

          <h3 className="font-bold text-brandBlue flex items-center gap-2 border-b pb-2 pt-2"><DollarSign size={18} /> Empaque y Precio de Venta</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bolsa del Stock</label>
              <select className="w-full p-2.5 border rounded-lg bg-white text-sm" value={selectedBagId} onChange={(e) => setSelectedBagId(e.target.value)}>
                {bagsInStock.map(b => <option key={b.id} value={b.id}>{b.name} (Costo: {(b.totalCostBs/b.quantity).toFixed(2)} Bs)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sticker del Stock</label>
              <select className="w-full p-2.5 border rounded-lg bg-white text-sm" value={selectedStickerId} onChange={(e) => setSelectedStickerId(e.target.value)}>
                {stickersInStock.map(s => <option key={s.id} value={s.id}>{s.name} (Costo: {(s.totalCostBs/s.quantity).toFixed(2)} Bs)</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gramos x Bolsa</label>
              <input type="number" className="w-full p-2.5 border rounded-lg" value={gramsPerBag} onChange={(e) => setGramsPerBag(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Venta (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">€</span>
                <input type="number" className="w-full p-2.5 pl-7 border border-brandBlue bg-blue-50 text-brandBlue font-bold rounded-lg" value={salePriceEur} onChange={(e) => setSalePriceEur(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ... [El bloque de la derecha (Panel de Resultados) se mantiene exactamente igual] ... */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className={`p-4 rounded-xl border flex gap-3 mb-6 ${feasibility.color}`}>
              <div className="mt-0.5">{feasibility.icon}</div>
              <div>
                <h4 className="font-bold text-sm">{feasibility.title}</h4>
                <p className="text-xs opacity-90">{feasibility.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Rendimiento</p>
                <p className="text-xl font-black">{estimatedBags} <span className="text-xs font-normal">Bolsas</span></p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Precio Unitario</p>
                <p className="text-xl font-extrabold">{salePriceBs.toFixed(2)} Bs</p>
              </div>

              <div className="col-span-2 border-t border-gray-200 my-1"></div>

              <div>
                <p className="text-xs font-bold text-red-500 uppercase mb-0.5">Inversión Total</p>
                <CurrencyDisplay amountBs={totalInvestmentBs} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-500 uppercase mb-0.5">Ingreso Bruto</p>
                <CurrencyDisplay amountBs={grossIncomeBs} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-brandBlue rounded-xl text-white flex justify-between items-center shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-0.5">Ganancia Neta</p>
              <span className="font-black text-2xl">{netProfitBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
              <p className="text-xs opacity-75 mt-0.5">€ {(netProfitBs / exchangeRate).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-0.5">Margen ROI</p>
              <span className="font-black text-2xl">{marginPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { exchangeRate } = useGlobalContext(); // Escuchamos la tasa real

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-0 md:flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brandBlue text-white min-h-screen p-6">
        <div className="mb-2">
          <h2 className="text-2xl font-bold">Crunchy Club</h2>
          {/* TASA VISIBLE EN DESKTOP */}
          <span className="text-xs bg-brandBlueLight text-blue-100 px-2 py-1 rounded-md block mt-1 font-medium">
            Tasa: 1 € = {exchangeRate.toFixed(2)} Bs
          </span>
        </div>
        
        <nav className="flex flex-col gap-4 flex-1 mt-6">
          <button onClick={() => setCurrentView('dashboard')} className="text-left font-semibold flex items-center gap-2"><TrendingUp size={20}/> Dashboard</button>
          <button onClick={() => setCurrentView('sales')} className="text-left font-semibold flex items-center gap-2"><Users size={20}/> Ventas</button>
          <button onClick={() => setCurrentView('inventory')} className="text-left font-semibold flex items-center gap-2"><Box size={20}/> Inventario</button>
          <button onClick={() => setCurrentView('production')} className="text-left font-semibold flex items-center gap-2"><Factory size={20}/> Producción</button>
          <button onClick={() => setCurrentView('simulator')} className="text-left font-semibold flex items-center gap-2"><Calculator size={20}/> Simulador</button>
        </nav>
        
        <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-red-300 hover:text-red-100 font-bold transition-colors pt-4 border-t border-brandBlueLight">
          <LogOut size={20} /> Salir del Sistema
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        {/* Header Mobile */}
        <header className="flex justify-between items-center mb-6 md:hidden bg-white p-3 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-xl font-bold text-brandBlue">Crunchy Club</h1>
            {/* TASA VISIBLE EN MÓVIL */}
            <span className="text-[11px] font-bold text-gray-500 block">
              1 € = {exchangeRate.toFixed(2)} Bs
            </span>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 bg-red-50 rounded-full">
            <LogOut size={20} />
          </button>
        </header>

        <AlertBanner />
        
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'sales' && <SalesModule />}
        {currentView === 'inventory' && <InventoryModule />}
        {currentView === 'production' && <ProductionModule />}
        {currentView === 'simulator' && <InvestmentSimulator />}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 md:hidden z-40">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center ${currentView === 'dashboard' ? 'text-brandBlue' : 'text-gray-400'}`}>
          <TrendingUp size={22} /> <span className="text-[10px] font-bold mt-1">Panel</span>
        </button>
        <button onClick={() => setCurrentView('sales')} className={`flex flex-col items-center ${currentView === 'sales' ? 'text-brandBlue' : 'text-gray-400'}`}>
          <Users size={22} /> <span className="text-[10px] font-bold mt-1">Ventas</span>
        </button>
        <button onClick={() => setCurrentView('inventory')} className={`flex flex-col items-center ${currentView === 'inventory' ? 'text-brandBlue' : 'text-gray-400'}`}>
          <Box size={22} /> <span className="text-[10px] font-bold mt-1">Stock</span>
        </button>
        <button onClick={() => setCurrentView('production')} className={`flex flex-col items-center ${currentView === 'production' ? 'text-brandBlue' : 'text-gray-400'}`}>
          <Factory size={22} /> <span className="text-[10px] font-bold mt-1">Armar</span>
        </button>
        <button onClick={() => setCurrentView('simulator')} className={`flex flex-col items-center ${currentView === 'simulator' ? 'text-brandBlue' : 'text-gray-400'}`}>
          <Calculator size={22} /> <span className="text-[10px] font-bold mt-1">Simular</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <GlobalProvider>
      {isAuthenticated 
        ? <MainApp onLogout={() => setIsAuthenticated(false)} /> 
        : <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      }
    </GlobalProvider>
  );
}