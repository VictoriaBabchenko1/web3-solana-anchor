import { mplTokenMetadata, TokenStandard, transferV1 } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey, keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import dotenv from "dotenv";
import fs from "fs";
import readlineSync from "readline-sync";

dotenv.config();


function loadSenderKeypairFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function setupAndGetUmi(payer: Keypair) {
    const umi = createUmi((process.env.ANCHOR_PROVIDER_URL).toString()).use(mplTokenMetadata());
    const umiKeypair = fromWeb3JsKeypair(payer);
    umi.use(keypairIdentity(umiKeypair));
    return umi;
}

function promptNftTransferData() {
    const mintInput = readlineSync.question("Enter the mint address of the NFT to transfer: ");
    const recipientInput = readlineSync.question("Enter the recipient's wallet address: ");

    return {
        mint: publicKey(mintInput.trim()),
        recipient: publicKey(recipientInput.trim()),
    };
}

async function transfer() {
    const senderKeypair = loadSenderKeypairFromEnv();
    const umi = setupAndGetUmi(senderKeypair);
    const { mint, recipient } = promptNftTransferData();

    await transferV1(umi, {
        mint,
        authority: umi.identity,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: recipient,
        tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi)


    console.log("NFT transferred");
}

transfer().catch(console.error);