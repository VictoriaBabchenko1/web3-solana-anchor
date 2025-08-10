use anchor_lang::prelude::*;

#[account]
pub struct UserStakeAccount {
    pub owner: Pubkey,
    pub stake_amount: u64,
    pub start_time: i64,
    pub lock_period: i64,
    pub claimed_reward: u64,
    pub last_reward_update_time: i64,
    pub bump: u8,
}