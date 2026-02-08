# 🚀 Quick Deployment Guide - Multi-Asset Vaults

## Token Addresses (From Blend Testnet)

```bash
XLM_TOKEN=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC  # ✅ Already deployed
USDC_TOKEN=CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU
WBTC_TOKEN=CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI
WETH_TOKEN=CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE
BLEND_POOL=CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF
```

---

## Option 1: Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x deploy-multi-asset.sh

# Run deployment
./deploy-multi-asset.sh

# Output will be saved to: vault_addresses.env
```

**What it does:**
1. Checks if WASM exists, builds if needed
2. Deploys USDC vault + initializes
3. Deploys wBTC vault + initializes
4. Deploys wETH vault + initializes
5. Saves all addresses to `vault_addresses.env`

---

## Option 2: Manual Deployment

### 1. Build Contract (if not already built)

```bash
cd Vault
cargo build --target wasm32-unknown-unknown --release
cd ..
```

### 2. Deploy USDC Vault 💵

```bash
# Deploy
stellar contract deploy \
  --wasm Vault/target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

# Copy the contract ID that gets printed
USDC_VAULT=<paste_contract_id_here>

# Initialize
stellar contract invoke \
  --id $USDC_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU
```

### 3. Deploy wBTC Vault ₿

```bash
# Deploy
stellar contract deploy \
  --wasm Vault/target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

# Copy the contract ID
WBTC_VAULT=<paste_contract_id_here>

# Initialize
stellar contract invoke \
  --id $WBTC_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI
```

### 4. Deploy wETH Vault ◈

```bash
# Deploy
stellar contract deploy \
  --wasm Vault/target/wasm32-unknown-unknown/release/pegaso_vault.wasm \
  --source pegaso-admin \
  --network testnet

# Copy the contract ID
WETH_VAULT=<paste_contract_id_here>

# Initialize
stellar contract invoke \
  --id $WETH_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- init \
  --pool CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF \
  --asset CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE
```

---

## 3. Update Frontend Config

Open `FE/src/config/vaults.ts` and replace the vault addresses:

```typescript
// Replace 'DEPLOY_ME' with your actual contract IDs

// USDC
vaultAddress: '<YOUR_USDC_VAULT_ID>',

// wBTC
vaultAddress: '<YOUR_WBTC_VAULT_ID>',

// wETH
vaultAddress: '<YOUR_WETH_VAULT_ID>',
```

---

## 4. Test Each Vault

```bash
# Test USDC vault
stellar contract invoke \
  --id $USDC_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- total_shares

# Test wBTC vault
stellar contract invoke \
  --id $WBTC_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- total_shares

# Test wETH vault
stellar contract invoke \
  --id $WETH_VAULT \
  --source pegaso-admin \
  --network testnet \
  -- total_shares

# All should return "0" (no shares yet)
```

---

## 5. Integrate Asset Selector (UI Update)

### Update `VaultInterface.tsx`:

```typescript
import { useState } from 'react';
import { AssetSelector } from './AssetSelector';
import { getActiveVault, getAvailableVaults, type VaultConfig } from '../config/vaults';

export function VaultInterface() {
  const [selectedVault, setSelectedVault] = useState<VaultConfig>(getActiveVault());
  
  // ... rest of your code
  
  return (
    <div className="space-y-6">
      {/* Add this at the top */}
      {getAvailableVaults().length > 1 && (
        <GlassCard className="bg-gradient-to-br from-purple-500/5 to-[#2DD4BF]/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
            Select Asset
          </h3>
          <AssetSelector
            selectedVault={selectedVault}
            onSelectVault={setSelectedVault}
          />
        </GlassCard>
      )}
      
      {/* Your existing vault interface */}
      {/* ... */}
    </div>
  );
}
```

---

## 6. Verify Deployment

After updating the config, restart your frontend:

```bash
cd FE
npm run dev
```

**You should see:**
- Asset selector dropdown with 4 options
- XLM, USDC, wBTC, wETH
- Each showing their respective APYs
- Ability to switch between vaults

---

## 🎯 Final Checklist

- [ ] Build contract WASM
- [ ] Deploy USDC vault
- [ ] Initialize USDC vault
- [ ] Deploy wBTC vault
- [ ] Initialize wBTC vault
- [ ] Deploy wETH vault
- [ ] Initialize wETH vault
- [ ] Update `vaults.ts` with addresses
- [ ] Add `AssetSelector` to UI
- [ ] Test vault switching in frontend
- [ ] Test deposits in each vault

---

## 📝 Expected Output

After deployment, your `vault_addresses.env` should look like:

```bash
USDC_VAULT=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WBTC_VAULT=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WETH_VAULT=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Copy these addresses into `FE/src/config/vaults.ts` and you're done! 🎉

---

## ⚠️ Troubleshooting

**Error: "already initialized"**
- This means the vault was initialized before
- Skip the init step, just use the contract

**Error: "Failed to find config identity"**
- Run: `stellar keys ls` to see your identities
- Use the correct identity name (probably "pegaso-admin")

**Vault not showing in UI**
- Make sure you replaced 'DEPLOY_ME' with actual address
- Restart the frontend dev server
- Check browser console for errors

---

## 🚀 You're Ready!

Once all 4 vaults are deployed and configured, users can:
1. Choose which asset to deposit (XLM, USDC, wBTC, wETH)
2. See each asset's APY
3. Deposit into the selected vault
4. Earn Blend Protocol yield
5. Withdraw anytime

**Your multi-asset DeFi vault platform is live!** 🎉
