import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };
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

async function closeAirdrop() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const [airdropStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("airdrop_state")],
        program.programId
    );

    const accountInfo = await provider.connection.getAccountInfo(airdropStatePda);
    if (!accountInfo) {
        console.log("Airdrop state account does not exist. Nothing to close.");
        return;
    }
    
    const tx = await program.methods
        .closeAirdropState()
        .accounts({
            airdropState: airdropStatePda,
            authority: signer.publicKey,
        })
        .signers([signer])
        .rpc();

    console.log(`\nNFT Airdrop state closed.`);
    console.log(`Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

closeAirdrop().catch(err => {
    console.error("Error closing airdrop:", err);
});
