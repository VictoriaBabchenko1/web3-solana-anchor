import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getTokenAirdropProgram, getVaultPDA } from "../../lib/anchor-client";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { MINT } from "../../lib/constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import type { Wallet } from "@coral-xyz/anchor";

export const useClaimTokens = () => {
    const wallet = useAnchorWallet() as Wallet;

    const claimTokens = useCallback(async () => {
        if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

        try {
            const program = getTokenAirdropProgram(wallet);
            const [vaultPDA] = getVaultPDA(program.programId);
            const clientSeed = new BN(Date.now());

            const vaultTokenAccount = await getAssociatedTokenAddress(
                MINT,
                vaultPDA,
                true,
                TOKEN_2022_PROGRAM_ID
            );
            const recipientTokenAccount = await getAssociatedTokenAddress(
                MINT,
                wallet.publicKey,
            false,
                TOKEN_2022_PROGRAM_ID
            )

            await program.methods
                .claimRandomTokensAmount(clientSeed)
                .accounts({
                    vault: vaultPDA,
                    mint: MINT,
                    vaultTokenAccount,
                    recipientTokenAccount,
                    payer: wallet.publicKey,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .rpc({ commitment: "confirmed" });
        } catch (error) {
            console.error("Error claiming tokens:", error);
            throw error;
        }
    }, [wallet]);

    return { claimTokens };
};