import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, WasteLog, ActualOrder, calculateContextualFactors, ContextualFactor, SAMPLE_PRODUCTS, SAMPLE_LOGS } from '../logic/LearningEngine';
import { getCurrentLocationWeather, WeatherType, WEATHER_TYPES } from '../logic/WeatherService';

interface AppContextProps {
  products: Product[];
  wasteLogs: WasteLog[];
  actualOrders: ActualOrder[];
  storeConfig: any;
  weatherContext: { dayId: string; weatherId: string; weather?: WeatherType; dayType?: any };
  contextualFactors: Record<number, ContextualFactor>;
  apiStatus: 'loading' | 'success' | 'error' | 'manual';

  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setWasteLogs: React.Dispatch<React.SetStateAction<WasteLog[]>>;
  setStoreConfig: React.Dispatch<React.SetStateAction<any>>;
  setWeatherId: (id: string) => void;
  refreshWeather: () => Promise<void>;
  addWasteLog: (log: Omit<WasteLog, 'id'>) => Promise<void>;
  addActualOrder: (order: Omit<ActualOrder, 'id'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const STORAGE_KEYS = {
  products: '@sg_products_v3',
  logs: '@sg_logs_v3',
  config: '@sg_config_v3',
  orders: '@sg_orders_v1',
};

const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [actualOrders, setActualOrders] = useState<ActualOrder[]>([]);
  const [storeConfig, setStoreConfig] = useState({ name: '○○店', setupDone: false });
  const [weatherId, setWeatherStateId] = useState('cloudy');
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [isReady, setIsReady] = useState(false);

  const todayDayId = DAY_IDS[new Date().getDay()];

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem(STORAGE_KEYS.products);
        const storedLogs = await AsyncStorage.getItem(STORAGE_KEYS.logs);
        const storedConfig = await AsyncStorage.getItem(STORAGE_KEYS.config);

        if (storedProducts && storedProducts !== '[]') {
          setProducts(JSON.parse(storedProducts));
        } else {
          setProducts(SAMPLE_PRODUCTS);
        }
        
        if (storedLogs && storedLogs !== '[]') {
          setWasteLogs(JSON.parse(storedLogs));
        } else {
          setWasteLogs(storedProducts ? [] : SAMPLE_LOGS);
        }

        if (storedConfig) {
          setStoreConfig(JSON.parse(storedConfig));
        }

        const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.orders);
        if (storedOrders) {
          setActualOrders(JSON.parse(storedOrders));
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsReady(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(wasteLogs));
    AsyncStorage.setItem(STORAGE_KEYS.config, JSON.stringify(storeConfig));
    AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(actualOrders));
  }, [products, wasteLogs, storeConfig, actualOrders, isReady]);

  const refreshWeather = async () => {
    setApiStatus('loading');
    try {
      const result = await getCurrentLocationWeather();
      setWeatherStateId(result.weatherType.id);
      setApiStatus('success');
    } catch (e) {
      console.error(e);
      setApiStatus('error');
    }
  };

  useEffect(() => {
    refreshWeather();
  }, []);

  const setWeatherId = (id: string) => {
    setWeatherStateId(id);
    setApiStatus('manual');
  };

  const weatherContext = {
    dayId: todayDayId,
    weatherId: weatherId,
    weather: WEATHER_TYPES.find(w => w.id === weatherId),
    dayType: { id: todayDayId, label: ['日', '月', '火', '水', '木', '金', '土'][new Date().getDay()] }
  };

  const contextualFactors = calculateContextualFactors(products, wasteLogs, weatherContext);

  const addWasteLog = async (log: Omit<WasteLog, 'id'>) => {
    const newLog = { ...log, id: Date.now() };
    setWasteLogs(prev => [newLog, ...prev]);
  };

  const addActualOrder = async (order: Omit<ActualOrder, 'id'>) => {
    const newOrder = { ...order, id: Date.now() };
    setActualOrders(prev => [newOrder, ...prev]);
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = async (id: number, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
  };

  const deleteProduct = async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AppContext.Provider value={{
      products, wasteLogs, actualOrders, storeConfig, weatherContext, contextualFactors, apiStatus,
      setProducts, setWasteLogs, setStoreConfig, setWeatherId, refreshWeather,
      addWasteLog, addActualOrder, addProduct, updateProduct, deleteProduct
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
