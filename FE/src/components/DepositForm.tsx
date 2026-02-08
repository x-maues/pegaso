import { useState } from 'react';

interface DepositFormProps {
  isConnected: boolean;
  onConnectClick?: () => void;
}

export function DepositForm({ isConnected, onConnectClick }: DepositFormProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      onConnectClick?.();
      return;
    }
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      return;
    }
    console.log('Deposit amount:', value);
  };

  return (
    <div className="bg-[#111]/80 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/10">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Deposit</h3>
      <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        Deposit assets into the vault. Connect your wallet and enter an amount.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="number"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            disabled={!isConnected}
            aria-label="Amount to deposit"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-[#2DD4BF] hover:bg-[#26baa8] text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2DD4BF] uppercase tracking-wider text-sm"
          disabled={!isConnected && !onConnectClick}
        >
          {isConnected ? 'Deposit' : 'Connect wallet to deposit'}
        </button>
      </form>
    </div>
  );
}
