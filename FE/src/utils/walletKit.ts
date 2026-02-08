import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';

// Create and export a singleton kit instance with custom elegant theme
// This instance persists sessions automatically via the wallet kit's internal storage
const kit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    modules: allowAllModules(),
    // Custom theme matching the app's dark aesthetic
    theme: {
        bgColor: '#0a0a0a',                    // Dark background
        textColor: '#f5f5f5',                  // Light text
        solidTextColor: '#ffffff',             // Bright white for emphasis
        headerButtonColor: '#2DD4BF',          // Brand teal for buttons
        dividerColor: 'rgba(255,255,255,0.1)', // Subtle dividers
        helpBgColor: '#111111',                // Slightly lighter dark
        notAvailableTextColor: '#737373',      // Muted gray
        notAvailableBgColor: '#1a1a1a',        // Dark gray background
        notAvailableBorderColor: 'rgba(255,255,255,0.05)', // Very subtle border
    },
});

export default kit;
