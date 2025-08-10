use anchor_lang::prelude::*;
pub mod context;
pub mod state;
pub mod errors;
use context::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod nft_airdrop {
    use super::*;
    
    pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
        context::mint_nft(ctx)
    }

    pub fn initialize_airdrop(ctx: Context<InitializeAirdrop>, max_supply: u64) -> Result<()> {
        context::initialize_airdrop(ctx, max_supply)
    }

    pub fn close_airdrop_state(ctx: Context<CloseAirdropState>) -> Result<()> {
        context::close_airdrop_state(ctx)
    }

    pub fn reset_claim_status(ctx: Context<ResetClaimStatus>) -> Result<()> {
        context::reset_claim_status(ctx)
    }

    pub fn initialize_mint_list(ctx: Context<InitializeMintList>, _max_mints: u32) -> Result<()> {
        context::initialize_mint_list(ctx, _max_mints)
    }

    pub fn add_to_mint_list(ctx: Context<AddToMintList>, mint: Pubkey) -> Result<()> {
        context::add_to_mint_list(ctx, mint)
    }

    pub fn delete_mint_list(ctx: Context<DeleteMintList>) -> Result<()> {
        context::delete_mint_list(ctx)
    }

    pub fn claim_nft(ctx: Context<ClaimNft>) -> Result<()> {
        context::claim_nft(ctx)
    }
}
