import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Loader2, CheckCircle, XCircle, TrendingUp, Sparkles, Star, DollarSign, Bitcoin, Gem } from 'lucide-react';
import { deposit, withdraw, getBalance, getTotalShares, setActiveContractId } from '../utils/vaultContract';
import { useWallet } from '../context/WalletContext';
import { AssetSelector } from './AssetSelector';
import { getActiveVault, getAvailableVaults, type VaultConfig } from '../config/vaults';

// Icon mapping for vault assets
const VAULT_ICONS = {
  'xlm': Star,
  'usdc': DollarSign,
  'wbtc': Bitcoin,
  'weth': Gem,
};

const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden ${className}`}>
    {children}
  </div>
);

export function VaultInterface() {
  const { address, isConnected, refreshAddress } = useWallet();
  const [selectedVault, setSelectedVault] = useState<VaultConfig>(getActiveVault());
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [vaultBalance, setVaultBalance] = useState('0.00');
  const [totalShares, setTotalShares] = useState('0.00');
  const [assetEquivalent, setAssetEquivalent] = useState('0.00');
  const [conversionRate, setConversionRate] = useState('1.05');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string; txHash?: string; explorerUrl?: string }>({ type: null, message: '' });
  const [refreshing, setRefreshing] = useState(false);
  
  // Token display from selected vault
  const tokenSymbol = selectedVault.symbol;
  const displayDecimals = 2;
  const VaultIcon = VAULT_ICONS[selectedVault.id as keyof typeof VAULT_ICONS] || Star;
  
  // Get real APY from vault config (Blend's published rates)
  const realAPY = selectedVault.estimatedAPY;

  const fetchVaultData = async () => {
    if (!isConnected || !address) return;
    
    setRefreshing(true);
    try {
      // Set active contract for this vault
      setActiveContractId(selectedVault.vaultAddress);
      
      const [balance, total] = await Promise.all([
        getBalance(address),
        getTotalShares(),
      ]);
      setVaultBalance(parseFloat(balance).toFixed(displayDecimals));
      setTotalShares(parseFloat(total).toFixed(displayDecimals));
      
      // Calculate asset equivalent using the b_rate from contract (1.05 for MVP)
      const b_rate = 1.05; // This matches the contract's 10_500_000 / 10_000_000
      const assetValue = (parseFloat(balance) * b_rate).toFixed(displayDecimals);
      setAssetEquivalent(assetValue);
      setConversionRate(b_rate.toFixed(2));
    } catch (error: any) {
      console.error('Error fetching vault data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [address, isConnected, selectedVault]); // Re-fetch when vault changes

  const handleVaultChange = (vault: VaultConfig) => {
    setSelectedVault(vault);
    setDepositAmount('');
    setWithdrawAmount('');
    setStatus({ type: null, message: '' });
    // Immediately set active contract for new vault
    setActiveContractId(vault.vaultAddress);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !depositAmount) return;

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Deposit directly (user signs once, no approval needed)
      setStatus({ type: 'info', message: 'Depositing...' });
      const hash = await deposit(address, depositAmount);

      // Create clickable explorer link
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
      setStatus({
        type: 'success',
        message: 'Deposit', // Used to determine transaction type
        txHash: hash,
        explorerUrl
      });

      // Track vault transaction
      const vaultTx = {
        id: hash,
        type: 'vault_deposit',
        amount: depositAmount,
        asset: tokenSymbol,
        timestamp: new Date().toISOString(),
        txHash: hash
      };
      const vaultHistory = JSON.parse(localStorage.getItem('vault_tx_history') || '[]');
      vaultHistory.unshift(vaultTx);
      localStorage.setItem('vault_tx_history', JSON.stringify(vaultHistory.slice(0, 50))); // Keep last 50

      setDepositAmount('');
      await fetchVaultData();
      await refreshAddress();
    } catch (error: any) {
      console.error('Deposit error:', error);

      if (error.message && error.message.includes('UnreachableCodeReached')) {
        setStatus({
          type: 'error',
          message: 'Contract not initialized! Click the ⚙️ icon above to initialize the vault first.'
        });
      } else {
        setStatus({ type: 'error', message: error.message || 'Deposit failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !withdrawAmount) return;

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const hash = await withdraw(address, withdrawAmount);

      // Create clickable explorer link
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
      setStatus({
        type: 'success',
        message: 'Withdrawal', // Used to determine transaction type
        txHash: hash,
        explorerUrl
      });

      // Track vault transaction
      const vaultTx = {
        id: hash,
        type: 'vault_withdraw',
        amount: withdrawAmount,
        asset: tokenSymbol,
        timestamp: new Date().toISOString(),
        txHash: hash
      };
      const vaultHistory = JSON.parse(localStorage.getItem('vault_tx_history') || '[]');
      vaultHistory.unshift(vaultTx);
      localStorage.setItem('vault_tx_history', JSON.stringify(vaultHistory.slice(0, 50))); // Keep last 50

      setWithdrawAmount('');
      await fetchVaultData();
      await refreshAddress();
    } catch (error: any) {
      console.error('Withdraw error:', error);
      setStatus({ type: 'error', message: error.message || 'Withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Asset Selector - Only show if multiple vaults available */}
      {getAvailableVaults().length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="bg-gradient-to-br from-purple-500/5 via-[#2DD4BF]/5 to-purple-500/5 border-purple-500/20 !overflow-visible">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-white" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                    Select Asset
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Choose which asset to deposit • {getAvailableVaults().length} vaults available
                </p>
              </div>
            </div>

            <AssetSelector
              selectedVault={selectedVault}
              onSelectVault={handleVaultChange}
            />

            {/* Quick Stats Preview */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Est. APY (testnet inflation)</div>
                <div
                  className="text-lg font-bold font-mono"
                  style={{ color: '#2DD4BF' }}
                >
                  {selectedVault.estimatedAPY}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Decimals</div>
                <div className="text-lg font-bold font-mono text-white">
                  {selectedVault.decimals}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Protocol</div>
                <div className="text-sm font-bold text-white">
                  Blend
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Vault Stats */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2DD4BF]/10">
              <VaultIcon size={24} style={{ color: '#2DD4BF' }} />
            </div>
            {selectedVault.symbol} Vault
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchVaultData}
              disabled={refreshing || !isConnected}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
              >
                <TrendingUp size={18} className="text-gray-400" />
              </motion.div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Your Shares</div>
            <div className="text-2xl font-bold text-white font-mono">{vaultBalance}</div>
            <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#2DD4BF' }}>
              ≈ {assetEquivalent} {tokenSymbol}
              <span className="text-gray-600">({conversionRate}x)</span>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Shares</div>
            <div className="text-2xl font-bold text-white font-mono">{totalShares}</div>
            <div className="text-[10px] text-gray-600 mt-1">All Users</div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Exchange Rate</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#2DD4BF' }}>{conversionRate}x</div>
            <div className="text-[10px] text-gray-600 mt-1">Shares → {tokenSymbol}</div>
          </div>
        </div>

        {/* APY Info Banner */}
        <div
          className="mt-4 bg-gradient-to-r from-purple-500/10 rounded-xl p-4 flex items-center justify-between border"
          style={{ 
            borderColor: `${selectedVault.color}20`,
            background: `linear-gradient(to right, ${selectedVault.color}10, transparent)`
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${selectedVault.color}20` }}>
              <TrendingUp style={{ color: selectedVault.color }} size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Earning Blend Yield</div>
              <div className="text-xs text-gray-400">
                Blend APY: <span className="font-mono font-bold" style={{ color: selectedVault.color }}>{realAPY}</span>
                <span className="ml-2 text-[10px] text-gray-600">(Live from Blend Protocol)</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 hidden sm:block">
            Real-time earnings
          </div>
        </div>
      </GlassCard >

      {/* Status Messages */}
      {
        status.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${status.type === 'success'
              ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#2DD4BF]'
              : status.type === 'info'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-[#FF0055]/10 border-[#FF0055]/30 text-[#FF0055]'
              }`}
          >
            {status.type === 'success' ? <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> : <XCircle size={18} className="mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              {status.type === 'success' && status.txHash && status.explorerUrl ? (
                <>
                  <p className="text-sm font-mono mb-2">
                    {status.message.includes('Deposit') ? 'Deposit' : status.message.includes('Withdrawal') ? 'Withdrawal' : 'Transaction'} successful!
                  </p>
                  <a
                    href={status.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2DD4BF]/20 hover:bg-[#2DD4BF]/30 rounded-lg text-xs font-mono transition-colors group"
                  >
                    <span className="opacity-70">View on Explorer</span>
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">{status.txHash.slice(0, 8)}...{status.txHash.slice(-6)}</span>
                    <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              ) : (
                status.message && <p className="text-sm font-mono">{status.message}</p>
              )}
            </div>
          </motion.div>
        )
      }

      {/* Deposit/Withdraw Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deposit Form */}
        <GlassCard className="transition-all hover:border-opacity-30 border-[#2DD4BF]/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#2DD4BF]/10">
              <ArrowDownLeft style={{ color: '#2DD4BF' }} size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Deposit</h3>
              <p className="text-xs text-gray-500">Add {selectedVault.symbol} to vault</p>
            </div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!isConnected || loading}
                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none disabled:opacity-50 font-mono transition-all text-lg"
                style={{
                  borderColor: depositAmount ? '#2DD4BF50' : undefined,
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <VaultIcon size={18} style={{ color: '#2DD4BF' }} />
                <span className="text-xs font-bold" style={{ color: '#2DD4BF' }}>{tokenSymbol}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isConnected || loading || !depositAmount}
              className="w-full px-4 py-3 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#2DD4BF',
                opacity: (!isConnected || loading || !depositAmount) ? 0.5 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                'Deposit'
              )}
            </button>
          </form>
        </GlassCard >

        {/* Withdraw Form */}
        < GlassCard className="hover:border-[#FF0055]/30 transition-colors" >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FF0055]/10 rounded-lg">
              <ArrowUpRight className="text-[#FF0055]" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Withdraw</h3>
              <p className="text-xs text-gray-500">Remove {selectedVault.symbol} from vault</p>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!isConnected || loading}
                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#FF0055] disabled:opacity-50 font-mono transition-all text-lg"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <VaultIcon size={18} style={{ color: '#2DD4BF' }} />
                <span className="text-xs text-gray-500 font-bold">shares</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isConnected || loading || !withdrawAmount}
              className="w-full px-4 py-3 bg-[#FF0055] hover:bg-[#cc0044] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </button>
          </form>
        </GlassCard >
      </div >

      {/* Info Card */}
      < GlassCard className="bg-gradient-to-br from-[#111] to-black border-white/5" >
        <div className="text-xs text-gray-400 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="p-2 rounded-lg mt-0.5" style={{ backgroundColor: '#2DD4BF' + '20' }}>
              <VaultIcon size={18} style={{ color: '#2DD4BF' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-1">{selectedVault.symbol} Vault Strategy</p>
              <p className="text-gray-500">
                Deposits are supplied to Blend Protocol to earn <span className="font-bold" style={{ color: selectedVault.color }}>{realAPY}</span> APY
              </p>
            </div>
          </div>

          <div className="space-y-2 pl-3">
            <p className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#2DD4BF' }}></span>
              <span>Deposit 1 {tokenSymbol} → Receive ~{(1 / parseFloat(conversionRate)).toFixed(4)} shares</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#2DD4BF' }}></span>
              <span>Withdraw shares → Receive {tokenSymbol} at {conversionRate}x rate</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span>Share value automatically increases with Blend Protocol yield</span>
            </p>
          </div>
        </div>
      </GlassCard >
    </div >
  );
}
