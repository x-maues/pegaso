# Pegasus 

yieldmaxxer

## Structure

```
vault/
├── contracts/          # Soroban smart contracts
│   ├── Cargo.toml      # Rust config
│   ├── src/            # Contract code
│   │   ├── lib.rs      # Vault + router logic
│   │   └── test.rs     # Basic tests
│   └── target/         # Build artifacts (gitignored)
├── FE/                 # React frontend (Vite + TypeScript)
│   ├── package.json    # Dependencies
│   ├── src/
│   │   ├── app/        # Pages
│   │   │   └── page.tsx # Dashboard
│   │   ├── components/ # Reusable UI
│   │   │   ├── ConnectButton.tsx
│   │   │   └── DepositForm.tsx
│   │   ├── context/    # Wallet state
│   │   │   └── WalletContext.tsx
│   │   └── utils/      # Helpers
│   └── public/         # Assets
├── README.md           # This file
└── .gitignore
```

## Frontend

Minimal Stellar frontend with:
- **Freighter wallet** support (via Stellar Wallets Kit)
- **Wallet context** for shared connection state
- **Dashboard** with deposit form (placeholder for contract interaction)

### Setup

```bash
cd FE
npm install
npm run dev
```

Open the app, click "Connect" and choose Freighter (or another Stellar wallet).

### Configuration

Set your deployed contract ID in `FE/src/utils/stellar.ts`:

```typescript
export const VAULT_CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE';
```

Then wire the deposit/withdraw logic to your contract methods.

## Contracts

Build and test Soroban contracts:

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
cargo test
```

Deploy to testnet/mainnet using Stellar CLI.

## Demo Notes

- Unaudited demo code for experimentation
- Do not use in production without security review
- Test on Stellar testnet first
