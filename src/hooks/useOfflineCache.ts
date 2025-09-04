import { useEffect, useState } from 'react';

interface CacheData {
  mapData: any;
  routes: any[];
  lastUpdated: number;
}

export const useOfflineCache = () => {
  // Use a simpler initialization to avoid any potential issues
  const [isOnline, setIsOnline] = useState(true);
  const [cacheData, setCacheData] = useState<CacheData | null>(null);

  // Initialize online status after component mounts
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
  }, []);

  useEffect(() => {
    // Only add event listeners if we're in a browser environment
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const saveToCache = async (data: Omit<CacheData, 'lastUpdated'>) => {
    try {
      const cacheData: CacheData = {
        ...data,
        lastUpdated: Date.now()
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sismap-cache', JSON.stringify(cacheData));
        setCacheData(cacheData);
      }
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  };

  const loadFromCache = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('sismap-cache');
        if (cached) {
          const data = JSON.parse(cached);
          setCacheData(data);
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return null;
  };

  useEffect(() => {
    // Load cache data on component mount
    if (typeof window !== 'undefined') {
      loadFromCache();
    }
  }, []);

  return {
    isOnline,
    cacheData,
    saveToCache,
    loadFromCache
  };
};