import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Airdrop } from "../../../../target/types/airdrop";
import * as dotenv from "dotenv";

const deleteWhitelist = async () => {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Airdrop as Program<Airdrop>;
    const connection = provider.connection;

    const [whitelistPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("whitelist")],
        program.programId
    );

    const accountInfo = await connection.getAccountInfo(whitelistPDA);
    if (!accountInfo) {
        throw new Error("Whitelist does not exist. Nothing to delete.");
    }

    await program.methods
        .deleteWhitelist()
        .accounts({
            authority: provider.wallet.publicKey,
        })
        .rpc();

    console.log("Whitelist PDA deleted:", whitelistPDA.toBase58());
};

deleteWhitelist().catch((err) => {
    console.error("Error deleting whitelist:", err);
    process.exit(1);
});