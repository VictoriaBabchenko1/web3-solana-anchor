import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Airdrop } from "../../../../target/types/airdrop";
import * as dotenv from "dotenv";

const initWhitelist = async () => {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Airdrop as Program<Airdrop>;
    const connection = provider.connection;

    const args = process.argv.slice(2);
    const initialAddresses = args.map((addr) => new PublicKey(addr));
    const [whitelistPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("whitelist")],
        program.programId
    );

    const accountInfo = await connection.getAccountInfo(whitelistPDA);
    if (accountInfo !== null) {
        throw new Error(`Whitelist already initialized: ${whitelistPDA.toBase58()}`);
    }

    await program.methods
        .initializeWhitelist(initialAddresses)
        .accounts({
            authority: provider.wallet.publicKey,
        })
        .rpc();

    console.log("Whitelist initialized at: ", whitelistPDA.toBase58());

    if (initialAddresses.length) {
        console.log("With addresses: ", initialAddresses.map((a) => a.toBase58()));
    } else {
        console.log("Initialized with empty whitelist.");
    }
};

initWhitelist().catch((err) => {
    console.error("Error initializing whitelist:", err);
    process.exit(1);
});