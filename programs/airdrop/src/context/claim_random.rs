use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount, Mint, TokenInterface, TransferChecked, self};
use crate::utils::random::pseudo_random_u8;
use crate::state::whitelist::Whitelist;
use crate::error::CustomError;
use crate::constants::MIN_RANDOM_AMOUNT;
use crate::constants::MAX_RANDOM_AMOUNT;

#[derive(Accounts)]
pub struct ClaimRandomTokensAmount<'info> {
    /// CHECK: This is a PDA (vault), validated via constraint seeds + bump and only used as a signer.
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,

    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,

    #[account(seeds = [b"whitelist"], bump)]
    pub whitelist: Account<'info, Whitelist>,
}

pub fn claim_random_tokens_amount(ctx: Context<ClaimRandomTokensAmount>, client_seed: u64) -> Result<()> {
    let recipient_owner = ctx.accounts.recipient_token_account.owner;

    require!(
        ctx.accounts.whitelist.whitelist.contains(&recipient_owner),
        CustomError::NotInWhitelist
    );

    let decimals = ctx.accounts.mint.decimals;
    let raw_amount = pseudo_random_u8(client_seed, &recipient_owner, ctx.program_id, 1, 10) as u64;
    let amount = raw_amount
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(CustomError::NumericalOverflow)?;
    let min_allowed = (MIN_RANDOM_AMOUNT as u64)
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(CustomError::NumericalOverflow)?;
    let max_allowed = (MAX_RANDOM_AMOUNT as u64)
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(CustomError::NumericalOverflow)?;

    require!(
        amount >= min_allowed && amount <= max_allowed,
        CustomError::AmountOutOfRange
    );

    let signer_seeds: &[&[&[u8]]] = &[&[b"vault", &[ctx.bumps.vault]]];
    
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.vault.clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    token_interface::transfer_checked(cpi_ctx, amount, decimals)?;
    Ok(())
}