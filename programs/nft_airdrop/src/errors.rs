use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Airdrop limit has been reached.")]
    AirdropLimitReached,

    #[msg("This address has already claimed an NFT.")]
    AlreadyClaimed,

    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    
    #[msg("Invalid Mint")]
    InvalidMint
}