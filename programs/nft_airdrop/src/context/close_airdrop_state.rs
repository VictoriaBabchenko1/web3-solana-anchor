use anchor_lang::prelude::*;
use crate::state::AirdropState;

#[derive(Accounts)]
pub struct CloseAirdropState<'info> {
    #[account(mut, close = authority, has_one = authority)]
    pub airdrop_state: Account<'info, AirdropState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn close_airdrop_state(_ctx: Context<CloseAirdropState>) -> Result<()> {
    Ok(())
}