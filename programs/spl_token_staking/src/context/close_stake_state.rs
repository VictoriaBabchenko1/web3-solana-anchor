use anchor_lang::prelude::*;
use crate::state::StakeState;

#[derive(Accounts)]
pub struct CloseStakeState<'info> {
    #[account(mut, close = authority, has_one = authority)]
    pub stake_state: Account<'info, StakeState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn close_stake_state(_ctx: Context<CloseStakeState>) -> Result<()> {
    Ok(())
}