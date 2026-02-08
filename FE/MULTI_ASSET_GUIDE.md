# 🚀 Multi-Asset Vault Platform Guide

## Overview

Transform your single XLM vault into a **multi-asset vault platform** where users can choose which asset to deposit (XLM, USDC, wBTC, wETH).

---

## 📦 Architecture

```
Pegasus Vault Platform
│
├─ XLM Vault (Contract 1)
│  ├─ Pool: Blend TestnetV2
│  ├─ Asset: XLM Token
│  └─ APY: 37.65%
│
├─ USDC Vault (Contract 2)
│  ├─ Pool: Blend TestnetV2
│  ├─ Asset: USDC Token
│  └─ APY: 31.56%
│
├─ wBTC Vault (Contract 3)
│  ├─ Pool: Blend TestnetV2
│  ├─ Asset: wBTC Token
│  └─ APY: 1,120.72%
│
└─ wETH Vault (Contract 4)
   ├─ Pool: Blend TestnetV2
   ├─ Asset: wETH Token
   └─ APY: 4,450.52%
```

**Key Points:**
- ✅ Each vault = separate smart contract
- ✅ All vaults use the **same** Blend pool
- ✅ Each vault manages **one asset type**
- ✅ Users choose which vault to interact with

---

## 🔧 Implementation Steps

### Step 1: Get Asset Addresses from Blend

Visit: https://app.blend.capital/

From your screenshot data:
```bash
# Blend TestnetV2 Pool
BLEND_POOL=CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF

# Assets (you need to find these on Blend's contracts page)
XLM_TOKEN=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
USDC_TOKEN=<find_from_blend>
WBTC_TOKEN=<find_from_blend>
WETH_TOKEN=<find_from_blend>
```

### Step 2: Deploy Vault Contracts

```bash
cd Vault

# Build the contract (same contract for all assets)
cargo build --target wasm32-unknown-unknown --release

# Deploy XLM Vault (already done!)
VAULT_XLM=CB253GUKVRSRD47JFA2G4JBKNEEVTX7TMM6L6WCWBXVDAE2DYSUNCLSZ

# Deploy USDC Vault
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

VAULT_USDC=<copy_new_contract_id>

stellar contract invoke \
  --id $VAULT_USDC \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset <USDC_TOKEN_ADDRESS>

# Deploy wBTC Vault
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

VAULT_WBTC=<copy_new_contract_id>

stellar contract invoke \
  --id $VAULT_WBTC \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset <WBTC_TOKEN_ADDRESS>

# Deploy wETH Vault
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

VAULT_WETH=<copy_new_contract_id>

stellar contract invoke \
  --id $VAULT_WETH \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset <WETH_TOKEN_ADDRESS>
```

### Step 3: Update Frontend Config

Update `FE/src/config/vaults.ts`:

```typescript
export const VAULTS: VaultConfig[] = [
  {
    id: 'xlm',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    vaultAddress: 'CB253GUKVRSRD47JFA2G4JBKNEEVTX7TMM6L6WCWBXVDAE2DYSUNCLSZ',
    icon: '⭐',
    color: '#2DD4BF',
    estimatedAPY: '37.65%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 7,
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    tokenAddress: '<PASTE_USDC_TOKEN_ADDRESS>',
    vaultAddress: '<PASTE_USDC_VAULT_ADDRESS>',
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
    tokenAddress: '<PASTE_WBTC_TOKEN_ADDRESS>',
    vaultAddress: '<PASTE_WBTC_VAULT_ADDRESS>',
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
    tokenAddress: '<PASTE_WETH_TOKEN_ADDRESS>',
    vaultAddress: '<PASTE_WETH_VAULT_ADDRESS>',
    icon: '◈',
    color: '#9333EA',
    estimatedAPY: '4,450.52%',
    poolAddress: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    decimals: 18,
  },
];
```

### Step 4: Add Asset Selector to VaultInterface

Add this to the top of `VaultInterface.tsx`:

```typescript
import { useState } from 'react';
import { AssetSelector } from './AssetSelector';
import { getActiveVault, type VaultConfig } from '../config/vaults';

export function VaultInterface() {
  const [selectedVault, setSelectedVault] = useState<VaultConfig>(getActiveVault());
  
  // ... existing code ...
  
  return (
    <div className="space-y-6">
      {/* Asset Selector */}
      <GlassCard>
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
            Select Asset
          </h3>
          <AssetSelector
            selectedVault={selectedVault}
            onSelectVault={setSelectedVault}
          />
        </div>
      </GlassCard>
      
      {/* Rest of your existing vault interface */}
      {/* ... */}
    </div>
  );
}
```

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────────┐
│ Select Asset                                │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ ⭐ XLM                    APY          │  │
│ │    Stellar Lumens         37.65%    ▼ │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ Dropdown options:                           │
│ ┌───────────────────────────────────────┐  │
│ │ ✓ ⭐ XLM             37.65%           │  │
│ │   💵 USDC            31.56%           │  │
│ │   ₿  wBTC            1,120.72%        │  │
│ │   ◈  wETH            4,450.52%        │  │
│ └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Pegasus Vault                               │
│                                             │
│ Your Shares: 8333.33                        │
│ ≈ 8750.00 XLM (1.05x)                      │
│                                             │
│ Earning Blend Yield                         │
│ Current Yield: 37.65%                       │
└─────────────────────────────────────────────┘
```

---

## 🔄 How It Works

### User Flow:

1. **User visits app** → Sees XLM vault (default)
2. **User clicks dropdown** → Sees all 4 assets with APYs
3. **User selects wBTC** → App switches to wBTC vault
4. **User deposits 0.5 wBTC** → Goes to wBTC vault contract
5. **wBTC vault** → Deposits to Blend's wBTC reserve
6. **User earns 1,120.72% APY** → From Blend's wBTC lending

### Technical Flow:

```typescript
// User selects wBTC
onSelectVault(VAULTS[2]); // wBTC config

// App updates contract ID
const contractId = selectedVault.vaultAddress; // wBTC vault

// Deposit calls the correct vault
deposit(userAddress, amount); // Uses wBTC vault contract

// wBTC vault interacts with Blend
pool_client.submit(
  vault,
  vault,
  vault,
  Request {
    request_type: SUPPLY_COLLATERAL,
    address: WBTC_TOKEN_ADDRESS, // wBTC asset
    amount,
  }
);
```

---

## 📊 Benefits

| Feature | Single Vault | Multi-Asset Platform |
|---------|-------------|---------------------|
| **Assets** | XLM only | XLM, USDC, wBTC, wETH |
| **APY Options** | 37.65% | 31-4,450% |
| **User Choice** | None | Full flexibility |
| **Market Appeal** | Limited | High |
| **Complexity** | Simple | Moderate |

---

## ⚡ Quick Start (MVP)

Don't want to deploy all 4 vaults right away? Start with 2:

```bash
# Already have XLM ✅
# Add USDC vault 💵

# 1. Deploy USDC vault
stellar contract deploy --wasm pegaso_vault.wasm --source admin --network testnet

# 2. Initialize with USDC
stellar contract invoke --id <NEW_ID> --source admin --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset <USDC_ADDRESS>

# 3. Update vaults.ts with both XLM and USDC

# 4. Add AssetSelector to UI

# Done! Users can now choose XLM or USDC
```

---

## 🎯 Summary

**YES!** You can absolutely have multiple vaults for each asset. The implementation is:

1. ✅ **Same contract code** - deploy multiple times
2. ✅ **Same Blend pool** - all vaults use it
3. ✅ **Different assets** - each vault manages one
4. ✅ **User choice** - dropdown selector
5. ✅ **Independent tracking** - each vault tracks its own shares

**Effort:**
- Deploy: ~5 minutes per vault
- Frontend: ~30 minutes for asset selector
- Total: ~1 hour for 4-asset platform

**Impact:**
- 📈 4x more asset options
- 💰 Higher APY options (wBTC: 1,120%, wETH: 4,450%)
- 🎯 More attractive to users
- 🚀 Production-ready multi-asset DeFi platform

Start with XLM + USDC, then add wBTC/wETH later! 🔥
