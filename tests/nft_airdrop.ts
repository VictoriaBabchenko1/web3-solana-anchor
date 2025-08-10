import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idl from "../target/idl/nft_airdrop.json" with { type: "json" };
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    findMasterEditionPda,
    findMetadataPda,
    MPL_TOKEN_METADATA_PROGRAM_ID,
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import * as dotenv from "dotenv";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import fs from "fs";
import BN from "bn.js";
import assert from "node:assert";

describe("nft_airdrop", () => {
    let provider: anchor.AnchorProvider;
    let program: Program;
    let signerKeypair: Keypair;
    let umi: any;
    let airdropStatePda: PublicKey;
    let recipientKeypair: Keypair;
    let recipientClaimStatusPda: PublicKey;

    before(async () => {
        dotenv.config();
        provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);
        program = new Program(idl, provider);
        const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
        signerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

        umi = createUmi((process.env.ANCHOR_PROVIDER_URL).toString()).use(mplTokenMetadata());
        const umiKeypair = fromWeb3JsKeypair(signerKeypair);
        umi.use(keypairIdentity(umiKeypair));

        recipientKeypair = Keypair.generate();
        const [recipientClaimStatus] = PublicKey.findProgramAddressSync(
            [Buffer.from("claim_status"), recipientKeypair.publicKey.toBuffer()],
            program.programId
        );
        recipientClaimStatusPda = recipientClaimStatus;

        const [airdropState] = PublicKey.findProgramAddressSync(
            [Buffer.from("airdrop_state")],
            program.programId
        );
        airdropStatePda = airdropState;
    });

    it("Initializes the airdrop state", async () => {
        const accountInfo = await provider.connection.getAccountInfo(airdropStatePda);
        if (accountInfo !== null) {
            console.log("Airdrop state already exists, initialization skipped.");
            return;
        }

        const tx = await program.methods
            .initializeAirdrop(new BN(10))
            .accounts({
                authority: signerKeypair.publicKey,
                airdropState: airdropStatePda,
                systemProgram: SystemProgram.programId,
            })
            .signers([signerKeypair])
            .rpc();

        console.log(`Initialized Airdrop State: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
        console.log(`Airdrop State address: https://explorer.solana.com/address/${airdropStatePda}?cluster=devnet`);
    });

    it("Successfully mints an NFT to recipient", async () => {
        const mint = Keypair.generate();
        const recipientTokenAccount = await getAssociatedTokenAddress(mint.publicKey, recipientKeypair.publicKey);
        const metadataAccount = findMetadataPda(umi, { mint: publicKey(mint.publicKey) })[0];
        const masterEditionAccount = findMasterEditionPda(umi, { mint: publicKey(mint.publicKey) })[0];

        const tx = await program.methods
            .mintNft()
            .accounts({
                signer: signerKeypair.publicKey,
                airdropState: airdropStatePda,
                claimStatus: recipientClaimStatusPda,
                mint: mint.publicKey,
                recipient: recipientKeypair.publicKey,
                recipientTokenAccount,
                metadataAccount,
                masterEditionAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .signers([mint, recipientKeypair])
            .rpc();

        console.log(`Mint NFT tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
        console.log(`Minted NFT address: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);
    });

    it("Fails to mint NFT again to the same recipient", async () => {
        const secondMint = Keypair.generate();
        const secondRecipientTokenAccount = await getAssociatedTokenAddress(secondMint.publicKey, recipientKeypair.publicKey);
        const secondMetadataAccount = findMetadataPda(umi, { mint: publicKey(secondMint.publicKey) })[0];
        const secondMasterEditionAccount = findMasterEditionPda(umi, { mint: publicKey(secondMint.publicKey) })[0];

        try {
            await program.methods
                .mintNft()
                .accounts({
                    signer: signerKeypair.publicKey,
                    airdropState: airdropStatePda,
                    claimStatus: recipientClaimStatusPda,
                    mint: secondMint.publicKey,
                    recipient: recipientKeypair.publicKey,
                    recipientTokenAccount: secondRecipientTokenAccount,
                    metadataAccount: secondMetadataAccount,
                    masterEditionAccount: secondMasterEditionAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([secondMint, recipientKeypair])
                .rpc();

            assert.fail("Expected error due to already claimed NFT, but transaction succeeded");
        } catch (err) {
            const errMsg = err.error?.errorMessage || err.message;
            console.log("Second mint attempt failed as expected:", errMsg);
        }
    });

    it("Successfully mints an NFT to a new recipient", async () => {
        const newRecipientKeypair = Keypair.generate();
        const newMint = Keypair.generate();
        const secondRecipientTokenAccount = await getAssociatedTokenAddress(newMint.publicKey, newRecipientKeypair.publicKey);
        const secondMetadataAccount = findMetadataPda(umi, { mint: publicKey(newMint.publicKey) })[0];
        const secondMasterEditionAccount = findMasterEditionPda(umi, { mint: publicKey(newMint.publicKey) })[0];
        const [newClaimStatusPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("claim_status"), newRecipientKeypair.publicKey.toBuffer()],
            program.programId
        );

        const tx = await program.methods
            .mintNft()
            .accounts({
                signer: signerKeypair.publicKey,
                airdropState: airdropStatePda,
                claimStatus: newClaimStatusPda,
                mint: newMint.publicKey,
                recipient: newRecipientKeypair.publicKey,
                recipientTokenAccount: secondRecipientTokenAccount,
                metadataAccount: secondMetadataAccount,
                masterEditionAccount: secondMasterEditionAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .signers([newMint, newRecipientKeypair])
            .rpc();

        console.log(`Successfully minted NFT to new recipient. Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
        console.log(`Minted NFT address: https://explorer.solana.com/address/${newMint.publicKey}?cluster=devnet`);
    });

    it("Closes the airdrop state", async () => {
        const accountInfo = await provider.connection.getAccountInfo(airdropStatePda);
        if (accountInfo === null) {
            console.log("Airdrop state account does not exist. Nothing to close.");
            return;
        }

        const tx = await program.methods
            .closeAirdropState()
            .accounts({
                airdropState: airdropStatePda,
                authority: signerKeypair.publicKey,
            })
            .signers([signerKeypair])
            .rpc();

        console.log(`Closed Airdrop State: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    });
});
