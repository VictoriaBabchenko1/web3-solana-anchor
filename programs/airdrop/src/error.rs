use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    
    #[msg("Address not found in whitelist.")]
    NotInWhitelist,

    #[msg("Overflow occurred during calculation")]
    NumericalOverflow,

    #[msg("Generated random token amount is out of allowed range.")]
    AmountOutOfRange,
    
    #[msg("User already whitelisted.")]
    UserAlreadyWhitelisted,

    #[msg("Whitelist is full.")]
    WhitelistFull,
}