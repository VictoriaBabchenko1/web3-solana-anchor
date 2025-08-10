import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
    getNftAirdropStatePDA,
    getNftAirdropProgram,
    getRecipientClaimStatusPDA,
    getUmi,
    getVaultPDA,
    getMintListPDA
} from "../../lib/anchor-client";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { findMasterEditionPda, findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import type { Wallet } from "@coral-xyz/anchor";

export const useMintNft = () => {
    const wallet = useAnchorWallet() as Wallet;

    const mintNft = useCallback(async () => {
        if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

        try {
            const program = getNftAirdropProgram(wallet);
            const umi = getUmi(wallet);
            const [nftAirdropStatePDA] = getNftAirdropStatePDA(program.programId);
            const mintKeypair = Keypair.generate();
            const recipient = wallet.publicKey;
            const recipientTokenAccount = await getAssociatedTokenAddress(mintKeypair.publicKey, recipient);
            const [recipientClaimStatusPda] = getRecipientClaimStatusPDA(program.programId, recipient);
            const metadataAccount = findMetadataPda(umi, { mint: publicKey(mintKeypair.publicKey) })[0];
            const masterEditionAccount = findMasterEditionPda(umi, { mint: publicKey(mintKeypair.publicKey) })[0];

            await program.methods
                .mintNft()
                .accounts({
                    signer: recipient,
                    airdropState: nftAirdropStatePDA,
                    claimStatus: recipientClaimStatusPda,
                    mint: mintKeypair.publicKey,
                    recipient,
                    recipientTokenAccount,
                    metadataAccount,
                    masterEditionAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([mintKeypair])
                .rpc({ commitment: "confirmed" });
        } catch (err) {
            console.error("Error minting NFT:", err);
            throw err;
        }
    }, [wallet]);

    const hasMinted = useCallback(async (): Promise<boolean> => {
        const program = getNftAirdropProgram(wallet);
        const [claimStatusPDA] = getRecipientClaimStatusPDA(program.programId, wallet.publicKey);

        try {
            const account = await (program.account as any).claimStatus.fetch(claimStatusPDA);
            return account.claimed;
        } catch (e) {
            return false;
        }
    }, [wallet]);

    const claimNft = useCallback(
        async () => {
            if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");

            try {
                const program = getNftAirdropProgram(wallet);
                const recipient = wallet.publicKey;
                const [mintListPDA] = getMintListPDA(program.programId);
                const [vaultPDA] = getVaultPDA(program.programId);
                const [claimStatusPDA] = getRecipientClaimStatusPDA(program.programId, recipient);
                const mintList = await (program.account as any).mintList.fetch(mintListPDA);

                const index = mintList.used.findIndex((used: boolean) => !used);
                if (index === -1) throw new Error("No available NFTs to claim");

                const mint = mintList.mints[index];

                const vaultTokenAccount = await getAssociatedTokenAddress(
                    mint,
                    vaultPDA,
                    true
                );
                const recipientTokenAccount = await getAssociatedTokenAddress(
                    mint,
                    recipient
                );

                await program.methods
                    .claimNft()
                    .accounts({
                        mintList: mintListPDA,
                        mint: mint,
                        vault: vaultPDA,
                        recipient: recipient,
                        vaultTokenAccount,
                        recipientTokenAccount,
                        claimStatus: claimStatusPDA,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc({ commitment: "confirmed" });

                console.log("NFT minted!");
            } catch (err) {
                console.error("Error claiming NFT:", err);
                throw err;
            }
        },
        [wallet]
    );

    return { mintNft, hasMinted, claimNft };
};