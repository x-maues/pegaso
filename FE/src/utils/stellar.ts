import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc as StellarRpc } from '@stellar/stellar-sdk';

// Testnet configuration
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

// Initialize Horizon server
export const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// Initialize Soroban server (for contract calls)
export const sorobanServer = new StellarRpc.Server(SOROBAN_RPC_URL);

// Helper to format balance
export function formatBalance(balance: string): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(parseFloat(balance));
}
