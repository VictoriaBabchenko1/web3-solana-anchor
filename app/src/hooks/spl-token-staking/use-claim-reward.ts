import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getSplTokenStakingProgram, getUserStakePDA, getStakeStatePDA, getRewardVaultPDA } from "../../lib/anchor-client";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { Wallet } from "@coral-xyz/anchor";
import { MINT } from "../../lib/constants";
import { connection } from "../../lib/connection.ts";

export const useClaimReward = () => {
    const wallet = useAnchorWallet() as Wallet;

    const claimReward = useCallback(async () => {
        if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

        try {
            const program = getSplTokenStakingProgram(wallet);
            const user = wallet.publicKey;
            const [userStakePda] = getUserStakePDA(program.programId, user);
            const [stakeStatePda] = getStakeStatePDA(program.programId);
            const [rewardVaultPda] = getRewardVaultPDA(program.programId);

            const userTokenAccount = await getAssociatedTokenAddress(
                MINT,
                user,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const rewardVaultTokenAccount = await getAssociatedTokenAddress(
                MINT,
                rewardVaultPda,
                true,
                TOKEN_2022_PROGRAM_ID
            );

            const txSig = await program.methods
                .claimReward()
                .accounts({
                    user,
                    mint: MINT,
                    userTokenAccount: userTokenAccount,
                    userStake: userStakePda,
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

            console.log("Reward tokens claimed");
        } catch (err) {
            console.error("Error claiming reward tokens: ", err);
            throw err;
        }
    }, [wallet]);

    return { claimReward };
};