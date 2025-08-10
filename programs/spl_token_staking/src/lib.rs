use anchor_lang::prelude::*;
pub mod context;
pub mod state;
pub mod errors;
use context::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod spl_token_staking {
    use super::*;

    pub fn initialize_stake_state(ctx: Context<InitializeStakeState>, apr: u64) -> Result<()> {
        context::initialize_stake_state(ctx, apr)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64, lock_period: i64) -> Result<()> {
        context::stake(ctx, amount, lock_period)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        context::unstake(ctx)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        context::claim_reward(ctx)
    }

    pub fn close_stake_state(ctx: Context<CloseStakeState>) -> Result<()> {
        context::close_stake_state(ctx)
    }
}