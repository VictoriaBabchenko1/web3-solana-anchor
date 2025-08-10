use anchor_lang::prelude::*;
use crate::state::whitelist::Whitelist;
use crate::error::CustomError;

#[derive(Accounts)]
pub struct RemoveFromWhitelist<'info> {
    #[account(mut, seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn remove_from_whitelist(ctx: Context<RemoveFromWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    require!(
        ctx.accounts.authority.key() == whitelist.authority,
        CustomError::Unauthorized
    );

    whitelist.whitelist.retain(|x| x != &user);
    Ok(())
}