use anchor_lang::prelude::*;
use crate::state::StakeState;

#[derive(Accounts)]
pub struct InitializeStakeState<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 8 + 32, 
        seeds = [b"stake_state"], 
        bump
    )]
    pub stake_state: Account<'info, StakeState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_stake_state(ctx: Context<InitializeStakeState>, apr: u64) -> Result<()> {
    let state = &mut ctx.accounts.stake_state;
    state.apr = apr;
    state.authority = *ctx.accounts.authority.key;
    Ok(())
}