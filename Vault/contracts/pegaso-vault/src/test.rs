#![no_std]

use soroban_sdk::{
    testutils::{Address as _},
    Address, Env,
};

use blend_contract_sdk::testutils::{BlendFixture, default_reserve_config};
use pegaso_vault::PegasoVault;

#[test]
fn test_deposit_withdraw() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let blend = BlendFixture::deploy(&env, &admin, &usdc, &usdc);

    let pool = blend.pool_factory.deploy(
        &admin,
        &soroban_sdk::symbol_short!("test"),
        &soroban_sdk::BytesN::random(&env),
        &admin,
        &0,
        &4,
    );

    let pool_client = blend_contract_sdk::pool::Client::new(&env, &pool);
    pool_client.queue_set_reserve(&usdc, &default_reserve_config());
    pool_client.set_reserve(&usdc);
    pool_client.set_status(&3);
    pool_client.update_status();

    let vault = env.register(PegasoVault, ());
    PegasoVault::init(&env, pool.clone(), usdc.clone());

    PegasoVault::deposit(&env, user.clone(), 1_000_000);
    assert_eq!(PegasoVault::balance(&env, user.clone()), 1_000_000);

    PegasoVault::withdraw(&env, user.clone(), 500_000);
    assert_eq!(PegasoVault::balance(&env, user), 500_000);
}
