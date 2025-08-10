import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
    getAssociatedTokenAddress, getAccount, getMint,
    TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction, Keypair } from "@solana/web3.js";
import * as dotenv from "dotenv";
import BN from "bn.js";
import idl from "../target/idl/airdrop.json" with { type: "json" };
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import assert from "node:assert";

describe("airdrop", () => {
    let provider: anchor.AnchorProvider;
    let program: Program;
    let connection: anchor.web3.Connection;
    let tokenMint: PublicKey;
    let tokenDecimals: number;

    let receiverKeypair: Keypair;
    let receiver: PublicKey;

    let whitelistPDA: PublicKey;
    let vaultPDA: PublicKey;

    let recipientTokenAccount: PublicKey;
    let vaultTokenAccount: PublicKey;

    before(async () => {
        dotenv.config();
        provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);

        program = new Program(idl, provider);
        connection = provider.connection;

        if (!process.env.MINT_ADDRESS) {
            throw new Error("Missing MINT_ADDRESS in .env");
        }

        tokenMint = new PublicKey(process.env.MINT_ADDRESS!);
        receiverKeypair = Keypair.generate();
        receiver = receiverKeypair.publicKey;

        [whitelistPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("whitelist")],
            program.programId
        );
        [vaultPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault")],
            program.programId
        );

        recipientTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            receiver,
            false,
            TOKEN_2022_PROGRAM_ID
        );
        vaultTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            vaultPDA,
            true,
            TOKEN_2022_PROGRAM_ID
        );

        const mintInfo = await getMint(
            connection,
            tokenMint,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );
        tokenDecimals = mintInfo.decimals;

        await checkVaultAtaAndBalance();
    });

    const checkVaultAtaAndBalance = async () => {
        const vaultAccountInfo = await connection.getAccountInfo(vaultTokenAccount);
        if (!vaultAccountInfo) {
            throw new Error("Vault ATA not found. Run `yarn fund-vault-pda` to initialise and fund Vault PDA ATA.");
        }

        try {
            const vaultTokenInfo = await getAccount(
                connection,
                vaultTokenAccount,
                "confirmed",
                TOKEN_2022_PROGRAM_ID
            );
            const vaultBalance = Number(vaultTokenInfo.amount) / 10 ** tokenDecimals;

            if (vaultBalance < 10) {
                console.warn(`Low balance on Vault ATA: ${vaultBalance}`);
                console.warn("Claim tests may fail with error");
                console.warn("Run script from package.json to fund Vault ATA");
            } else {
                console.log(`Vault ATA balance: ${vaultBalance}`);
            }
        } catch (err) {
            console.error("Error when receiving Vault ATA balance: ", err.message);
        }
    };

    const createRecipientATAIfNotExists = async () => {
        const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
        if (!accountInfo) {
            console.log("Creating associated token account for:", receiver.toBase58());
            const createIx = createAssociatedTokenAccountInstruction(
                provider.wallet.publicKey,
                recipientTokenAccount,
                receiver,
                tokenMint,
                TOKEN_2022_PROGRAM_ID
            );
            const tx = new Transaction().add(createIx);
            await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
            console.log("Created associated token account:", recipientTokenAccount.toBase58());
        }
    };

    it("Initializes whitelist", async () => {
        const accountInfo = await connection.getAccountInfo(whitelistPDA);
        if (accountInfo !== null) {
            console.log(`Whitelist already exists: ${whitelistPDA.toBase58()}`);
            return;
        }

        await program.methods
            .initializeWhitelist([])
            .accounts({
                authority: provider.wallet.publicKey,
            })
            .rpc();

        console.log("Whitelist initialized:", whitelistPDA.toBase58());
    });

    it("Adds user to whitelist", async () => {
        await program.methods
            .addToWhitelist(receiver)
            .accounts({
                authority: provider.wallet.publicKey,
            })
            .rpc();

        console.log("Added to whitelist:", receiver.toBase58());
    });

    it("Claims random tokens amount for whitelisted user", async () => {
        try {
            await createRecipientATAIfNotExists();

            const balanceBefore = await getAccount(
                connection,
                recipientTokenAccount,
                "confirmed",
                TOKEN_2022_PROGRAM_ID
            );
            console.log(`Balance before: ${Number(balanceBefore.amount) / 10 ** tokenDecimals}`);

            const clientSeed = new BN(Date.now());
            const tx = await program.methods
                .claimRandomTokensAmount(clientSeed)
                .accounts({
                    vault: vaultPDA,
                    mint: tokenMint,
                    vaultTokenAccount,
                    recipientTokenAccount,
                    payer: receiver,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    whitelist: whitelistPDA,
                })
                .signers([receiverKeypair])
                .rpc({ commitment: "confirmed" });

            console.log("Claim successful. TX:", tx);

            const balanceAfter = await getAccount(
                connection,
                recipientTokenAccount,
                "confirmed",
                TOKEN_2022_PROGRAM_ID
            );
            console.log(`Balance after: ${Number(balanceAfter.amount) / 10 ** tokenDecimals}`);

            const claimed = Number(balanceAfter.amount) - Number(balanceBefore.amount);
            console.log(`Claimed amount: ${claimed / 10 ** tokenDecimals}`);
        } catch (err: any) {
            console.error("Claim failed: ", err.message);
        }
    });

    it("Removes user from whitelist", async () => {
        await program.methods
            .removeFromWhitelist(receiver)
            .accounts({
                authority: provider.wallet.publicKey,
            })
            .rpc();

        console.log("Removed from whitelist:", receiver.toBase58());
    });

    it("Fails for claim tokens to non-whitelisted user", async () => {
        try {
            const clientSeed = new BN(Date.now());
            await program.methods
                .claimRandomTokensAmount(clientSeed)
                .accounts({
                    vault: vaultPDA,
                    mint: tokenMint,
                    vaultTokenAccount,
                    recipientTokenAccount,
                    payer: receiver,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    whitelist: whitelistPDA,
                })
                .signers([receiverKeypair])
                .rpc({ commitment: "confirmed" });

            assert.fail("Claim unexpectedly succeeded for non-whitelisted user");
        } catch (err) {
            const logs = err.logs ?? [];
            console.log("Claim failed as expected (not whitelisted). Logs:");
            console.log(logs.join("\n"));
            assert(logs.some((log: string) => log.match(/NotInWhitelist/i)), "Expected whitelist error");
        }
    });

    it("Deletes the whitelist", async () => {
        await program.methods
            .deleteWhitelist()
            .accounts({
                authority: provider.wallet.publicKey,
            })
            .rpc();

        console.log("Whitelist deleted:", whitelistPDA.toBase58());
    });
});