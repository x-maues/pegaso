import {
    Contract,
    TransactionBuilder,
    BASE_FEE,
    Address,
    nativeToScVal,
    scValToNative,
    xdr,
    Soroban
} from '@stellar/stellar-sdk';
import { sorobanServer, NETWORK_PASSPHRASE } from './stellar';
import walletKit from './walletKit';

// Active contract ID (can be dynamically set)
let activeContractId: string | null = null;

// Get contract ID from environment or active override
const getContractId = () => {
    const id = activeContractId || import.meta.env.VITE_VAULT_CONTRACT_ID;
    if (!id) {
        throw new Error('VITE_VAULT_CONTRACT_ID not configured. Please set it in .env.local file.');
    }
    return id;
};

/**
 * Set active contract ID (for multi-asset vault switching)
 */
export function setActiveContractId(contractId: string) {
    activeContractId = contractId;
}

/**
 * Build, simulate, sign, and submit a contract transaction
 */
async function buildAndSignTransaction(
    method: string,
    params: xdr.ScVal[],
    userPublicKey: string
): Promise<string> {
    const contractId = getContractId();
    const contract = new Contract(contractId);

    // Get account details
    const sourceAccount = await sorobanServer.getAccount(userPublicKey);

    // Build the transaction
    let transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(method, ...params))
        .setTimeout(180) // 3 minutes
        .build();

    // Simulate transaction
    const sim = await sorobanServer.simulateTransaction(transaction);
    
    // Check for simulation errors (SDK v14 compatible)
    if (!sim.result || sim.error) {
        const errorMsg = sim.error || 'Unknown simulation error';
        throw new Error(`Simulation failed: ${errorMsg}`);
    }

    // Prepare transaction (replaces assembleTransaction)
    transaction = await sorobanServer.prepareTransaction(transaction);

    // Sign with wallet
    const { signedTxXdr } = await walletKit.signTransaction(transaction.toXDR(), {
        address: userPublicKey,
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Submit the transaction
    const sendResponse = await sorobanServer.sendTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
    );

    if (sendResponse.status !== 'PENDING') {
        throw new Error(`Transaction failed: ${sendResponse.errorResult?.toXDR('base64')} `);
    }

    // Wait for confirmation
    let getResponse = await sorobanServer.getTransaction(sendResponse.hash);
    const retries = 30;
    let attempts = 0;

    while (getResponse.status === 'NOT_FOUND' && attempts < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await sorobanServer.getTransaction(sendResponse.hash);
        attempts++;
    }

    if (getResponse.status !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${getResponse.status} `);
    }

    return sendResponse.hash;
}

/**
 * Initialize the vault with Blend pool and asset addresses
 */
export async function initVault(
    userAddress: string,
    poolAddress: string,
    assetAddress: string
): Promise<string> {
    const params = [
        new Address(poolAddress).toScVal(),
        new Address(assetAddress).toScVal(),
    ];

    return buildAndSignTransaction('init', params, userAddress);
}

/**
 * Deposit tokens into the vault
 * User signs once - authorization for token transfer is included
 */
export async function deposit(
    userAddress: string,
    amount: string
): Promise<string> {
    // Convert amount to i128 (7 decimals for most Stellar assets)
    const amountStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

    const params = [
        new Address(userAddress).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
    ];

    return buildAndSignTransaction('deposit', params, userAddress);
}

/**
 * Withdraw tokens from the vault
 */
export async function withdraw(
    userAddress: string,
    amount: string
): Promise<string> {
    // Convert amount to i128 (7 decimals)
    const amountStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

    const params = [
        new Address(userAddress).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
    ];

    return buildAndSignTransaction('withdraw', params, userAddress);
}

/**
 * Get user's vault balance (shares)
 */
export async function getBalance(userAddress: string): Promise<string> {
    const contractId = getContractId();
    const contract = new Contract(contractId);

    const sourceAccount = await sorobanServer.getAccount(userAddress);

    const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(
            contract.call('balance', new Address(userAddress).toScVal())
        )
        .setTimeout(30)
        .build();

    const simulation = await sorobanServer.simulateTransaction(transaction);

    // Check for simulation errors
    if ('error' in simulation) {
        console.error('Simulation error:', simulation);
        return '0';
    }

    if (simulation.result?.retval) {
        const balance = scValToNative(simulation.result.retval) as bigint;
        // Convert from stroops (7 decimals) to token amount
        return (Number(balance) / 10_000_000).toString();
    }

    return '0';
}

/**
 * Get total vault shares
 */
export async function getTotalShares(): Promise<string> {
    const contractId = getContractId();
    const contract = new Contract(contractId);

    // Use a dummy account for read-only call
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const sourceAccount = await sorobanServer.getAccount(dummyAccount).catch(() => {
        // If dummy account doesn't exist, use contract address
        return sorobanServer.getAccount(contractId);
    });

    const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('total_shares'))
        .setTimeout(30)
        .build();

    const simulation = await sorobanServer.simulateTransaction(transaction);

    // Check for simulation errors
    if ('error' in simulation) {
        console.error('Simulation error:', simulation);
        return '0';
    }

    if (simulation.result?.retval) {
        const total = scValToNative(simulation.result.retval) as bigint;
        return (Number(total) / 10_000_000).toString();
    }

    return '0';
}

/**
 * Get the asset address from the vault
 */
export async function getAssetAddress(): Promise<string | null> {
    const contractId = getContractId();
    const contract = new Contract(contractId);

    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const sourceAccount = await sorobanServer.getAccount(dummyAccount).catch(() => {
        return sorobanServer.getAccount(contractId);
    });

    const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('get_asset'))
        .setTimeout(30)
        .build();

    const simulation = await sorobanServer.simulateTransaction(transaction);

    // Check for simulation errors
    if ('error' in simulation) {
        console.error('Simulation error:', simulation);
        return null;
    }

    if (simulation.result?.retval) {
        const address = Address.fromScVal(simulation.result.retval).toString();
        return address;
    }

    return null;
}

/**
 * Get token symbol from address
 * This is a helper that tries to detect known tokens
 */
export function getTokenSymbol(tokenAddress: string): string {
    // Known testnet tokens
    const knownTokens: Record<string, string> = {
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
        // Add your testnet USDC address here when deployed
        // 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX': 'USDC',
    };

    return knownTokens[tokenAddress] || 'TOKEN';
}

/**
 * Get current APY from Blend pool
 * For hackathon: displays the simulated yield from our fixed b_rate
 */
export async function getPoolAPY(): Promise<string> {
    try {
        // Our contract uses a fixed b_rate of 10,500,000 / 10,000,000 = 1.05
        // This represents ~5% accumulated yield
        const b_rate = 10_500_000 / 10_000_000; // 1.05
        const yieldPercent = ((b_rate - 1.0) * 100).toFixed(2);
        
        return `${yieldPercent}%`;
        
        // TODO: In production, fetch real-time from Blend:
        // const poolAddress = import.meta.env.VITE_BLEND_POOL_ADDRESS;
        // const assetAddress = import.meta.env.VITE_XLM_TOKEN_ADDRESS;
        // Query pool.get_reserve(asset) and calculate APY from b_rate changes over time
    } catch (error) {
        console.error('Error calculating APY:', error);
        return "5.00%"; // Fallback to our known rate
    }
}

/**
 * Approve token (not needed for Soroban - kept for compatibility)
 * Authorization is handled in the transaction itself
 */
export async function approveToken(
    _userAddress: string, // Parameter renamed to _userAddress
    _spenderAddress: string, // Parameter renamed to _spenderAddress
    _amount: string // Parameter renamed to _amount
): Promise<string> {
    // In Soroban, approval is part of the authorization flow
    // This function is kept for interface compatibility but does nothing
    console.log('Token approval is handled automatically in Soroban');
    return 'not-needed';
}

