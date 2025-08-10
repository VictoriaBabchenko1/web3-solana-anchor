use anchor_lang::prelude::*;
use crate::state::MintList;

#[derive(Accounts)]
#[instruction(max_mints: u32)]
pub struct InitializeMintList<'info> {
    #[account(
        init,
        seeds = [b"mint_list"],
        bump,
        payer = authority,
        space = 8 + 32 + (4 + 32 * max_mints as usize) + (4 + 1 * max_mints as usize) + 8,
    )]
    pub mint_list: Account<'info, MintList>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}


pub fn initialize_mint_list(ctx: Context<InitializeMintList>, _max_mints: u32) -> Result<()> {
    let mint_list = &mut ctx.accounts.mint_list;

    mint_list.mints = Vec::new();
    mint_list.used = Vec::new();
    mint_list.authority = ctx.accounts.authority.key();

    Ok(())
}