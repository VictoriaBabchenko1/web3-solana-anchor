use anchor_lang::prelude::*;
use crate::state::{AirdropState, ClaimStatus};

#[derive(Accounts)]
pub struct ResetClaimStatus<'info> {
    #[account(
        seeds = [b"airdrop_state"],
        bump = airdrop_state.bump,
    )]
    pub airdrop_state: Account<'info, AirdropState>,

    #[account(mut, seeds = [b"claim_status", recipient.key().as_ref()], bump)]
    pub claim_status: Account<'info, ClaimStatus>,

    /// CHECK: recipient
    pub recipient: AccountInfo<'info>,
    
    #[account(
        signer,
        constraint = signer.key() == airdrop_state.authority
    )]
    pub signer: Signer<'info>,
}

pub fn reset_claim_status(ctx: Context<ResetClaimStatus>) -> Result<()> {
    ctx.accounts.claim_status.claimed = false;
    Ok(())
}