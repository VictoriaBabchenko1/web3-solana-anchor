use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{ TokenAccount, Mint, TokenInterface, TransferChecked, self };
use crate::errors::CustomError;
use crate::state::UserStakeAccount;


#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStakeAccount>,

    /// CHECK: PDA used as authority for the vault token account
    #[account(
        init_if_needed,
        payer = payer,
        space = 8,
        seeds = [b"user_stake_vault", user.key().as_ref()],
        bump
    )]
    pub user_stake_vault: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = user_stake_vault,
        associated_token::token_program = token_program
    )]
    pub user_stake_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    pub system_program: Program<'info, System>,
}

pub fn stake(ctx: Context<Stake>, amount: u64, lock_period: i64) -> Result<()> {
    let clock = Clock::get()?;
    let user_stake = &mut ctx.accounts.user_stake;

    require!(user_stake.stake_amount == 0, CustomError::AlreadyStaked);

    let decimals = ctx.accounts.mint.decimals;
    let amount = amount
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(CustomError::NumericalOverflow)?;
    
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.user_stake_vault_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token_interface::transfer_checked(cpi_ctx, amount, decimals)?;

    user_stake.owner = *ctx.accounts.user.key;
    user_stake.stake_amount = amount;
    user_stake.start_time = clock.unix_timestamp;
    user_stake.lock_period = lock_period;
    user_stake.claimed_reward = 0;
    user_stake.last_reward_update_time = clock.unix_timestamp;
    user_stake.bump = ctx.bumps.user_stake;

    Ok(())
}