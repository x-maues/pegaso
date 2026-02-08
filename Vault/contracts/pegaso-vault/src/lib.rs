#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Map, Vec,
    token, IntoVal, auth::{ContractContext, SubContractInvocation, InvokerContractAuthEntry},
};
use blend_contract_sdk::pool::{Client as PoolClient, Request};

const SUPPLY_COLLATERAL: u32 = 2;
const WITHDRAW_COLLATERAL: u32 = 3;

#[contract]
pub struct PegasoVault;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Pool,
    Asset,
    Balances,
    TotalShares,
}

#[contractimpl]
impl PegasoVault {
    pub fn init(env: Env, pool: Address, asset: Address) {
        if env.storage().instance().has(&DataKey::Pool) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Pool, &pool);
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Balances, &Map::<Address, i128>::new(&env));
        env.storage().instance().set(&DataKey::TotalShares, &0i128);
    }

    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("invalid amount");
        }

        let pool: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let vault = env.current_contract_address();

        // 1. Transfer from user to vault
        let token = token::Client::new(&env, &asset);
        token.transfer(&user, &vault, &amount);

        // 2. Authorize vault's token transfer to pool
        let transfer_auth = SubContractInvocation {
            context: ContractContext {
                contract: asset.clone(),
                fn_name: soroban_sdk::symbol_short!("transfer"),
                args: (vault.clone(), pool.clone(), amount).into_val(&env),
            },
            sub_invocations: Vec::new(&env),
        };

        env.authorize_as_current_contract(Vec::from_array(&env, [InvokerContractAuthEntry::Contract(transfer_auth)]));

        // 3. Submit to Blend
        let pool_client = PoolClient::new(&env, &pool);
        pool_client.submit(
            &vault,
            &vault,
            &vault,
            &Vec::from_array(
                &env,
                [Request {
                    request_type: SUPPLY_COLLATERAL,
                    address: asset.clone(),
                    amount,
                }],
            ),
        );

        // 4. Update shares
        let b_rate: i128 = 10_500_000;
        let scalar: i128 = 10_000_000;
        let shares = (amount * scalar) / b_rate;
        
        let mut balances: Map<Address, i128> = env.storage().instance().get(&DataKey::Balances).unwrap();
        let mut total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();

        let current = balances.get(user.clone()).unwrap_or(0);
        balances.set(user.clone(), current + shares);
        total_shares += shares;

        env.storage().instance().set(&DataKey::Balances, &balances);
        env.storage().instance().set(&DataKey::TotalShares, &total_shares);
    }

    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("invalid amount");
        }

        let pool: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let vault = env.current_contract_address();

        let mut balances: Map<Address, i128> = env.storage().instance().get(&DataKey::Balances).unwrap();
        let mut total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();

        let current = balances.get(user.clone()).unwrap_or(0);
        if amount > current {
            panic!("insufficient shares");
        }

        let b_rate: i128 = 10_500_000;
        let scalar: i128 = 10_000_000;
        let withdraw_amount = (amount * b_rate) / scalar;

        // Authorize vault's b_token transfer to pool
        // In Blend, pool contract IS the b_token for collateral positions
        let b_token_transfer_auth = SubContractInvocation {
            context: ContractContext {
                contract: pool.clone(), // b_token = pool contract
                fn_name: soroban_sdk::symbol_short!("transfer"),
                args: (vault.clone(), pool.clone(), withdraw_amount).into_val(&env),
            },
            sub_invocations: Vec::new(&env),
        };

        env.authorize_as_current_contract(Vec::from_array(&env, [InvokerContractAuthEntry::Contract(b_token_transfer_auth)]));

        // Withdraw from Blend
        let pool_client = PoolClient::new(&env, &pool);
        pool_client.submit(
            &vault,
            &vault,
            &user,
            &Vec::from_array(
                &env,
                [Request {
                    request_type: WITHDRAW_COLLATERAL,
                    address: asset.clone(),
                    amount: withdraw_amount,
                }],
            ),
        );

        balances.set(user.clone(), current - amount);
        total_shares -= amount;

        env.storage().instance().set(&DataKey::Balances, &balances);
        env.storage().instance().set(&DataKey::TotalShares, &total_shares);
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        let balances: Map<Address, i128> = env.storage().instance().get(&DataKey::Balances).unwrap();
        balances.get(user).unwrap_or(0)
    }

    pub fn total_shares(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
    }

    pub fn get_asset(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Asset).unwrap()
    }

    pub fn get_pool(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Pool).unwrap()
    }
}