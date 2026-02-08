#!/bin/bash

# ========================================
# Multi-Asset Vault Deployment Script
# ========================================
# This script deploys USDC, wBTC, and wETH vaults
# XLM vault is already deployed

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ADMIN_KEY="pegaso-admin"
NETWORK="testnet"
BLEND_POOL="CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF"

# Token addresses from Blend testnet
USDC_TOKEN="CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU"
WBTC_TOKEN="CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI"
WETH_TOKEN="CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE"

# WASM path
WASM_PATH="Vault/target/wasm32-unknown-unknown/release/pegaso_vault.wasm"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Pegasus Multi-Asset Vault Deployment ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if WASM exists
if [ ! -f "$WASM_PATH" ]; then
    echo -e "${RED}❌ WASM file not found!${NC}"
    echo -e "${YELLOW}Building contract...${NC}"
    cd Vault
    cargo build --target wasm32-unknown-unknown --release
    cd ..
fi

echo -e "${GREEN}✅ WASM file found${NC}"
echo ""

# Function to deploy and initialize vault
deploy_vault() {
    local ASSET_NAME=$1
    local TOKEN_ADDRESS=$2
    local ICON=$3
    
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Deploying ${ICON} ${ASSET_NAME} Vault${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    # Deploy contract
    echo -e "${YELLOW}📦 Deploying contract...${NC}"
    VAULT_ID=$(stellar contract deploy \
        --wasm "$WASM_PATH" \
        --source "$ADMIN_KEY" \
        --network "$NETWORK" 2>&1 | tail -n 1)
    
    if [ -z "$VAULT_ID" ]; then
        echo -e "${RED}❌ Deployment failed!${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Deployed: ${VAULT_ID}${NC}"
    
    # Initialize vault
    echo -e "${YELLOW}⚙️  Initializing vault...${NC}"
    stellar contract invoke \
        --id "$VAULT_ID" \
        --source "$ADMIN_KEY" \
        --network "$NETWORK" \
        -- init \
        --pool "$BLEND_POOL" \
        --asset "$TOKEN_ADDRESS"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Initialized successfully${NC}"
    else
        echo -e "${RED}❌ Initialization failed!${NC}"
        return 1
    fi
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ${ASSET_NAME} Vault Deployed Successfully! ${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Contract ID:                           ║${NC}"
    echo -e "${GREEN}║  ${VAULT_ID}${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    # Save to output file
    echo "${ASSET_NAME}_VAULT=${VAULT_ID}" >> vault_addresses.env
    
    return 0
}

# Create/clear output file
> vault_addresses.env

# Deploy USDC Vault
deploy_vault "USDC" "$USDC_TOKEN" "💵"
USDC_RESULT=$?

# Deploy wBTC Vault
deploy_vault "wBTC" "$WBTC_TOKEN" "₿"
WBTC_RESULT=$?

# Deploy wETH Vault
deploy_vault "wETH" "$WETH_TOKEN" "◈"
WETH_RESULT=$?

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Deployment Summary             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ $USDC_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ USDC Vault: Deployed${NC}"
else
    echo -e "${RED}❌ USDC Vault: Failed${NC}"
fi

if [ $WBTC_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ wBTC Vault: Deployed${NC}"
else
    echo -e "${RED}❌ wBTC Vault: Failed${NC}"
fi

if [ $WETH_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ wETH Vault: Deployed${NC}"
else
    echo -e "${RED}❌ wETH Vault: Failed${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Contract addresses saved to: vault_addresses.env${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Copy addresses from ${YELLOW}vault_addresses.env${NC}"
echo -e "2. Update ${YELLOW}FE/src/config/vaults.ts${NC}"
echo -e "3. Replace 'DEPLOY_ME' with actual vault addresses"
echo -e "4. Restart your frontend"
echo ""
echo -e "${GREEN}🎉 Multi-asset vault platform ready!${NC}"
