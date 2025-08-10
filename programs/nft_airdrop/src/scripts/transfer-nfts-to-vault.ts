import * as anchor from "@coral-xyz/anchor";
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount
} from "@solana/spl-token";
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import * as dotenv from "dotenv";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };
import fs from "fs";

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

async function transferNftsToVault() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const [mintListPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_list")],
        program.programId
    );

    const mintListAccount = await (program.account as any).mintList.fetch(mintListPda);
    const mints: PublicKey[] = mintListAccount.mints;

    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        program.programId
    );

    console.log(`Vault PDA address: ${vaultPda.toBase58()}\n`);

    for (const mint of mints) {
        const fromAta = await getAssociatedTokenAddress(mint, signer.publicKey);
        const toAta = await getAssociatedTokenAddress(mint, vaultPda, true);
        const accountInfo = await provider.connection.getAccountInfo(toAta);

        let fromAtaAccountInfo = await getAccount(connection, fromAta);

        if (fromAtaAccountInfo.amount === BigInt(0)) {
            console.log(`NFT ${mint.toBase58()} already transferred. Skipping.`);
            continue;
        }

        if (!accountInfo) {
            const ataTx = createAssociatedTokenAccountInstruction(
                signer.publicKey,
                toAta,
                vaultPda,
                mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            const tx = new Transaction().add(ataTx);
            await provider.sendAndConfirm(tx);
            console.log("Vault ATA Created:", toAta.toBase58());
        } else {
            console.log("ATA already exist:", toAta.toBase58());
        }

        const transfer = createTransferInstruction(
            fromAta,
            toAta,
            signer.publicKey,
            1,
            [],
            TOKEN_PROGRAM_ID
        );

        const transferTx = new Transaction().add(transfer);
        const sig = await provider.sendAndConfirm(transferTx);
        console.log(`NFT ${mint.toBase58()} transferred to Vault PDA: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    }
}

transferNftsToVault().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
