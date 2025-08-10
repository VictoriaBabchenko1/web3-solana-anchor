import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../../../../target/idl/spl_token_staking.json" with { type: "json" };
import fs from "fs";
import * as dotenv from "dotenv";

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

async function closeStaking() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const [stakeStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_state")],
        program.programId
    );

    const accountInfo = await provider.connection.getAccountInfo(stakeStatePda);
    if (!accountInfo) {
        console.log("Stake state account does not exist. Nothing to close.");
        return;
    }
    
    const tx = await program.methods
        .closeStakeState()
        .accounts({
            stakeState: stakeStatePda,
            authority: signer.publicKey,
        })
        .signers([signer])
        .rpc();

    console.log(`\nStake state pda closed.`);
    console.log(`Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

closeStaking().catch(err => {
    console.error("Error closing staking:", err);
});
