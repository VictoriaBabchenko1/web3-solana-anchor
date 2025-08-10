use anchor_lang::prelude::*;
use anchor_spl::token_interface::{ TokenAccount, Mint, TokenInterface, TransferChecked, self };
use crate::state::{ StakeState, UserStakeAccount };
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

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
        mut,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStakeAccount>,
    
    #[account(
        mut, 
        seeds = [b"stake_state"], 
        bump
    )]
    pub stake_state: Account<'info, StakeState>,

    /// CHECK: This PDA owns the reward vault
    #[account(
        mut,
        seeds = [b"reward_vault"],
        bump
    )]
    pub reward_vault: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = reward_vault,
        associated_token::token_program = token_program
    )]
    pub reward_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let clock = Clock::get()?;
    let user_stake = &mut ctx.accounts.user_stake;
    let stake_state = &ctx.accounts.stake_state;

    let now = clock.unix_timestamp;
    let lock_end = user_stake.start_time + user_stake.lock_period;
    let effective_now = now.min(lock_end);
    let duration = effective_now - user_stake.last_reward_update_time;

    let yearly_reward = user_stake.stake_amount
        .checked_mul(stake_state.apr)
        .ok_or(CustomError::NumericalOverflow)?
        .checked_div(100)
        .ok_or(CustomError::NumericalOverflow)?;

    let reward = yearly_reward
        .checked_mul(duration as u64)
        .ok_or(CustomError::NumericalOverflow)?
        .checked_div(365 * 24 * 60 * 60)
        .ok_or(CustomError::NumericalOverflow)?;
    
    require!(reward > 0, CustomError::NoReward);

    user_stake.last_reward_update_time = effective_now;
    user_stake.claimed_reward = user_stake
        .claimed_reward
        .checked_add(reward)
        .ok_or(CustomError::NumericalOverflow)?;

    let signer_seeds: &[&[&[u8]]] = &[&[b"reward_vault", &[ctx.bumps.reward_vault]]];
    let decimals = ctx.accounts.mint.decimals;

    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.reward_vault_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.reward_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    token_interface::transfer_checked(cpi_ctx, reward, decimals)?;

    Ok(())
}
