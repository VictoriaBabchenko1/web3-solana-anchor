import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import * as dotenv from "dotenv";
import BN from "bn.js";
import idl from "../../../../target/idl/spl_token_staking.json" with { type: "json" };

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

function getAprFromArgs(): number {
    const apr = parseInt(process.argv[2]);
    if (isNaN(apr)) {
        throw new Error("Please provide APR (Annual Percentage Rate) as a number. Example: `yarn init-staking 10`");
    }

    return apr;
}

async function initializeStaking() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const [stakeStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_state")],
        program.programId
    );

    const accountInfo = await provider.connection.getAccountInfo(stakeStatePda);
    if (accountInfo !== null) {
        throw new Error("Stake state pda already exists, initialization skipped." +
            `\nStake State PDA: https://explorer.solana.com/address/${stakeStatePda}?cluster=devnet`);
    }

    const apr = getAprFromArgs();

    const tx = await program.methods
        .initializeStakeState(new BN(apr))
        .accounts({
            stakeState: stakeStatePda,
            authority: signer.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc();

    console.log(`\nSPL Token Staking initialized with apr = ${apr}`);
    console.log(`Tx: ${tx}`);
    console.log(`Stake State PDA: ${stakeStatePda}`);
}

initializeStaking().catch(err => {
    console.error("Error initializing staking:", err);
});