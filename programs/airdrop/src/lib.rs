use anchor_lang::prelude::*;
pub mod context;
pub mod state;
pub mod error;
pub mod utils;
pub mod constants;

use context::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod airdrop {
    use super::*;

    pub fn claim_random_tokens_amount(ctx: Context<ClaimRandomTokensAmount>, client_seed: u64) -> Result<()> {
        context::claim_random_tokens_amount(ctx, client_seed)
    }

    pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>, whitelist: Vec<Pubkey>) -> Result<()> {
        context::initialize_whitelist(ctx, whitelist)
    }

    pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, new_user: Pubkey) -> Result<()> {
        context::add_to_whitelist(ctx, new_user)
    }

    pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>, user: Pubkey) -> Result<()> {
        context::remove_from_whitelist(ctx, user)
    }

    pub fn delete_whitelist(ctx: Context<DeleteWhitelist>) -> Result<()> {
        context::delete_whitelist(ctx)
    }

    pub fn check_whitelist(ctx: Context<CheckWhitelist>, user: Pubkey) -> Result<()> {
        context::check_whitelist(ctx, user)
    }
}
