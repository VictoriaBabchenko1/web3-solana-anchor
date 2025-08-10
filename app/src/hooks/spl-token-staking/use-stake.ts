import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getSplTokenStakingProgram, getUserStakeVaultPDA, getUserStakePDA } from "../../lib/anchor-client";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";
import { MINT } from "../../lib/constants";
import BN from "bn.js";
import { connection } from "../../lib/connection.ts";

export const useStakeTokens = () => {
    const wallet = useAnchorWallet() as Wallet;

    const stakeTokens = useCallback(async (amount: number, lockPeriodInSeconds: number) => {
        if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

        try {
            const program = getSplTokenStakingProgram(wallet);
            const user = wallet.publicKey;
            const [userStakePda] = getUserStakePDA(program.programId, user);
            const [userStakeVaultPda] = getUserStakeVaultPDA(program.programId, user);

            const userTokenAccount = await getAssociatedTokenAddress(
                MINT,
                user,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const userStakeVaultTokenAccount = await getAssociatedTokenAddress(
                MINT,
                userStakeVaultPda,
                true,
                TOKEN_2022_PROGRAM_ID
            );

            const txSig = await program.methods
                .stake(new BN(amount), new BN(lockPeriodInSeconds))
                .accounts({
                    user,
                    payer: user,
                    mint: MINT,
                    userTokenAccount,
                    userStake: userStakePda,
                    userStakeVault: userStakeVaultPda,
                    userStakeVaultTokenAccount,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txSig,
            }, 'finalized');

            console.log("Tokens Staked");
        } catch (err) {
            console.error("Error staking tokens: ", err);
            throw err;
        }
    }, [wallet]);

    return { stakeTokens };
};