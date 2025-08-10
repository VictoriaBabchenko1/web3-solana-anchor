use anchor_lang::prelude::*;
use anchor_spl::{
    token::{ Token, TokenAccount, Transfer, transfer },
    associated_token::{ AssociatedToken },
};
use anchor_spl::token_interface::Mint;
use crate::state::{ MintList, ClaimStatus };
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct ClaimNft<'info> {
    #[account(mut, seeds = [b"mint_list"], bump)]
    pub mint_list: Account<'info, MintList>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: This is a PDA (vault), validated via constraint seeds + bump and only used as a signer.
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        seeds = [b"claim_status", recipient.key().as_ref()],
        bump,
        payer = recipient,
        space = 8 + 1
    )]
    pub claim_status: Account<'info, ClaimStatus>,

    pub token_program: Program<'info, Token>,
    
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    pub system_program: Program<'info, System>,
}

pub fn claim_nft(ctx: Context<ClaimNft>) -> Result<()> {
    let mint_list = &mut ctx.accounts.mint_list;
    let claim_status = &mut ctx.accounts.claim_status;

    let mint = ctx.accounts.mint.key();
    let index = mint_list
        .mints
        .iter()
        .position(|&m| m == mint)
        .ok_or_else(|| error!(CustomError::InvalidMint))?;

    if mint_list.used[index] {
        return Err(error!(CustomError::AlreadyClaimed));
    }


    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
    );

    transfer(cpi_ctx.with_signer(&[&[b"vault", &[ctx.bumps.vault]]]), 1)?;

    mint_list.used[index] = true;
    claim_status.claimed = true;

    Ok(())
}