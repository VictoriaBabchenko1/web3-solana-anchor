import * as anchor from "@coral-xyz/anchor";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    TOKEN_2022_PROGRAM_ID,
    createTransferInstruction, getMint,
} from "@solana/spl-token";
import {
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import * as dotenv from "dotenv";
import { Program } from "@coral-xyz/anchor";
import type { Airdrop } from "../../../../target/types/airdrop";

function parseAmountArg(): number {
    const rawAmountArg = process.argv[2];
    if (!rawAmountArg) {
        throw new Error("Error: Please provide the funding amount as a command-line argument." +
            "\nExample: yarn fund-vault-pda 100");
    }

    const amount = parseFloat(rawAmountArg);
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Error: Invalid amount provided. Must be a positive number.");
    }

    return amount;
}

const fundVaultPda = async () => {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Airdrop as Program<Airdrop>;
    const mint = new PublicKey(process.env.MINT_ADDRESS!);
    const mintInfo = await getMint(provider.connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
    const decimals = mintInfo.decimals;
    const sendTokenRawAmount = parseAmountArg();
    const sendTokenAmount = BigInt(Math.round(sendTokenRawAmount * 10 ** decimals));
    const vaultSeed = "vault";
    const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(vaultSeed)],
        program.programId
    );

    const vaultTokenAccount = await getAssociatedTokenAddress(
        mint,
        vaultPDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    const accountInfo = await provider.connection.getAccountInfo(vaultTokenAccount);
    if (!accountInfo) {
        console.log("ATA for vaultPDA not fount. Creating...");

        const ataIx = createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            vaultTokenAccount,
            vaultPDA,
            mint,
            TOKEN_2022_PROGRAM_ID
        );

        const tx = new Transaction().add(ataIx);
        await provider.sendAndConfirm(tx);
        console.log("ATA Created:", vaultTokenAccount.toBase58());
    } else {
        console.log("ATA already exist:", vaultTokenAccount.toBase58());
    }

    const senderTokenAccount = await getAssociatedTokenAddress(
        mint,
        provider.wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
    );

    const senderBalance = await provider.connection.getTokenAccountBalance(senderTokenAccount);
    if (BigInt(senderBalance.value.amount) < sendTokenAmount) {
        throw new Error("Insufficient funds in sender token account.");
    }

    const transferIx = createTransferInstruction(
        senderTokenAccount,
        vaultTokenAccount,
        provider.wallet.publicKey,
        sendTokenAmount,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const transferTx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(transferTx);
    console.log(`Funded ${sendTokenRawAmount} tokens to vault ATA PDA`);
};

fundVaultPda().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
