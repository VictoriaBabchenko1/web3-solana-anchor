use anchor_lang::prelude::*;
use crate::state::whitelist::Whitelist;
use crate::error::CustomError;

#[derive(Accounts)]
pub struct CheckWhitelist<'info> {
    #[account(seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,
}

pub fn check_whitelist(ctx: Context<CheckWhitelist>, user: Pubkey) -> Result<()> {
    require!(
        ctx.accounts.whitelist.whitelist.contains(&user),
        CustomError::NotInWhitelist
    );
    Ok(())
}