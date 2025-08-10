import readlineSync from "readline-sync";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import dotenv from "dotenv";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

dotenv.config();

function loadKeypairFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getUmi(payer: Keypair) {
    const umi = createUmi((process.env.ANCHOR_PROVIDER_URL).toString()).use(mplTokenMetadata());
    const umiKeypair = fromWeb3JsKeypair(payer);
    umi.use(keypairIdentity(umiKeypair));
    return umi;
}

function promptTokenData() {
    console.log("\nEnter the data for the NFT\n");

    const name = readlineSync.question("NFT name: ");
    const symbol = readlineSync.question(
        "NFT symbol (up to 10 characters): "
    );
    const uri = readlineSync.question(
        "Metadata URI (link to your metadata JSON file): "
    );

    console.log(
        "\nRoyalty percent — the percentage of each resale that goes to the creator." +
        "\nFor example, enter 2.5 for 2.5% royalty, or 0 for no royalty."
    )

    const royaltyPercent = parseFloat(
        readlineSync.question("Royalty percent: ")
    );

    return { name, symbol, uri, royaltyPercent };
}

async function createNFT() {
    const payer = loadKeypairFromEnv();
    const { name, symbol, uri, royaltyPercent } = promptTokenData();
    const umi = getUmi(payer);
    const nftSigner = generateSigner(umi);

    const tx = await createNft(umi, {
        mint: nftSigner,
        sellerFeeBasisPoints: percentAmount(royaltyPercent),
        name,
        symbol,
        uri,
        isMutable: false,
    }).sendAndConfirm(umi)

    console.log(`Minted NFT: https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`);
    console.log(`Minted NFT address: ${nftSigner.publicKey}`);
}

createNFT().catch(console.error);