import { useEffect, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/format';
import kit from '../utils/walletKit';

export function ConnectButton() {
  const { address, isConnected, refreshAddress, disconnect } = useWallet();
  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = buttonWrapperRef.current;
    if (!el || el.children.length > 0) return;

    kit
      .createButton({
        container: el,
        onConnect: () => {
          refreshAddress();
        },
        onDisconnect: () => {
          disconnect();
        },
      })
      .catch(console.error);
  }, [kit, refreshAddress, disconnect]);

  return (
    <div className="flex items-center gap-3">
      {isConnected && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
          <div className="text-blue-400" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="8" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-mono text-gray-300">{formatAddress(address)}</span>
        </div>
      )}
      <div ref={buttonWrapperRef} className="[&>button]:bg-blue-600 [&>button]:hover:bg-blue-700 [&>button]:text-white [&>button]:px-4 [&>button]:py-2 [&>button]:rounded-lg [&>button]:font-medium [&>button]:transition-colors" />
    </div>
  );
}
