use anchor_lang::prelude::*;
use crate::state::AirdropState;

#[derive(Accounts)]
pub struct InitializeAirdrop<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [b"airdrop_state"],
        bump,
        space = 8 + 32 + 8 + 8 + 1,
    )]
    pub airdrop_state: Account<'info, AirdropState>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_airdrop(ctx: Context<InitializeAirdrop>, max_supply: u64) -> Result<()> {
    let state = &mut ctx.accounts.airdrop_state;
    state.authority = ctx.accounts.authority.key();
    state.max_supply = max_supply;
    state.minted = 0;
    state.bump = ctx.bumps.airdrop_state;
    Ok(())
}