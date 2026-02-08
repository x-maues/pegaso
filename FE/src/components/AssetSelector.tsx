import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Coins } from 'lucide-react';
import { getAvailableVaults, type VaultConfig } from '../config/vaults';

// Logo mapping for vault assets - using images from public folder
// Only XLM and USDC have actual logo files
const VAULT_LOGOS: Record<string, string> = {
  'xlm': '/stlr.png',
  'usdc': '/usdc.png',
};

interface AssetSelectorProps {
  selectedVault: VaultConfig;
  onSelectVault: (vault: VaultConfig) => void;
}

export function AssetSelector({ selectedVault, onSelectVault }: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableVaults = getAvailableVaults(); // Only show deployed vaults

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-[#111] border border-white/10 rounded-xl hover:border-white/20 transition-all w-full"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            {VAULT_LOGOS[selectedVault.id] ? (
              <img
                src={VAULT_LOGOS[selectedVault.id]}
                alt={selectedVault.symbol}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <Coins size={20} className="text-[#2DD4BF]" />
            )}
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">{selectedVault.symbol}</div>
            <div className="text-xs text-gray-500">{selectedVault.name}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500">APY</div>
          <div className="text-sm font-bold font-mono text-gray-400">
            {selectedVault.estimatedAPY}
          </div>
        </div>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu - positioned absolutely to escape parent overflow */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50"
          >
            {/* Scrollable container */}
            <div
              className="p-2 max-h-[320px] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.3)',
              }}
            >
              {availableVaults.map((vault) => (
                <button
                  key={vault.id}
                  onClick={() => {
                    onSelectVault(vault);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${selectedVault.id === vault.id
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    {VAULT_LOGOS[vault.id] ? (
                      <img
                        src={VAULT_LOGOS[vault.id]}
                        alt={vault.symbol}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Coins size={20} className="text-[#2DD4BF]" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">{vault.symbol}</div>
                    <div className="text-xs text-gray-500">{vault.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">APY</div>
                    <div className="text-sm font-bold font-mono text-gray-400">
                      {vault.estimatedAPY}
                    </div>
                  </div>
                  {selectedVault.id === vault.id && (
                    <Check className="text-[#2DD4BF]" size={18} />
                  )}
                </button>
              ))}
            </div>

            {/* Info Footer */}
            <div className="px-4 py-3 bg-black/50 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                Each vault manages a separate asset in the Blend Protocol
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
