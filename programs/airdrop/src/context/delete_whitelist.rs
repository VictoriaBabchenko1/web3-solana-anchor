use anchor_lang::prelude::*;
use crate::state::whitelist::Whitelist;
use crate::error::CustomError;

#[derive(Accounts)]
pub struct DeleteWhitelist<'info> {
    #[account(mut, close = authority, seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn delete_whitelist(ctx: Context<DeleteWhitelist>) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.whitelist.authority,
        CustomError::Unauthorized
    );
    Ok(())
}