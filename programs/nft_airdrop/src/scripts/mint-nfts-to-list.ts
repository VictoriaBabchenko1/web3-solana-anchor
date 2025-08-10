import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as dotenv from "dotenv";
import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import idl from "../../../../target/idl/nft_airdrop.json" with { type: "json" };
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import BN from "bn.js";

function loadSignerFromEnv(): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getProgram(provider: anchor.AnchorProvider): anchor.Program {
    anchor.setProvider(provider);
    return new anchor.Program(idl, provider);
}

function getSolanaConnection(): Connection {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider.connection;
}

function getUmi(payer: Keypair) {
    const umi = createUmi((process.env.ANCHOR_PROVIDER_URL).toString()).use(mplTokenMetadata());
    const umiKeypair = fromWeb3JsKeypair(payer);
    umi.use(keypairIdentity(umiKeypair));
    return umi;
}

function parseMaxMintsAmountArg(): number {
    const rawAmountArg = process.argv[2];
    if (!rawAmountArg) {
        throw new Error("Error: Please provide the max mints amount as a command-line argument." +
            "\nExample: yarn mint-nfts-to-list 100");
    }

    const amount = parseFloat(rawAmountArg);
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Error: Invalid amount provided. Must be a positive number.");
    }

    return amount;
}

async function initMintList(program: anchor.Program, authority: PublicKey, maxMints: number) {
    const [mintListPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_list")],
        program.programId
    );

    const connection = getSolanaConnection();
    const accountInfo = await connection.getAccountInfo(mintListPda);

    if (accountInfo !== null) {
        throw new Error(`Nft Mint List already initialized: ${mintListPda.toBase58()}`);
    }

    await program.methods
        .initializeMintList(new BN(maxMints))
        .accounts({
            mintList: mintListPda,
            authority: authority,
            systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc();

    console.log("Nft Mint List initialized at: ", mintListPda.toBase58());
}

async function addToMintList(program: Program, authority: PublicKey, mintPublicKey: PublicKey) {
    const [mintListPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_list")],
        program.programId
    );

    await program.methods
        .addToMintList(mintPublicKey)
        .accounts({
            mintList: mintListPda,
            authority
        })
        .rpc();

    console.log(`Nft ${mintPublicKey} added to Mint List`);
}

async function createNFT(umi: any, index: number) {
    const nftSigner = generateSigner(umi);
    const name = `ANGEL NFT #${index}`;
    const symbol = "ANGL";
    const uri = "https://gray-changing-dinosaur-853.mypinata.cloud/ipfs/bafkreicnxwjmo4tcbh7wjltrioerwgsxtmpmzovdvbrmlzagnadeokb7oe";
    const royaltyPercent = 5;

    const tx = await createNft(umi, {
        mint: nftSigner,
        sellerFeeBasisPoints: percentAmount(royaltyPercent),
        name,
        symbol,
        uri,
        isMutable: false,
    }).sendAndConfirm(umi)

    console.log(`Minted NFT: https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`);
    return new PublicKey(nftSigner.publicKey);
}

async function mintNftsToList() {
    dotenv.config();
    const provider = anchor.AnchorProvider.env();
    const program = getProgram(provider);
    const signer = loadSignerFromEnv();
    const maxMints = parseMaxMintsAmountArg();
    const umi = getUmi(signer);

    await initMintList(program, signer.publicKey, maxMints);

    for (let i = 1; i <= maxMints; i++) {
        const mintPublicKey = await createNFT(umi, i);
        await addToMintList(program, signer.publicKey, mintPublicKey);
    }
}

mintNftsToList().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
})