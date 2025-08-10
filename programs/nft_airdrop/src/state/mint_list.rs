use anchor_lang::prelude::*;

#[account]
pub struct MintList {
    pub mints: Vec<Pubkey>,
    pub used: Vec<bool>,
    pub authority: Pubkey,
    pub bump: u8,
}