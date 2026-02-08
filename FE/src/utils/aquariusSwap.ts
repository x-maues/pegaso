import {
    Asset,
    Networks,
    TransactionBuilder,
    BASE_FEE,
    xdr,
    Address,
    StrKey,
    Contract,
} from '@stellar/stellar-sdk';
import { sorobanServer, NETWORK_PASSPHRASE } from './stellar';
import { signTransaction } from '@stellar/freighter-api';

// Aquarius Router (Testnet)
const ROUTER_CONTRACT_ID = "CBCFTQSPDBAIZ6R6PJQKSQWKNKWH2QIV3I4J72SHWBIK3ADRRAM5A6GD";
const AQUARIUS_API = "https://amm-api-testnet.aqua.network/api/external/v1";

// Helper function to convert u128 to number
function u128ToInt(value: any): number {
    try {
        const hi = BigInt(value.hi()._value);
        const lo = BigInt(value.lo()._value);
        const result = (hi << 64n) + lo;
        
        if (result <= BigInt(Number.MAX_SAFE_INTEGER)) {
            return Number(result);
        }
        return 0;
    } catch {
        return 0;
    }
}

// Helper to create u128 from number
function numberToU128(value: number): xdr.ScVal {
    const bigIntValue = BigInt(value);
    const lo = bigIntValue & 0xFFFFFFFFFFFFFFFFn;
    const hi = bigIntValue >> 64n;
    
    return xdr.ScVal.scvU128(
        new xdr.UInt128Parts({
            lo: xdr.Uint64.fromString(lo.toString()),
            hi: xdr.Uint64.fromString(hi.toString()),
        })
    );
}

/**
 * Get optimal swap path from Aquarius API
 */
async function getSwapPath(
    tokenInAddress: string,
    tokenOutAddress: string,
    amount: number,
    isSend: boolean
): Promise<{ swapChainXdr: string; estimatedAmount: number }> {
    const endpoint = isSend ? '/find-path/' : '/find-path-strict-receive/';
    
    try {
        const requestBody = {
            token_in_address: tokenInAddress,
            token_out_address: tokenOutAddress,
            amount: amount.toString(),
        };
        
        console.log('Aquarius API Request:', {
            url: `${AQUARIUS_API}${endpoint}`,
            body: requestBody
        });
        
        const response = await fetch(`${AQUARIUS_API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        console.log('Aquarius API Response:', result);

        if (!response.ok || !result.success) {
            // Check for token not recognized error
            if (result.token_in_address || result.token_out_address) {
                const tokenErrors = [
                    ...(result.token_in_address || []),
                    ...(result.token_out_address || [])
                ].join(', ');
                throw new Error(`Testnet tokens not registered in Aquarius: ${tokenErrors}`);
            }
            
            // Check if it's a liquidity issue
            const errorMsg = result.error || result.message || 'Failed to find swap path';
            
            if (errorMsg.includes('path') || errorMsg.includes('pool') || errorMsg.includes('liquidity')) {
                throw new Error('No liquidity pools available on testnet. This feature works on mainnet.');
            }
            
            // For other errors, provide the actual API error
            throw new Error(`Aquarius API: ${errorMsg}`);
        }

        return {
            swapChainXdr: result.swap_chain_xdr,
            estimatedAmount: parseInt(result.amount),
        };
    } catch (error: any) {
        // Provide helpful error message
        if (error.message.includes('fetch') || error.message.includes('network')) {
            throw new Error('Aquarius API unavailable. Please try again later.');
        }
        throw error;
    }
}

/**
 * Get token contract ID for Stellar asset
 */
function getTokenAddress(asset: 'XLM' | 'AQUA' | 'USDC'): string {
    const assets: Record<string, Asset> = {
        XLM: Asset.native(),
        AQUA: new Asset('AQUA', 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA'),
        USDC: new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'), // Testnet
    };
    
    return assets[asset].contractId(Networks.TESTNET);
}

/**
 * Swap XLM to another token using Aquarius
 */
export async function swapToken(
    userAddress: string,
    fromAsset: 'XLM' | 'AQUA' | 'USDC',
    toAsset: 'XLM' | 'AQUA' | 'USDC',
    amount: string,
): Promise<string> {
    console.log(`Starting swap: ${amount} ${fromAsset} → ${toAsset}`);

    const amountStroops = Math.floor(parseFloat(amount) * 10_000_000);

    // Step 1: Get swap path from Aquarius API
    const tokenInAddress = getTokenAddress(fromAsset);
    const tokenOutAddress = getTokenAddress(toAsset);

    const { swapChainXdr, estimatedAmount } = await getSwapPath(
        tokenInAddress,
        tokenOutAddress,
        amountStroops,
        true // strict-send
    );

    console.log(`Estimated output: ${estimatedAmount / 1e7} ${toAsset}`);

    // Step 2: Build transaction
    const sourceAccount = await sorobanServer.getAccount(userAddress);

    const swapsChain = xdr.ScVal.fromXDR(swapChainXdr, 'base64');
    const tokenInScVal = Address.contract(Buffer.from(StrKey.decodeContract(tokenInAddress))).toScVal();
    const amountU128 = numberToU128(amountStroops);
    
    // Apply 1% slippage
    const minAmountOut = Math.floor(estimatedAmount * 0.99);
    const minAmountU128 = numberToU128(minAmountOut);

    let transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(
            new Contract(ROUTER_CONTRACT_ID).call(
                'swap_chained',
                Address.fromString(userAddress).toScVal(),
                swapsChain,
                tokenInScVal,
                amountU128,
                minAmountU128
            )
        )
        .setTimeout(180)
        .build();

    // Step 3: Simulate
    const simulationResponse = await sorobanServer.simulateTransaction(transaction);

    if ('error' in simulationResponse) {
        throw new Error(`Simulation failed: ${simulationResponse.error}`);
    }

    // Step 4: Prepare transaction
    transaction = await sorobanServer.prepareTransaction(transaction);

    // Step 5: Sign with Freighter
    const { signedTxXdr } = await signTransaction(transaction.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Step 6: Submit
    const sendResponse = await sorobanServer.sendTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
    );

    if (sendResponse.status !== 'PENDING') {
        throw new Error(`Transaction failed: ${sendResponse.status}`);
    }

    // Step 7: Wait for confirmation
    let getResponse = await sorobanServer.getTransaction(sendResponse.hash);
    let attempts = 0;

    while (getResponse.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await sorobanServer.getTransaction(sendResponse.hash);
        attempts++;
    }

    if (getResponse.status !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${getResponse.status}`);
    }

    // Extract result
    const meta = getResponse.resultMetaXdr;
    const returnValue = meta.v3().sorobanMeta()?.returnValue();
    
    if (returnValue) {
        const swapResult = u128ToInt(returnValue.value());
        console.log(`Swapped ${amount} ${fromAsset} → ${swapResult / 1e7} ${toAsset}`);
    }

    return sendResponse.hash;
}

// Export convenience functions
export const swapXLMtoAQUA = (userAddress: string, amount: string) => 
    swapToken(userAddress, 'XLM', 'AQUA', amount);

export const swapXLMtoUSDC = (userAddress: string, amount: string) => 
    swapToken(userAddress, 'XLM', 'USDC', amount);

export const swapAQUAtoXLM = (userAddress: string, amount: string) => 
    swapToken(userAddress, 'AQUA', 'XLM', amount);
