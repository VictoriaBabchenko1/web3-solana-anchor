import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

async function resetClaimStatus() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const address = process.argv[2];
    if (!address) throw new Error("Please provide an address to to reset nft claim status for.");
    const recipient = new PublicKey(address);

    const [airdropStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("airdrop_state")],
        program.programId
    );

    const [claimStatusPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim_status"), recipient.toBuffer()],
        program.programId
    );

    const tx = await program.methods
        .resetClaimStatus()
        .accounts({
            airdropState: airdropStatePda,
            claimStatus: claimStatusPda,
            recipient: recipient,
            signer,
        })
        .rpc();

    console.log(`Claim status reset for ${recipient.toBase58()}.\n Tx: ${tx}`);
}

resetClaimStatus().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
})