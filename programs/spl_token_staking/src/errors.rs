use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("No reward to claim")]
    NoReward,

    #[msg("Overflow occurred during calculation")]
    NumericalOverflow,

    #[msg("User has already staked tokens")]
    AlreadyStaked,

    #[msg("Lock period has not ended yet")]
    LockPeriodNotEnded
}