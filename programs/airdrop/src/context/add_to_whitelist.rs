use anchor_lang::prelude::*;
use crate::constants::MAX_WHITELIST_SIZE;
use crate::state::whitelist::Whitelist;
use crate::error::CustomError;

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(mut, seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, new_user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    require!(
        ctx.accounts.authority.key() == whitelist.authority,
        CustomError::Unauthorized
    );

    require!(
        whitelist.whitelist.len() < MAX_WHITELIST_SIZE,
        CustomError::WhitelistFull
    );

    require!(
        !whitelist.whitelist.contains(&new_user),
        CustomError::UserAlreadyWhitelisted
    );

    whitelist.whitelist.push(new_user);
    Ok(())
}