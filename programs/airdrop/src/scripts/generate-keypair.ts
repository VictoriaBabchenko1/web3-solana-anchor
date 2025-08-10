import { Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";

async function generateKeypair() {
    const keypair = Keypair.generate();
    const publicKeyBase58 = keypair.publicKey.toBase58();

    const keyDir = path.join("keys");
    const keyFilePath = path.join(keyDir, `${publicKeyBase58}.json`);

    fs.mkdirSync(keyDir, { recursive: true });
    fs.writeFileSync(
        keyFilePath,
        JSON.stringify(Array.from(keypair.secretKey))
    );

    console.log("Keypair created");
    console.log("Public Key: ", publicKeyBase58);
    console.log("Saved to: ", keyFilePath);
}

generateKeypair().catch(console.error);