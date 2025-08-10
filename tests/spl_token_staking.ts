import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idl from "../target/idl/spl_token_staking.json" with { type: "json" };
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as dotenv from "dotenv";
import fs from "fs";
import BN from "bn.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount,
    getAssociatedTokenAddress, getMint,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import assert from "node:assert";

describe("spl_token_staking", () => {
    let provider: anchor.AnchorProvider;
    let program: Program;
    let connection: Connection;
    let signerKeypair: Keypair;
    let stakeStatePda: PublicKey;
    let userKeypair: Keypair;
    let userStakePda: PublicKey;
    let userStakeVaultPda: PublicKey;
    let userStakeVaultTokenAccount: PublicKey;
    let userTokenAccount: PublicKey;
    let rewardVaultPda: PublicKey;
    let rewardVaultTokenAccount: PublicKey;
    let mint: PublicKey;
    let tokenDecimals: number;

    before(async () => {
        dotenv.config();
        provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);
        program = new Program(idl, provider);
        connection = provider.connection;
        const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
        signerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

        if (!process.env.MINT_ADDRESS) {
            throw new Error("Missing MINT_ADDRESS in .env");
        }

        mint = new PublicKey(process.env.MINT_ADDRESS!);
        tokenDecimals = (await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID)).decimals;

        userKeypair = Keypair.generate();
        const [userStake] = PublicKey.findProgramAddressSync(
            [Buffer.from("user_stake"), userKeypair.publicKey.toBuffer()],
            program.programId
        );
        userStakePda = userStake;

        const [stakeState] = PublicKey.findProgramAddressSync(
            [Buffer.from("stake_state")],
            program.programId
        );
        stakeStatePda = stakeState;

        const [userStakeVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("user_stake_vault"), userKeypair.publicKey.toBuffer()],
            program.programId
        );
        userStakeVaultPda = userStakeVault;

        const [rewardVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("reward_vault")],
            program.programId
        );
        rewardVaultPda = rewardVault;

        rewardVaultTokenAccount = await getAssociatedTokenAddress(
            mint,
            rewardVaultPda,
            true,
            TOKEN_2022_PROGRAM_ID
        );

        userTokenAccount = await getAssociatedTokenAddress(
            mint,
            userKeypair.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        userStakeVaultTokenAccount = await getAssociatedTokenAddress(
            mint,
            userStakeVaultPda,
            true,
            TOKEN_2022_PROGRAM_ID
        );

        await checkRewardVaultAndBalance();
        await createAndFundUserATA();
    });

    const checkRewardVaultAndBalance = async () => {
        const rewardVaultAccountInfo = await connection.getAccountInfo(rewardVaultTokenAccount);
        if (!rewardVaultAccountInfo) {
            throw new Error("Reward Vault ATA not found. Run `yarn fund-reward-vault-pda` to initialise and fund Reward Vault PDA ATA.");
        }

        try {
            const rewardVaultTokenInfo = await getAccount(
                connection,
                rewardVaultTokenAccount,
                "confirmed",
                TOKEN_2022_PROGRAM_ID
            );
            const vaultBalance = Number(rewardVaultTokenInfo.amount) / 10 ** tokenDecimals;

            if (vaultBalance < 1) {
                console.warn("Run script from package.json to fund Reward Vault");
            } else {
                console.log(`Reward Vault balance: ${vaultBalance}`);
            }
        } catch (err) {
            console.error("Error when receiving Reward Vault ATA balance: ", err);
        }
    };

    const createAndFundUserATA = async () => {
        const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);

        if (!userTokenAccountInfo) {
            console.log("Creating user ATA...");
            const createUserAtaIx = createAssociatedTokenAccountInstruction(
                signerKeypair.publicKey,
                userTokenAccount,
                userKeypair.publicKey,
                mint,
                TOKEN_2022_PROGRAM_ID
            );
            const tx = new Transaction().add(createUserAtaIx);
            await provider.sendAndConfirm(tx, [signerKeypair]);
            console.log("Created user associated token account:", userTokenAccount.toBase58());
        }

        const signerTokenAccount = await getAssociatedTokenAddress(
            mint,
            signerKeypair.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const amountToSend = BigInt(10 ** tokenDecimals); // 1 token
        const transfer = createTransferInstruction(
            signerTokenAccount,
            userTokenAccount,
            signerKeypair.publicKey,
            amountToSend,
            [],
            TOKEN_2022_PROGRAM_ID
        );
        const transferTx = new Transaction().add(transfer);
        await provider.sendAndConfirm(transferTx);

        console.log("Funded user token account with 1 token for staking test purpose");
    }

    const getTokenBalanceValue = async (tokenAccount: PublicKey): Promise<string> => {
        const account = await getAccount(connection, tokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
        return (Number(account.amount) / 10 ** tokenDecimals).toFixed(tokenDecimals);
    };

    it("Initializes the staking", async () => {
        const accountInfo = await provider.connection.getAccountInfo(stakeStatePda);
        if (accountInfo !== null) {
            console.log("Stake state pda already exists, initialization skipped.");
            return;
        }

        const tx = await program.methods
            .initializeStakeState(new BN(10))
            .accounts({
                stakeState: stakeStatePda,
                authority: signerKeypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([signerKeypair])
            .rpc();

        console.log(`Initialized Staking: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
        console.log(`Staking State Pda address: https://explorer.solana.com/address/${stakeStatePda}?cluster=devnet`);
    });

    it("Stakes tokens", async () => {
        const amount = new BN(1);
        const lockPeriodInSeconds = new BN(60);

        const tx = await program.methods
            .stake(amount, lockPeriodInSeconds)
            .accounts({
                user: userKeypair.publicKey,
                payer: signerKeypair.publicKey,
                mint,
                userTokenAccount,
                userStake: userStakePda,
                userStakeVault: userStakeVaultPda,
                userStakeVaultTokenAccount,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([userKeypair])
            .rpc();

        console.log(`Staked: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

        const userStakeVaultBalance = await getTokenBalanceValue(userStakeVaultTokenAccount);
        console.log(`User Stake Vault Token Balance After Stake: ${userStakeVaultBalance} tokens`);

        const userBalance = await getTokenBalanceValue(userTokenAccount);
        console.log(`User Wallet Balance After Stake: ${userBalance} tokens`);
    });

    it("Fails to stake again if already staked", async () => {
        const amount = new BN(1);
        const lockPeriodInSeconds = new BN(10);

        try {
            await program.methods
                .stake(amount, lockPeriodInSeconds)
                .accounts({
                    user: userKeypair.publicKey,
                    payer: signerKeypair.publicKey,
                    mint,
                    userTokenAccount,
                    userStake: userStakePda,
                    userStakeVault: userStakeVaultPda,
                    userStakeVaultTokenAccount,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([userKeypair])
                .rpc();

            assert.fail("Expected error, but second stake has succeeded");
        } catch (err) {
            const errMsg = err?.error?.errorMessage || err?.toString();
            console.log("Caught expected error on second stake:", errMsg);

            if (!errMsg.includes("User has already staked tokens")) {
                throw new Error("Unexpected error or missing custom error message");
            }
        }
    });

    it("Claims reward tokens", async () => {
        await new Promise((res) => setTimeout(res, 5000));
        const tx = await program.methods
            .claimReward()
            .accounts({
                user: userKeypair.publicKey,
                mint,
                userTokenAccount: userTokenAccount,
                userStake: userStakePda,
                stakeState: stakeStatePda,
                rewardVault: rewardVaultPda,
                rewardVaultTokenAccount,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([userKeypair])
            .rpc();

        console.log(`Claimed reward: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
        const claimed = await getTokenBalanceValue(userTokenAccount);
        console.log(`User Wallet Balance After Claiming Reward: ${claimed} tokens`);
    });

    it("Fails to unstake tokens before lock period ends", async () => {
        try {
            await program.methods
                .unstake()
                .accounts({
                    user: userKeypair.publicKey,
                    mint,
                    userTokenAccount,
                    userStake: userStakePda,
                    userStakeVault: userStakeVaultPda,
                    userStakeVaultTokenAccount,
                    stakeState: stakeStatePda,
                    rewardVault: rewardVaultPda,
                    rewardVaultTokenAccount,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .signers([userKeypair])
                .rpc();

            assert.fail("Unstake should have failed due to lock period not ended");
        } catch (err) {
            const errMsg = err?.error?.errorMessage || err?.toString();
            console.log("Caught expected error:", err.message);

            if (!errMsg.includes("Lock period has not ended yet")) {
                throw new Error("Unexpected error or missing custom error message");
            }
        }
        const userStakeVaultBalance = await getTokenBalanceValue(userStakeVaultTokenAccount);
        console.log(`User Stake Vault Token Balance (should still have stake): ${userStakeVaultBalance} tokens`);

        const userBalance = await getTokenBalanceValue(userTokenAccount);
        console.log(`User Wallet Balance (should not increase): ${userBalance} tokens`);
    });

    it("Unstakes tokens", async () => {
        await new Promise((res) => setTimeout(res, 60000));
        const tx = await program.methods
            .unstake()
            .accounts({
                user: userKeypair.publicKey,
                mint,
                userTokenAccount,
                userStake: userStakePda,
                userStakeVault: userStakeVaultPda,
                userStakeVaultTokenAccount,
                stakeState: stakeStatePda,
                rewardVault: rewardVaultPda,
                rewardVaultTokenAccount,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([userKeypair])
            .rpc();

        console.log(`Unstaked: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

        const userStakeVaultBalance = await getTokenBalanceValue(userStakeVaultTokenAccount);
        console.log(`User Stake Vault Token Balance After Unstake: ${userStakeVaultBalance} tokens`);

        const userBalance = await getTokenBalanceValue(userTokenAccount);
        console.log(`User Wallet Balance After Unstake: ${userBalance} tokens`);
    });

    it("Closes the staking state", async () => {
        const accountInfo = await provider.connection.getAccountInfo(stakeStatePda);
        if (accountInfo === null) {
            console.log("Staking state account does not exist. Nothing to close.");
            return;
        }

        const tx = await program.methods
            .closeStakeState()
            .accounts({
                stakeState: stakeStatePda,
                authority: signerKeypair.publicKey,
            })
            .signers([signerKeypair])
            .rpc();

        console.log(`Closed Staking State Pda: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    });
});
