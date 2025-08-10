use anchor_lang::prelude::*;

#[account]
pub struct StakeState {
    pub apr: u64,
    pub authority: Pubkey,
}