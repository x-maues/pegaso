import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { horizonServer, formatBalance } from '../utils/stellar';
import { isConnected, getAddress } from '@stellar/freighter-api';

const STORAGE_KEY = 'pegaso_wallet_connected';

interface Balance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface Payment {
  id: string;
  type: string;
  created_at: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
}

interface AccountData {
  subentry_count: number;
  num_sponsored: number;
  num_sponsoring: number;
  sequence: string;
}

interface WalletContextValue {
  address: string;
  balance: string;
  allBalances: Balance[];
  recentPayments: Payment[];
  accountData: AccountData | null;
  isConnected: boolean;
  isLoading: boolean;
  refreshAddress: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [allBalances, setAllBalances] = useState<Balance[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isConnectedState, setIsConnectedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountData = useCallback(async (addr: string) => {
    try {
      console.log('Fetching account from Horizon...');
      const account = await horizonServer.loadAccount(addr);
      console.log('Account loaded:', account);

      setAllBalances(account.balances as Balance[]);

      const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
      if (nativeBalance) {
        console.log('Native balance found:', nativeBalance.balance);
        setBalance(formatBalance(nativeBalance.balance));
      } else {
        setBalance('0');
      }

      setAccountData({
        subentry_count: account.subentry_count,
        num_sponsored: account.num_sponsored,
        num_sponsoring: account.num_sponsoring,
        sequence: account.sequence,
      });

      try {
        const paymentsResponse = await horizonServer
          .payments()
          .forAccount(addr)
          .order('desc')
          .limit(5)
          .call();

        setRecentPayments(paymentsResponse.records as Payment[]);
        console.log('Recent payments:', paymentsResponse.records);
      } catch (paymentError) {
        console.error('Error fetching payments:', paymentError);
        setRecentPayments([]);
      }

    } catch (error: any) {
      console.error("Error fetching balance:", error);
      if (error.response && error.response.status === 404) {
        console.warn("Account not found on network (unfunded).");
      }
      setBalance('0');
      setAllBalances([]);
      setAccountData(null);
      setRecentPayments([]);
    }
  }, []);

  const refreshAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      const connected = await isConnected();
      
      if (connected) {
        const { address: pubKey } = await getAddress();
        setAddress(pubKey);
        setIsConnectedState(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        console.log('Wallet connected:', pubKey);
        await fetchAccountData(pubKey);
      } else {
        setAddress('');
        setBalance('0');
        setAllBalances([]);
        setAccountData(null);
        setRecentPayments([]);
        setIsConnectedState(false);
      }
    } catch (e) {
      console.error("Error getting address from Freighter:", e);
      setAddress('');
      setBalance('0');
      setAllBalances([]);
      setAccountData(null);
      setRecentPayments([]);
      setIsConnectedState(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountData]);

  const disconnect = useCallback(() => {
    setAddress('');
    setBalance('0');
    setAllBalances([]);
    setAccountData(null);
    setRecentPayments([]);
    setIsConnectedState(false);
    localStorage.removeItem(STORAGE_KEY);
    console.log('Wallet disconnected');
  }, []);

  useEffect(() => {
    // Check if already connected on mount (restores session automatically)
    const restoreConnection = async () => {
      try {
        const wasPreviouslyConnected = localStorage.getItem(STORAGE_KEY) === 'true';
        
        if (wasPreviouslyConnected) {
          console.log('Found stored wallet session, attempting to restore...');
          
          // Check if Freighter is still connected
          const connected = await isConnected();
          
          if (connected) {
            const { address: pubKey } = await getAddress();
            setAddress(pubKey);
            setIsConnectedState(true);
            console.log('Restored wallet connection on mount:', pubKey);
            await fetchAccountData(pubKey);
          } else {
            console.log('Freighter not connected, clearing stored session');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.log('No existing wallet connection');
        }
      } catch (error) {
        console.log('Error restoring connection:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreConnection();
  }, [fetchAccountData]);

  const value = useMemo(
    () => ({
      address,
      balance,
      allBalances,
      recentPayments,
      accountData,
      isConnected: isConnectedState,
      isLoading,
      refreshAddress,
      disconnect,
    }),
    [address, balance, allBalances, recentPayments, accountData, isConnectedState, isLoading, refreshAddress, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
