use anchor_lang::prelude::*;
use crate::state::whitelist::Whitelist;
use crate::constants::MAX_WHITELIST_SIZE;

#[derive(Accounts)]
#[instruction(_whitelist: Vec<Pubkey>)]
pub struct InitializeWhitelist<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 4 + (32 * MAX_WHITELIST_SIZE), seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>, whitelist: Vec<Pubkey>) -> Result<()> {
    let account = &mut ctx.accounts.whitelist;
    account.authority = ctx.accounts.authority.key();
    account.whitelist = whitelist;
    Ok(())
}