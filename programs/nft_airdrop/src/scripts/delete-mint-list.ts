import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import fs from "fs";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };

function loadSignerFromEnv(): anchor.web3.Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(secretKey));
}

async function deleteMintList() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const connection = provider.connection;

    const program = new anchor.Program(idl, provider);
    const signer = loadSignerFromEnv();

    const [mintListPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_list")],
        program.programId
    );

    const accountInfo = await connection.getAccountInfo(mintListPda);
    if (!accountInfo) {
        throw new Error("NFT Mint List does not exist. Nothing to delete.");
    }

    await program.methods
        .deleteMintList()
        .accounts({
            mintList: mintListPda,
            authority: signer.publicKey,
        })
        .signers([signer])
        .rpc();

    console.log("NFT Mint list account deleted:", mintListPda.toBase58());
}

deleteMintList().catch(console.error);