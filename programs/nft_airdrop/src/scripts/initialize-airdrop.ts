import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import * as dotenv from "dotenv";
import BN from "bn.js";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

function getMaxSupplyFromArgs(): number {
    const maxSupply = parseInt(process.argv[2]);
    if (isNaN(maxSupply)) {
        throw new Error("Please provide max_supply as a number. Example: `ts-node initializeAirdrop.ts 10`");
    }

    return maxSupply;
}

async function initializeAirdrop() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();

    const [airdropStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("airdrop_state")],
        program.programId
    );

    const maxSupply = getMaxSupplyFromArgs();

    const tx = await program.methods
        .initializeAirdrop(new BN(maxSupply))
        .accounts({
            authority: signer.publicKey,
            airdropState: airdropStatePda,
            systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc();

    console.log(`\nNFT Airdrop initialized with max_supply = ${maxSupply}`);
    console.log(`Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log(`NFT Airdrop PDA: https://explorer.solana.com/address/${airdropStatePda}?cluster=devnet`);
}

initializeAirdrop().catch(err => {
    console.error("Error initializing airdrop:", err);
    process.exit(1);
});
