import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Airdrop } from "../../../../target/types/airdrop";
import * as dotenv from "dotenv";

const removeFromWhitelist = async () => {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Airdrop as Program<Airdrop>;
    const connection = provider.connection;

    const address = process.argv[2];
    if (!address) throw new Error("Please provide an address to remove");
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
        .removeFromWhitelist(pubkey)
        .accounts({
            authority: provider.wallet.publicKey,
        })
        .rpc();

    console.log("Removed from whitelist:", pubkey.toBase58());
};

removeFromWhitelist().catch((err) => {
    console.error("Error removing from whitelist:", err);
    process.exit(1);
});
