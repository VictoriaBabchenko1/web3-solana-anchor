use anchor_lang::prelude::*;

#[account]
pub struct Whitelist {
    pub authority: Pubkey,
    pub whitelist: Vec<Pubkey>,
}