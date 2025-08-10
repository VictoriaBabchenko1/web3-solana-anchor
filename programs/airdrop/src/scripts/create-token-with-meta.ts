import readlineSync from "readline-sync";
import { Connection, Keypair, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";
import dotenv from "dotenv";
import { createV1, mplTokenMetadata, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, percentAmount, publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair, toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';
import * as anchor from "@coral-xyz/anchor";

dotenv.config();

function createSolanaConnection(): Connection {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider.connection;
}

function loadKeypairFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function createUmiWithIdentity(payer: Keypair) {
    const umi = createUmi((process.env.ANCHOR_PROVIDER_URL).toString()).use(mplTokenMetadata());
    const umiKeypair = fromWeb3JsKeypair(payer);
    umi.use(keypairIdentity(umiKeypair));
    return umi;
}

function promptTokenData() {
    console.log("\nEnter the data for the token\n");

    const name = readlineSync.question("Token name: ");
    const symbol = readlineSync.question("Token symbol (up to 10 characters): ");
    const uri = readlineSync.question("Metadata URI (link to your metadata JSON file): ");

    console.log("\nRoyalty percent — the percentage of each resale that goes to the creator.");
    console.log("For example, enter 2.5 for 2.5% royalty, or 0 for no royalty.");
    const royaltyPercent = parseFloat(readlineSync.question("Royalty percent: "));

    console.log("\nDecimals — how divisible your token is.");
    console.log("For example:");
    console.log(" - 0 means no fractions (like whole NFT or ticket)");
    console.log(" - 9 means high precision (1 token = 1_000_000_000 base units, like SOL)");
    const decimals = parseInt(readlineSync.question("Number of decimal places: "));

    console.log("\nInitial supply — how many tokens to mint initially.");
    console.log("Note: This is a whole number. It will be scaled by 10^decimals internally.");
    const initialSupply = parseInt(readlineSync.question("Initial token supply: "));

    return { name, symbol, uri, royaltyPercent, decimals, initialSupply };
}

async function createMetadataForToken(connection: Connection, payer: any,  umi: any, mint: string, name: string, symbol: string, uri: string, royaltyPercent: number) {
    const createV1Ix = createV1(umi, {
        mint: publicKey(mint),
        authority: umi.identity,
        payer: umi.identity,
        updateAuthority: umi.identity,
        name: name,
        symbol: symbol,
        uri: uri,
        sellerFeeBasisPoints: percentAmount(royaltyPercent),
        splTokenProgram: publicKey(TOKEN_2022_PROGRAM_ID),
        tokenStandard: TokenStandard.Fungible,
    }).getInstructions()

    const web3JsIxs = createV1Ix.map(toWeb3JsInstruction);
    const tx = new Transaction().add(...web3JsIxs);
    return await sendAndConfirmTransaction(connection, tx, [payer]);
}

async function createTokenWithMeta() {
    const payer = loadKeypairFromEnv();
    const connection = createSolanaConnection();
    const { name, symbol, uri, royaltyPercent, decimals, initialSupply } = promptTokenData();
    const umi = createUmiWithIdentity(payer);

    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        decimals,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("\nThe token created. Token Mint: ", mint.toBase58());

    const metadataSig = await createMetadataForToken(connection, payer, umi, mint.toBase58(), name, symbol, uri, royaltyPercent);
    console.log("Metadata transaction confirmed. Signature:", metadataSig);

    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey,
        undefined,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    const amount = BigInt(initialSupply) * BigInt(10 ** decimals);
    await mintTo(connection, payer, mint, ata.address, payer, amount, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log(`Transferred ${initialSupply} tokens to ATA - ${ata.address.toBase58()}`);
}

createTokenWithMeta().catch(console.error);