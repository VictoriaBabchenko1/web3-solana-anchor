import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { getTokenAirdropProgram, getWhitelistPDA } from "../../lib/anchor-client";
import type { Wallet } from "@coral-xyz/anchor";

export const useWhitelist = () => {
    const wallet = useAnchorWallet() as Wallet;

    const checkWhitelist = useCallback(
        async (addressToCheck: PublicKey): Promise<boolean> => {
            if (!wallet || !wallet.publicKey) throw new Error('Wallet not connected');

            const program = getTokenAirdropProgram(wallet);
            const [whitelistPDA] = getWhitelistPDA(program.programId);

            try {
                await program.methods
                    .checkWhitelist(addressToCheck)
                    .accounts({
                        whitelist: whitelistPDA,
                    })
                    .simulate();

                return true;
            } catch (err) {
                console.error("Not whitelisted or whitelist is not initialized " + err);
                return false;
            }
        },
        [wallet]
    );

    return { checkWhitelist };
};