import { useEffect, useState, useCallback } from 'react';
import { isConnected, getPublicKey, setAllowed } from '@stellar/freighter-api';

const STORAGE_KEY = 'pegaso_wallet_connected';

export function useFreighterConnection() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAndConnect = useCallback(async (silent: boolean = true) => {
    if (!silent) setIsConnecting(true);
    setError(null);
    
    try {
      // First check if already connected (silent if previously allowed)
      const connected = await isConnected();
      
      if (connected) {
        const pubKey = await getPublicKey();
        setAddress(pubKey);
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      } else {
        // If not connected but we have persisted flag → try to reconnect
        const wasPreviouslyConnected = localStorage.getItem(STORAGE_KEY) === 'true';
        
        if (wasPreviouslyConnected && !silent) {
          // Request connection (usually silent if dApp is still allowed in Freighter)
          await setAllowed();
          const pubKey = await getPublicKey();
          setAddress(pubKey);
          localStorage.setItem(STORAGE_KEY, 'true');
          return true;
        }
      }
      
      return false;
    } catch (err: any) {
      console.error('Freighter connection check failed:', err);
      if (!silent) {
        setError(err.message || 'Connection failed');
      }
      // Only clear on explicit user rejection, not on silent checks
      if (err.message?.includes('User declined')) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    // Run on mount (page load/refresh) - silent check
    checkAndConnect(true);
  }, [checkAndConnect]);

  const manualConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await setAllowed();
      const pubKey = await getPublicKey();
      setAddress(pubKey);
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err: any) {
      console.error('Manual connect failed:', err);
      setError(err.message || 'Failed to connect');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
    // Freighter doesn't have explicit dApp disconnect API yet, but clearing flag works
  }, []);

  return { 
    address, 
    isConnecting, 
    error,
    manualConnect, 
    disconnect,
    refresh: () => checkAndConnect(false)
  };
}
