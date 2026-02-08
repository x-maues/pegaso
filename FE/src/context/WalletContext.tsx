import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { horizonServer, formatBalance } from '../utils/stellar';
import kit from '../utils/walletKit';

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
  const [isConnected, setIsConnected] = useState(false);

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
      const { address: addr } = await kit.getAddress();
      if (addr) {
        setAddress(addr);
        setIsConnected(true);
        console.log('Wallet connected:', addr);
        await fetchAccountData(addr);
      } else {
        setAddress('');
        setBalance('0');
        setAllBalances([]);
        setAccountData(null);
        setRecentPayments([]);
        setIsConnected(false);
      }
    } catch (e) {
      console.error("Error getting address from kit:", e);
      setAddress('');
      setBalance('0');
      setAllBalances([]);
      setAccountData(null);
      setRecentPayments([]);
      setIsConnected(false);
    }
  }, [fetchAccountData]);

  const disconnect = useCallback(() => {
    kit.disconnect();
    setAddress('');
    setBalance('0');
    setAllBalances([]);
    setAccountData(null);
    setRecentPayments([]);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Check if already connected on mount (restores session automatically)
    const restoreConnection = async () => {
      try {
        const { address: addr } = await kit.getAddress();
        if (addr) {
          setAddress(addr);
          setIsConnected(true);
          console.log('Restored wallet connection on mount:', addr);
          await fetchAccountData(addr);
        } else {
          console.log('No existing wallet connection');
        }
      } catch (error) {
        console.log('No existing wallet connection');
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
      isConnected,
      refreshAddress,
      disconnect,
    }),
    [address, balance, allBalances, recentPayments, accountData, isConnected, refreshAddress, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
