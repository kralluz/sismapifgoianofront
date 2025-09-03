import { useEffect, useState } from 'react';

interface CacheData {
  mapData: any;
  routes: any[];
  lastUpdated: number;
}

export const useOfflineCache = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheData, setCacheData] = useState<CacheData | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveToCache = async (data: Omit<CacheData, 'lastUpdated'>) => {
    const cacheData: CacheData = {
      ...data,
      lastUpdated: Date.now()
    };
    localStorage.setItem('sismap-cache', JSON.stringify(cacheData));
    setCacheData(cacheData);
  };

  const loadFromCache = () => {
    const cached = localStorage.getItem('sismap-cache');
    if (cached) {
      const data = JSON.parse(cached);
      setCacheData(data);
      return data;
    }
    return null;
  };

  useEffect(() => {
    loadFromCache();
  }, []);

  return {
    isOnline,
    cacheData,
    saveToCache,
    loadFromCache
  };
};