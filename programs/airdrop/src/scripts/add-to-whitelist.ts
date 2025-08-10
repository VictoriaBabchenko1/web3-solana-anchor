import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Airdrop } from "../../../../target/types/airdrop";
import * as dotenv from "dotenv";

const addToWhitelist = async () => {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Airdrop as Program<Airdrop>;
    const connection = provider.connection;

    const address = process.argv[2];
    if (!address) throw new Error("Please provide an address to add");
    const pubkey = new PublicKey(address);

    const [whitelistPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("whitelist")],
        program.programId
    );

    const accountInfo = await connection.getAccountInfo(whitelistPDA);
    if (!accountInfo) {
        throw new Error("Whitelist is not initialized.");
    }

    await program.methods
        .addToWhitelist(pubkey)
        .accounts({
            authority: provider.wallet.publicKey,
        })
        .rpc();

    console.log("Added to whitelist:", pubkey.toBase58());
};

addToWhitelist().catch((err) => {
    console.error("Error adding to whitelist:", err.message);
    process.exit(1);
})