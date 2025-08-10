use anchor_lang::prelude::*;

#[account]
pub struct AirdropState {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub minted: u64,
    pub bump: u8,
}