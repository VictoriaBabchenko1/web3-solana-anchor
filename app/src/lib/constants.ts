import { PublicKey } from "@solana/web3.js";
import type { Cluster } from "@solana/web3.js";

export const CLUSTER = (import.meta.env.VITE_CLUSTER || 'devnet')  as Cluster;
export const MINT = new PublicKey(import.meta.env.VITE_MINT || '');
export const WHITELIST_SEED = import.meta.env.VITE_WHITELIST_SEED || 'whitelist';
export const VAULT_SEED = import.meta.env.VITE_VAULT_SEED || "vault";
export const NFT_AIRDROP_STATE_SEED = import.meta.env.VITE_NFT_AIRDROP_STATE_SEED || "airdrop_state";
export const RECIPIENT_CLAIM_STATUS_SEED = import.meta.env.VITE_RECIPIENT_CLAIM_STATUS_SEED || "claim_status";
export const MINT_LIST_SEED = import.meta.env.VITE_MINT_LIST_SEED || "mint_list";
export const STAKE_STATE_SEED = import.meta.env.VITE_STAKE_STATE_SEED || "stake_state";
export const REWARD_VAULT_SEED = import.meta.env.VITE_REWARD_VAULT_SEED || "reward_vault";
export const USER_STAKE_SEED = import.meta.env.VITE_USER_STAKE_SEED || "user_stake";
export const USER_STAKE_VAULT_SEED = import.meta.env.VITE_USER_STAKE_VAULT_SEED || "user_stake_vault";