import * as anchor from "@coral-xyz/anchor";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    TOKEN_2022_PROGRAM_ID,
    createTransferInstruction, getMint,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import * as dotenv from "dotenv";
import idl from "../../../../target/idl/spl_token_staking.json" with { type: "json" };

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

function parseAmountArg(): number {
    const rawAmountArg = process.argv[2];
    if (!rawAmountArg) {
        throw new Error("Error: Please provide the funding amount as a command-line argument." +
            "\nExample: yarn fund-reward-vault 1000");
    }

    const amount = parseFloat(rawAmountArg);
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Error: Invalid amount provided. Must be a positive number.");
    }

    return amount;
}

async function fundRewardVaultPda () {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);

    const mint = new PublicKey(process.env.MINT_ADDRESS!);
    const mintInfo = await getMint(provider.connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
    const decimals = mintInfo.decimals;
    const sendTokenRawAmount = parseAmountArg();
    const sendTokenAmount = BigInt(Math.round(sendTokenRawAmount * 10 ** decimals));
    const rewardVaultSeed = "reward_vault";
    const [rewardVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(rewardVaultSeed)],
        program.programId
    );

    const rewardVaultTokenAccount = await getAssociatedTokenAddress(
        mint,
        rewardVaultPDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    console.log(`Reward Vault PDA: ${rewardVaultPDA}`);
    const accountInfo = await provider.connection.getAccountInfo(rewardVaultTokenAccount);
    if (!accountInfo) {
        console.log("ATA for Reward Vault PDA not fount. Creating...");

        const ataIx = createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            rewardVaultTokenAccount,
            rewardVaultPDA,
            mint,
            TOKEN_2022_PROGRAM_ID
        );

        const tx = new Transaction().add(ataIx);
        await provider.sendAndConfirm(tx);
        console.log("ATA Created: ", rewardVaultTokenAccount.toBase58());
    } else {
        console.log("ATA already exist: ", rewardVaultTokenAccount.toBase58());
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
        rewardVaultTokenAccount,
        provider.wallet.publicKey,
        sendTokenAmount,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const transferTx = new Transaction().add(transferIx);
    const txSignature = await provider.sendAndConfirm(transferTx);
    console.log(`Funded ${sendTokenRawAmount} tokens to Reward Vault ATA PDA`);
    console.log(`Tx: ${txSignature}`);
}

fundRewardVaultPda().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
