use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, metadata::{
    create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
    CreateMetadataAccountsV3, Metadata,
}, token::{ mint_to, Mint, MintTo, Token, TokenAccount }};
use mpl_token_metadata::types::DataV2;
use mpl_token_metadata::accounts::{ MasterEdition, Metadata as MetadataAccount };
use crate::errors::CustomError;
use crate::state::{ AirdropState, ClaimStatus };

#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut, signer)]
    pub signer: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"airdrop_state"],
        bump = airdrop_state.bump,
    )]
    pub airdrop_state: Account<'info, AirdropState>,

    #[account(
        init_if_needed,
        seeds = [b"claim_status", recipient.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 1
    )]
    pub claim_status: Account<'info, ClaimStatus>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: recipient address
    #[account(mut, signer)]
    pub recipient: AccountInfo<'info>,

    /// CHECK - address
    #[account(
        mut,
        address = MetadataAccount::find_pda(&mint.key()).0,
    )]
    pub metadata_account: UncheckedAccount<'info>,

    /// CHECK - address
    #[account(
        mut,
        address = MasterEdition::find_pda(&mint.key()).0,
    )]
    pub master_edition_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_metadata_program: Program<'info, Metadata>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
    let state = &mut ctx.accounts.airdrop_state;
    let claim_status = &mut ctx.accounts.claim_status;
    
    require!(state.minted < state.max_supply, CustomError::AirdropLimitReached);
    require!(!claim_status.claimed, CustomError::AlreadyClaimed);

    let mint_to_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        },
    );
    mint_to(mint_to_ctx, 1)?;

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.metadata_account.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.signer.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                update_authority: ctx.accounts.signer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: "ANGEL NFT".to_string(),
            symbol: "ANGL".to_string(),
            uri: "https://gray-changing-dinosaur-853.mypinata.cloud/ipfs/bafkreicnxwjmo4tcbh7wjltrioerwgsxtmpmzovdvbrmlzagnadeokb7oe".to_string(),
            seller_fee_basis_points: 5,
            creators: None,
            collection: None,
            uses: None,
        },
        false,
        true,
        None,
    )?;

    create_master_edition_v3(
        CpiContext::new(
            ctx.accounts.metadata_account.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint_authority: ctx.accounts.signer.to_account_info(),
                update_authority: ctx.accounts.signer.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        Some(1),
    )?;

    state.minted += 1;
    claim_status.claimed = true;
    
    Ok(())
}