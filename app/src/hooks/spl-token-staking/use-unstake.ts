import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
    getSplTokenStakingProgram,
    getUserStakeVaultPDA,
    getUserStakePDA,
    getStakeStatePDA,
    getRewardVaultPDA
} from "../../lib/anchor-client";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { Wallet } from "@coral-xyz/anchor";
import { MINT } from "../../lib/constants";
import { connection } from "../../lib/connection.ts";

export const useUnstakeTokens = () => {
    const wallet = useAnchorWallet() as Wallet;

    const unstakeTokens = useCallback(async () => {
        if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

        try {
            const program = getSplTokenStakingProgram(wallet);
            const user = wallet.publicKey;
            const [userStakePda] = getUserStakePDA(program.programId, user);
            const [userStakeVaultPda] = getUserStakeVaultPDA(program.programId, user);
            const [stakeStatePda] = getStakeStatePDA(program.programId);
            const [rewardVaultPda] = getRewardVaultPDA(program.programId);

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

            const rewardVaultTokenAccount = await getAssociatedTokenAddress(
                MINT,
                rewardVaultPda,
                true,
                TOKEN_2022_PROGRAM_ID
            );

            const txSig = await program.methods
                .unstake()
                .accounts({
                    user,
                    mint: MINT,
                    userTokenAccount,
                    userStake: userStakePda,
                    userStakeVault: userStakeVaultPda,
                    userStakeVaultTokenAccount,
                    stakeState: stakeStatePda,
                    rewardVault: rewardVaultPda,
                    rewardVaultTokenAccount,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .rpc();

            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txSig,
            }, 'finalized');

            console.log("Tokens Unstaked");
        } catch (err) {
            console.error("Error unstaking tokens: ", err);
            throw err;
        }
    }, [wallet]);

    return { unstakeTokens };
};