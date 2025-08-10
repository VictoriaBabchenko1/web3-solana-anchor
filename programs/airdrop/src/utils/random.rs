use anchor_lang::prelude::*;
use anchor_spl::token::spl_token::solana_program::keccak;

pub fn pseudo_random_u8( client_seed: u64, user: &Pubkey, program_id: &Pubkey, min: u8, max: u8, ) -> u8 {
    let mut seed = Vec::new();
    seed.extend_from_slice(&client_seed.to_le_bytes());
    seed.extend_from_slice(user.as_ref());
    seed.extend_from_slice(program_id.as_ref());

    let hash = keccak::hash(&seed);
    let raw = u64::from_be_bytes(hash.0[..8].try_into().unwrap());
    let range = (max - min + 1) as u64;
    ((raw % range) as u8) + min
}