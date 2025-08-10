use anchor_lang::prelude::*;
use crate::state::MintList;
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct DeleteMintList<'info> {
    #[account(mut, close = authority, has_one = authority)]
    pub mint_list: Account<'info, MintList>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn delete_mint_list(ctx: Context<DeleteMintList>) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.mint_list.authority,
        CustomError::Unauthorized
    );

    Ok(())
}