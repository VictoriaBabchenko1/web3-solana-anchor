import tokenAirdropIdl from './idl/airdrop.json';
import nftAirdropIdl from './idl/nft_airdrop.json' with { type: "json" };
import splTokenStakingIdl from './idl/spl_token_staking.json' with { type: "json" };
import { connection } from "./connection";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
    CLUSTER, MINT,
    MINT_LIST_SEED,
    NFT_AIRDROP_STATE_SEED,
    RECIPIENT_CLAIM_STATUS_SEED,
    REWARD_VAULT_SEED,
    STAKE_STATE_SEED,
    USER_STAKE_SEED,
    USER_STAKE_VAULT_SEED,
    VAULT_SEED,
    WHITELIST_SEED
} from "./constants";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import type { Wallet } from "@coral-xyz/anchor";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const getProvider = (wallet: Wallet) => {
    return new AnchorProvider(connection, wallet, {});
};

export const getTokenAirdropProgram = (wallet: Wallet) => {
    const provider = getProvider(wallet);
    return new Program(tokenAirdropIdl, provider);
};

export const getNftAirdropProgram = (wallet: Wallet) => {
    const provider = getProvider(wallet);
    return new Program(nftAirdropIdl, provider);
};

export const getSplTokenStakingProgram = (wallet: Wallet) => {
    const provider = getProvider(wallet);
    return new Program(splTokenStakingIdl, provider);
};

export const getWhitelistPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(WHITELIST_SEED)],
        programId
    );
};

export const getVaultPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED)],
        programId
    );
};

export const getNftAirdropStatePDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(NFT_AIRDROP_STATE_SEED)],
        programId
    );
};

export const getRecipientClaimStatusPDA = (programId: PublicKey, recipient: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(RECIPIENT_CLAIM_STATUS_SEED), recipient.toBuffer()],
        programId
    );
};

export const getUmi = (wallet: Wallet) => {
    const umi = createUmi(`https://api.${CLUSTER}.solana.com`).use(mplTokenMetadata());
    umi.use(walletAdapterIdentity(wallet))
    return umi;
}

export const getMintListPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(MINT_LIST_SEED)],
        programId
    );
};

export const getStakeStatePDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(STAKE_STATE_SEED)],
        programId
    );
};

export const getRewardVaultPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(REWARD_VAULT_SEED)],
        programId
    );
};

export const getUserStakePDA = (programId: PublicKey, user: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(USER_STAKE_SEED), user.toBuffer()],
        programId
    );
};

export const getUserStakeVaultPDA = (programId: PublicKey, user: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(USER_STAKE_VAULT_SEED), user.toBuffer()],
        programId
    );
};

export const getMintDecimals = async (): Promise<number> => {
    const mintInfo = await getMint(connection, MINT, "finalized", TOKEN_2022_PROGRAM_ID);
    return mintInfo.decimals;
};