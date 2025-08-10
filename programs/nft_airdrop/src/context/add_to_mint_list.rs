use anchor_lang::prelude::*;
use crate::errors::CustomError;
use crate::state::MintList;

#[derive(Accounts)]
pub struct AddToMintList<'info> {
    #[account(mut, has_one = authority)]
    pub mint_list: Account<'info, MintList>,

    #[account(mut, signer)]
    pub authority: Signer<'info>,
}

pub fn add_to_mint_list(ctx: Context<AddToMintList>, mint: Pubkey) -> Result<()> {
    let mint_list = &mut ctx.accounts.mint_list;
    
    require!(
        ctx.accounts.authority.key() == mint_list.authority,
        CustomError::Unauthorized
    );
    
    mint_list.mints.push(mint);
    mint_list.used.push(false);
    Ok(())
}
