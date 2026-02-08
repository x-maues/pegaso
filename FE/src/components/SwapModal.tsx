import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { swapXLMtoAQUA, swapXLMtoUSDC } from '../utils/aquariusSwap';

interface SwapModalProps {
    onClose: () => void;
    userAddress: string;
    availableBalance: number;
}

export function SwapModal({ onClose, userAddress, availableBalance }: SwapModalProps) {
    const [amount, setAmount] = useState('');
    const [toAsset, setToAsset] = useState<'AQUA' | 'USDC'>('AQUA');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');

    const handleSwap = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (parseFloat(amount) > availableBalance) {
            setError('Insufficient balance');
            return;
        }

        setLoading(true);
        setError('');
        setTxHash('');

        try {
            const hash = toAsset === 'AQUA' 
                ? await swapXLMtoAQUA(userAddress, amount)
                : await swapXLMtoUSDC(userAddress, amount);

            setTxHash(hash);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err: any) {
            console.error('Swap error:', err);
            setError(err.message || 'Swap failed');
        } finally {
            setLoading(false);
        }
    };

    const assetColors = {
        AQUA: '#00C9FF',
        USDC: '#2775CA',
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full relative"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                        Token Swap
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Available Balance */}
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-widest font-mono">Available to Swap</div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {availableBalance.toFixed(2)} <span className="text-[#2DD4BF]">XLM</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest font-mono">
                        Amount to Swap
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            disabled={loading}
                            className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2DD4BF] disabled:opacity-50 font-mono"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2DD4BF] font-bold">
                            XLM
                        </div>
                    </div>
                    <button
                        onClick={() => setAmount(availableBalance.toString())}
                        className="mt-2 text-xs text-[#2DD4BF] hover:underline font-mono"
                    >
                        Use max
                    </button>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center my-4">
                    <ArrowRight className="text-gray-600" size={24} />
                </div>

                {/* Target Asset */}
                <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest font-mono">
                        Swap To
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setToAsset('AQUA')}
                            disabled={loading}
                            className={`p-4 rounded-xl border transition-all ${
                                toAsset === 'AQUA'
                                    ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="font-bold text-white text-sm mb-1">AQUA</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Aquarius Token</div>
                        </button>
                        <button
                            onClick={() => setToAsset('USDC')}
                            disabled={loading}
                            className={`p-4 rounded-xl border transition-all ${
                                toAsset === 'USDC'
                                    ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="font-bold text-white text-sm mb-1">USDC</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">USD Coin</div>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-xl p-4 mb-4"
                        >
                            <div className="font-bold mb-1 text-[#FF0055] text-sm uppercase tracking-wide font-mono">Swap Failed</div>
                            <div className="text-xs text-gray-300 font-mono">{error}</div>
                            {error.includes('testnet') && (
                                <div className="mt-2 text-xs text-amber-400 font-mono">
                                    Note: Feature works on mainnet with active pools
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                    {txHash && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 rounded-xl p-4 mb-4"
                        >
                            <div className="flex items-center gap-2 text-[#2DD4BF] font-bold mb-2 uppercase tracking-wide font-mono text-sm">
                                <CheckCircle size={18} />
                                Swap Successful
                            </div>
                            <a
                                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                            >
                                View Transaction <ExternalLink size={12} />
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Swap Button */}
                <button
                    onClick={handleSwap}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                    className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[#2DD4BF] hover:bg-[#25b5a3] text-black uppercase tracking-wide"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Swapping...
                        </>
                    ) : (
                        `Swap XLM to ${toAsset}`
                    )}
                </button>

                {/* Info */}
                <div className="mt-4 text-center text-[14px] text-gray-500 space-y-1 ">
                    <div className="">
                        Powered by Aquarius AMM
                    </div>
                    <div className="text-amber-400">
                        Testnet has limited liquidity - works on mainnet
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
