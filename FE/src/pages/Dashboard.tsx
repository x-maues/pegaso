import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import {
  LogOut, ExternalLink, Activity, Copy, ChevronRight, Zap
} from 'lucide-react';
import { formatAddress } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { VaultInterface } from '../components/VaultInterface';

// --- UI Components ---

const GlassCard = ({ children, className = "", delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-white/20 transition-colors ${className}`}
  >
    {children}
  </motion.div>
);

const AssetRow = ({ code, balance, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group cursor-default"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center font-bold text-xs text-white/50 group-hover:text-white group-hover:border-white/30 transition-all">
        {code[0]}
      </div>
      <div>
        <div className="font-bold text-sm tracking-wide">{code}</div>
        <div className="text-[10px] font-mono text-gray-500 uppercase">Stellar Asset</div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-mono font-bold">{balance}</div>
      <div className="text-[10px] text-gray-500">$0.00 USD</div>
    </div>
  </motion.div>
);

const TransactionItem = ({ type, amount, date, asset, txHash }: any) => {
  const isIn = type === 'received' || type === 'vault_deposit';
  const isVault = type === 'vault_deposit' || type === 'vault_withdraw';
  const isContractCall = type === 'contract_call';

  const getLabel = () => {
    if (type === 'vault_deposit') return 'Vault Deposit';
    if (type === 'vault_withdraw') return 'Vault Withdraw';
    if (type === 'contract_call') return 'Contract Call';
    return isIn ? 'Received' : 'Sent';
  };

  const getDescription = () => {
    if (type === 'vault_deposit') return 'Supplied to Blend Protocol';
    if (type === 'vault_withdraw') return 'Withdrawn from Blend';
    if (type === 'contract_call') return 'Smart contract invocation';
    return isIn ? 'From external wallet' : 'To external wallet';
  };

  const getColor = () => {
    if (isContractCall) return 'text-[#2DD4BF]/80'; // Lighter teal for contract calls
    if (isVault) return type === 'vault_deposit' ? 'text-[#2DD4BF]' : 'text-gray-400'; // Teal for deposits, gray for withdrawals
    return isIn ? 'text-[#2DD4BF]' : 'text-gray-400'; // Teal for received, gray for sent
  };

  const getDotColor = () => {
    if (isContractCall) return 'bg-[#2DD4BF]/80'; // Lighter teal for contract calls
    if (isVault) return type === 'vault_deposit' ? 'bg-[#2DD4BF]' : 'bg-gray-500'; // Teal for deposits, gray for withdrawals
    return isIn ? 'bg-[#2DD4BF]' : 'bg-gray-500'; // Teal for received, gray for sent
  };

  return (
    <motion.div
      layout
      className="relative pl-6 py-4 border-l border-white/10 hover:border-[#2DD4BF] transition-colors group"
    >
      <div className={`absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${getDotColor()} group-hover:scale-125 transition-transform`} />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${getColor()}`}>
              {getLabel()}
            </span>
            <span className="text-[10px] text-gray-600 font-mono">{date}</span>
          </div>
          <div className="text-sm text-gray-300">
            {getDescription()}
          </div>
          {txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-gray-600 hover:text-[#2DD4BF] transition-colors flex items-center gap-1"
            >
              {txHash.slice(0, 8)}...{txHash.slice(-6)} <ExternalLink size={10} />
            </a>
          )}
        </div>
        <div className="text-right font-mono text-sm">
          <div className="font-bold text-white">
            {isContractCall ? (
              <span className="text-[#2DD4BF]/80">{amount}</span>
            ) : (
              <>{isIn ? '+' : '-'}{amount} {asset}</>
            )}
          </div>
          <div className="text-[10px] text-gray-500">Confirmed</div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Dashboard ---

export function UserDashboard() {
  const { address, balance, allBalances, recentPayments, accountData, isConnected, disconnect } = useWallet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [vaultTransactions, setVaultTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  useEffect(() => {
    // Load vault transactions from localStorage
    const vaultHistory = JSON.parse(localStorage.getItem('vault_tx_history') || '[]');
    setVaultTransactions(vaultHistory);
  }, []);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const assets = allBalances.map(b => ({
    code: b.asset_type === 'native' ? 'XLM' : b.asset_code,
    balance: parseFloat(b.balance).toFixed(2)
  }));

  // Mock data filling for visual completeness if wallet is empty
  const displayAssets = assets.length > 0 ? assets : [{ code: 'XLM', balance: '0.00' }];

  // Combine and sort all transactions
  const allTransactions = address ? [
    ...recentPayments.map(tx => {
      const amount = parseFloat(tx.amount);
      const isContractCall = isNaN(amount) || amount === 0;

      return {
        id: tx.id,
        type: isContractCall ? 'contract_call' : (tx.to === address ? 'received' : 'sent'),
        amount: isContractCall ? '—' : amount.toFixed(2),
        asset: isContractCall ? 'SOROBAN' : (tx.asset_type === 'native' ? 'XLM' : (tx.asset_code || 'TOKEN')),
        date: new Date(tx.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: new Date(tx.created_at).getTime(),
        txHash: (tx as any).transaction_hash || tx.id
      };
    }),
    ...vaultTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount).toFixed(2),
      asset: tx.asset,
      date: new Date(tx.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: new Date(tx.timestamp).getTime(),
      txHash: tx.txHash
    }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10) : []; // Show last 10 transactions

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#FF0055]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#2DD4BF]/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 min-h-screen flex flex-col lg:flex-row gap-4 sm:gap-6">

        {/* --- LEFT COLUMN: CONTROLLER --- */}
        <aside className="w-full lg:w-[380px] xl:w-[400px] flex flex-col gap-4 sm:gap-6 shrink-0">

          {/* Identity Card */}
          <GlassCard className="!p-8 bg-gradient-to-b from-[#111] to-black">
            <div className="flex justify-between items-start mb-8">
              {/* Logo/Branding - consistent with landing page */}
              <a href="/" className="flex flex-col leading-none cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-2xl tracking-tighter">pegaso</span>
              </a>
              <button
                onClick={() => { disconnect(); navigate('/'); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
              >
                <LogOut size={18} />
              </button>
            </div>

            <div className="space-y-1 mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-widest">Total Balance</h2>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                  {Math.floor(parseFloat(balance.replace(/,/g, '')))}
                </span>
                <span className="text-xl sm:text-2xl font-light text-gray-400">
                  .{balance.replace(/,/g, '').split('.')[1] || '00'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-gray-400">XLM</span>
              </div>
            </div>

            <div
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-all group"
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2DD4BF] animate-pulse' : 'bg-red-500'}`} />
              <span className="font-mono text-xs text-gray-400 group-hover:text-white truncate flex-1">
                {formatAddress(address)}
              </span>
              {copied ? <span className="text-[10px] text-[#2DD4BF]">COPIED</span> : <Copy size={14} className="text-gray-600 group-hover:text-white" />}
            </div>
          </GlassCard>

          {/* Activity Feed - All transactions */}
          <GlassCard className="flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Activity size={12} /> Recent Activity
            </h3>
            <div className="flex-1 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
            }}>
              {allTransactions.length > 0 ? (
                <div className="space-y-2">
                  {allTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      type={tx.type}
                      amount={tx.amount}
                      asset={tx.asset}
                      date={tx.date}
                      txHash={tx.txHash}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 gap-4 py-8">
                  <Activity size={32} strokeWidth={1} />
                  <p className="font-mono text-xs uppercase tracking-widest">No Activity</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Network Status / Info */}
          <GlassCard className="mt-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Zap size={12} /> Network Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-400">Trustlines</span>
                <span className="font-mono text-white">{accountData?.subentry_count || 0} / 100</span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2DD4BF]"
                  style={{ width: `${(accountData?.subentry_count || 0)}%` }}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-600 font-mono pt-2 gap-1">
                <span>STELLAR TESTNET</span>
                <span className="flex items-center gap-1 text-[#2DD4BF]">ONLINE <div className="w-1 h-1 bg-[#2DD4BF] rounded-full" /></span>
              </div>
              <p className="text-[10px] text-gray-600 italic pt-2 border-t border-white/5">* Live data from Horizon API</p>
            </div>
          </GlassCard>
        </aside>


        {/* --- RIGHT COLUMN: DATA STREAM --- */}
        <main className="flex-1 flex flex-col gap-4 sm:gap-6 pb-8 lg:pb-20">

          {/* Vault Interface Section */}
          <VaultInterface />

          {/* Portfolio Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Portfolio</h2>
              <button className="text-xs font-mono text-[#2DD4BF] hover:underline flex items-center gap-1">
                Manage <ChevronRight size={12} />
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-2">
              {displayAssets.map((asset, i) => (
                <AssetRow key={i} code={asset.code} balance={asset.balance} delay={i * 0.1} />
              ))}
            </div>
          </div>

        </main>


      </div>
    </div >
  );
}