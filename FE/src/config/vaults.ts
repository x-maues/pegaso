/**
 * Multi-Asset Vault Configuration
 * Each vault is a separate contract instance managing one asset type
 */

export interface VaultConfig {
  id: string;
  symbol: string;
  name: string;
  tokenAddress: string;
  vaultAddress: string;
  icon: string;
  color: string;
  estimatedAPY: string; // From Blend's data
  poolAddress: string;
  decimals: number;
}

export const VAULTS: VaultConfig[] = [
  {
    id: 'xlm',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    vaultAddress: 'CB253GUKVRSRD47JFA2G4JBKNEEVTX7TMM6L6WCWBXVDAE2DYSUNCLSZ', // ✅ Already deployed
    icon: 'XLM',
    color: '#2DD4BF',
    estimatedAPY: '37.65%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 7,
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    tokenAddress: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    vaultAddress: 'CCK2S3L7IFNHQ6X4TIBNT6COSJ2D2H7M3XGCWW4N43J4U2KBZ26ZNJTB', // ✅ Deployed
    icon: '💵',
    color: '#3B82F6',
    estimatedAPY: '31.56%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 6,
  },
  {
    id: 'wbtc',
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    tokenAddress: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
    vaultAddress: 'CCKY72QMUFY2HR3DVSQJTB7NXQZJAPAEQOLUTYBUYGL2MJ2AP6OFGYUZ', // ✅ Deployed
    icon: '₿',
    color: '#F59E0B',
    estimatedAPY: '1,120.72%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 8,
  },
  {
    id: 'weth',
    symbol: 'wETH',
    name: 'Wrapped Ethereum',
    tokenAddress: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
    vaultAddress: 'CAS4LDAOALXHWD3E5XQSFTKCNAC6OEVPBVDPWIBGDARSW2YCOTRIO5IW', // ✅ Deployed
    icon: '◈',
    color: '#9333EA',
    estimatedAPY: '4,450.52%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 18,
  },
];

// Get active vault from env or default to XLM
export const getActiveVault = (): VaultConfig => {
  const activeVaultId = import.meta.env.VITE_ACTIVE_VAULT_ID || 'xlm';
  const vault = VAULTS.find(v => v.id === activeVaultId && v.vaultAddress !== 'DEPLOY_ME');
  return vault || VAULTS[0];
};

// Get vault by symbol
export const getVaultBySymbol = (symbol: string): VaultConfig | undefined => {
  return VAULTS.find(v => v.symbol.toLowerCase() === symbol.toLowerCase());
};

// Get all available (deployed) vaults
export const getAvailableVaults = (): VaultConfig[] => {
  return VAULTS.filter(v => v.vaultAddress !== 'DEPLOY_ME');
};

