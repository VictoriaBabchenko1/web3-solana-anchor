use anchor_lang::prelude::*;

#[account]
pub struct ClaimStatus {
    pub claimed: bool,
}