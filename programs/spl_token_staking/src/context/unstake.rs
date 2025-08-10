use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount, Mint, TokenInterface, TransferChecked, self };
use crate::errors::CustomError;
use crate::state::{StakeState, UserStakeAccount};

#[derive(Accounts)]
pub struct Unstake<'info> {
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
        close = user,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStakeAccount>,

    /// CHECK: PDA used as authority for the vault token account
    #[account(
        seeds = [b"user_stake_vault", user.key().as_ref()],
        bump
    )]
    pub user_stake_vault: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user_stake_vault,
        associated_token::token_program = token_program
    )]
    pub user_stake_vault_token_account: InterfaceAccount<'info, TokenAccount>,

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

pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    let user_stake = &mut ctx.accounts.user_stake;
    let lock_end_time = user_stake.start_time + user_stake.lock_period;

    require!(
        now >= lock_end_time,
        CustomError::LockPeriodNotEnded
    );

    let reward_duration = (lock_end_time - user_stake.last_reward_update_time)
        .max(0) as u64;

    if reward_duration > 0 {
        let stake_state = &ctx.accounts.stake_state;
        let yearly_reward = user_stake
            .stake_amount
            .checked_mul(stake_state.apr)
            .ok_or(CustomError::NumericalOverflow)?
            .checked_div(100)
            .ok_or(CustomError::NumericalOverflow)?;

        let pending_reward = yearly_reward
            .checked_mul(reward_duration)
            .ok_or(CustomError::NumericalOverflow)?
            .checked_div(365 * 24 * 60 * 60)
            .ok_or(CustomError::NumericalOverflow)?;

        if pending_reward > 0 {
            let signer_seeds: &[&[&[u8]]] = &[&[b"reward_vault", &[ctx.bumps.reward_vault]]];

            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.reward_vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.reward_vault.to_account_info(),
                },
            ).with_signer(signer_seeds);

            token_interface::transfer_checked(cpi_ctx, pending_reward, ctx.accounts.mint.decimals)?;

            user_stake.claimed_reward = user_stake
                .claimed_reward
                .checked_add(pending_reward)
                .ok_or(CustomError::NumericalOverflow)?;
        }

        user_stake.last_reward_update_time = lock_end_time;
    }
    
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"user_stake_vault",
        ctx.accounts.user.key.as_ref(),
        &[ctx.bumps.user_stake_vault],
    ]];
    
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.user_stake_vault_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.user_stake_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    token_interface::transfer_checked(cpi_ctx, user_stake.stake_amount, ctx.accounts.mint.decimals)?;

    Ok(())
}