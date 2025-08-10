# Solana Backend Program

This is the backend part of the project using [Anchor](https://book.anchor-lang.com/) framework for Solana. 
It includes the smart contract (program), IDL generation, and utility scripts.

## Environment Setup

### Add Public and Private Keys
You must add a `public-key.json` file with your wallet's public and private keys to the following path:

#### `./keys/`

For example:
#### `./keys/bosueYqFVaFYyAbMzUdsVPyY9D7kErzmXKYHnMViRky.json`

This key will be used to: 
* deploy the program
* sign transactions
* interact with PDAs (Program Derived Addresses).

> ⚠️ **Keep this file secure and do not commit it to version control!**

### You can Generate a Keypair (if you don’t have one)
View instructions at [Generate Keypair Script](#generate-keypair-script) file section


### Update Anchor.toml
To ensure your Anchor program works properly, make sure to update your `Anchor.toml` file with your wallet path and target cluster.

#### Set Your Wallet Path
In the `[provider]` section, set the wallet field to the path of your generated keypair file.
This should match the path where your full keypair JSON was saved (inside `./keys/`).

``` toml
wallet = "./keys/{YOUR_PUBLIC_KEY}.json"
```

Replace `{YOUR_PUBLIC_KEY}` with your actual public key filename.
> ⚠️ Important: Do not commit your public key into version control.

#### Set the Cluster
Also in the `[provider]` section, configure the cluster to deploy to.

**Example:**
```toml
cluster = "devnet"
```
You can choose one of the official Solana RPC endpoints to connect to.

> ⚠️ Make sure this matches your `ANCHOR_PROVIDER_URL` in the `.env` file.

#### Set Program ID
After building and deploying your program, Anchor should automatically update the `Anchor.toml`
with the received `program ID` under the `[programs.<cluster>]` section. 
However, if for any reason the `program ID` is not set automatically, update `Anchor.toml` with received `program ID` manually

> ⚠️ Important: Do not commit your real deployed `program ID` into version control

> ⚠️ View more important instructions at [Program ID Consistency](#program-iD-consistency) file section


### Configure Environment Variables

Create a `.env` file in the root directory with the required environment variables.
For convenience, you can preview `.env.example` file.

#### `ANCHOR_PROVIDER_URL`
* **Description:** The Solana RPC endpoint to connect to.
* **Example:**
```
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
```

#### `ANCHOR_WALLET`
* **Description:** Path to your local wallet keypair file used to sign transactions.
* **Example:**
```
ANCHOR_WALLET=./keys/{PUBLIC_KEY}.json
```

#### `MINT_ADDRESS`
* **Description:** The address of the token mint that will be used in the airdrop.
* **Note:**
If you don't have a token mint yet, you need to create one.
To do that, view instructions at [Create Token Script](#create-token-script) file section. 
After generating a new token mint and output the mint address in the console. You can then set it in your `.env` file like this:

```
MINT_ADDRESS=YourNewTokenMintAddressHere
```


## Generate Keypair Script
This script generates a new Solana keypair (public/private keys) and saves it to a JSON file.

#### Run the script:
#### `yarn generate-key`

#### Script location:
#### `programs/airdrop/src/scripts/generate-keypair.ts`

**What it does:**
* Generates a new Solana wallet (keypair)
* Saves the full keypair to a JSON file at the path:
#### `./keys/{PUBLIC_KEY}.json`
* The file is named after the generated public key.

> ⚠️ **Important**: This file contains both the public and private keys. 
Keep it secure and never commit it to version control!


## Create Token Script
This script creates a new fungible token on Solana using the Token 2022 program and attaches on-chain metadata to it using the Metaplex Token Metadata program.

**Run the script:**
#### `yarn create-token-with-meta`

**Script location:**
#### `programs/airdrop/src/scripts/create-token-with-meta.ts`

**What it does:**
* Prompts the user to input the following token information:
  * Token name (e.g., ‘MyToken’)
  * Token symbol (up to 10 characters, e.g., "MTK")
  * Metadata URI (link to a JSON metadata file,<br> 
  e.g., link from Tusky/Filebase/Irys/Metaboss/NFT Storage/Pinata/ShadowDrive/web3.storage)
  * Royalty percentage (e.g., 2.5% for secondary sales)
  * Number of decimals (e.g., 0 for indivisible tokens, 9 for high precision)
  * Initial token supply (in an understandable format, e.g., 1000)
* Creates a new fungible token using the Token 2022 program.
* Uploads the token metadata to the blockchain using the Metaplex Token Metadata program.
* Mints the specified initial supply of tokens to the wallet's Associated Token Account (ATA).

**Metadata URI JSON File Requirements:**

The value you enter in the Metadata URI prompt should point to a valid public JSON file that contains the token's metadata. 
This file is typically hosted on decentralized storage (e.g., Tusky, Filebase, Irys, Metaboss, NFT Storage, Pinata, ShadowDrive, web3.storage) or a trusted centralized server.

The JSON file must contain the following fields: `name`, `symbol`, `description`, `image`

**JSON File Content Example:**
```
{
   "name": "My Token",
   "symbol": "MYT",
   "description": "This is a description of the token.",
   "image": "https://example.com/token-image.png"
}
```

**Field descriptions:**

* name: The full name of the token.
* symbol: The ticker or symbol (e.g., "MYT").
* description: A human-readable description of the token.
* image: A publicly accessible URL pointing to an image representing the token.
  * The image should ideally be in PNG or SVG format.
  * The URL must be HTTPS and reachable at the time of metadata creation.

> ⚠️ **Important:** If the URI or image URL is invalid or unreachable, the metadata creation will fail

> ⚠️ **Attention:** All transactions are signed with a key that is loaded from `ANCHOR_WALLET`. 
This key must have enough SOL to cover the fees.


## Fund Vault PDA Script

To fund the Vault PDA (Program Derived Address), run:
#### `yarn fund-vault-pda  <amount>`
**Required argument:**

* `<amount>` — The number of tokens to transfer into the vault (in human-readable format, e.g., 100 for 100 tokens).

**Example:**
```
yarn fund-vault-pda 100
```
#### Script location:
#### `programs/airdrop/src/scripts/fund-vault-pda.ts`

#### What it does:
* Derives the vault PDA used by the program
* Transfers the specified amount of tokens from the authority’s token account into the vault’s associated token account
* Ensures the Vault PDA is properly initialized and holds tokens available for claiming on the frontend

This step is required for enabling users to claim tokens from the Vault via the dApp.

##  Whitelist Scripts
These scripts allow you to manage the whitelist on your Solana Anchor program. 

>**Important:** Only the authority (the wallet that initialized the whitelist) is allowed to perform whitelist operations like 
> adding or removing addresses, or deleting the whitelist account. Make sure you’re using the correct keypair file when executing scripts.

**Notes:**
* If the whitelist is already initialized, re-initializing will fail.
* If the whitelist does not exist, adding or removing addresses or deleting whitelist will fail.
* All scripts use `AnchorProvider.env()` — make sure to configure `ANCHOR_WALLET` and `ANCHOR_PROVIDER_URL`

### Initialize Whitelist
#### `yarn init-whitelist [address1 address2 ...]`
**Description:** Initializes the whitelist with the provided addresses. If no addresses are passed, an empty whitelist will be created.

**Examples:**
```
# Initialize an empty whitelist
yarn init-whitelist

# Initialize with specific addresses
yarn init-whitelist 6Tu...abc GkF...xyz
```

### Add Address to Whitelist
#### `yarn add-to-whitelist <address>`
**Description:** Adds a single address to the whitelist.

**Example:**
```
yarn add-to-whitelist 6Tu...abc
```

### Remove Address from Whitelist
#### `yarn remove-from-whitelist <address>`
**Description:** Removes a single address from the whitelist.

**Example:**
```
yarn remove-from-whitelist 6Tu...abc
```

### Delete Whitelist
#### `yarn delete-whitelist`
**Description:** Completely deletes the whitelist account from the blockchain.

**Example:**
```
yarn delete-whitelist
```

## Scripts For NFT Airdrop Logic With Immediately Mint To Address

### Initialize Airdrop Script
#### `yarn init-nft-airdrop <MAX_SUPPLY>`
**Description:** Initializes the airdrop state account on-chain with a defined maximum NFT supply.

**Example:**
```
yarn init-nft-airdrop 100
```

### Reset Claim Status Script
#### `yarn reset-nft-claim-status <WALLET_ADDRESS>`
**Description:** Resets the claim status for a given user’s NFT claim, allowing them to mint again.

**Example:**
```
yarn reset-nft-claim-status 77K...mV5
```

### Close Airdrop Script
#### `yarn close-nft-airdrop`
**Description:** Closes the airdrop state account and refunds rent to the authority.

**Example:**
```
yarn close-nft-airdrop
```

## Setup Scripts For NFT Airdrop Logic With Claim To Address

### Mint NFTs To List Script
#### `yarn mint-nfts-to-list <MAX_SUPPLY>`

**Description:**
* Initializes the on-chain MintList account, which stores the list of NFTs available for the airdrop.
* Mints a specified number of NFTs.
* Adds each minted NFT to the MintList.

**Example:**
```
yarn mint-nfts-to-list 5
```
This will mint 5 NFTs and register them in the Mint List on-chain.

### Transfer NFTs To Vault
#### `yarn transfer-nfts-to-vault`

**Description:**
* Fetches the list of NFT mint addresses from the MintList PDA.
* Transfers each NFT from the deployer's wallet to the program-controlled vault PDA.
* Creates the associated token account (ATA) for the vault if is needed.

**Example:**
```
yarn transfer-nfts-to-vault
```

**Purpose**:
The NFTs must be held by the program (in the vault PDA) to allow on-chain logic to transfer them to users during claim operations.

## Additional Scripts (Testing)

### Mint NFT Script
**Description:** This script mints a new NFT using the Metaplex Token Metadata program and sends it to your 
Anchor wallet (ANCHOR_WALLET).

**How to use:**
```
yarn mint-nft
```

### Transfer Minted NFT To Wallet Script
**Description:** Transfers a minted NFT from your Anchor wallet to another Solana wallet address.

**How to use:**
```
yarn transfer-minted-nft-to-wallet
```


## Scripts For SPL Token Staking

### Initialize Staking Script
#### `yarn init-staking <APR>`

**Description:** Initializes the staking state account (stake_state PDA) with the specified APR (Annual Percentage Rate).

**Example:**
```
yarn init-staking 10
```
This will initialize staking with 10% APR.

### Fund Reward Vault Script
#### `yarn fund-reward-vault <amount>`

**Description:** Funds the reward_vault PDA with the specified amount of SPL tokens.
Automatically creates the associated token account (ATA) if it doesn’t exist.

**Example:**
```
yarn fund-reward-vault 10000
```

### Close Staking Script
#### `yarn close-staking`

**Description:** Closes the stake_state PDA and reclaims lamports (SOL).
Use only when you're certain the staking program should be reset or terminated or for testing cases only.

**Example:**
```
yarn close-staking
```


## Build and Deploy the Program
Before deploying, make sure your Solana CLI is configured correctly

### Build the program
#### `anchor build`

This will:
* Compile the smart contract to .so (shared object) binary
* Generates `target/idl/airdrop.json` (for frontend integration)
* Generates TypeScript types in `target/types/airdrop.ts`

### Deploy to the network
#### `anchor deploy`

This will:
* Deploy the compiled program to the specified Solana cluster (e.g., Devnet)
* Output the `program ID`, which should match the one expected by your frontend

### Program ID Consistency
After building and deploying your program, Anchor should automatically update the `Anchor.toml` 
with the received `program ID` under the `[programs.<cluster>]` section and the `lib.rs` at `declare_id!(" ")` part.

However, if for any reason the `program ID` is not set automatically, after deploying your program, 
**you must manually update both** `Anchor.toml` and `lib.rs` with received `program ID`:
1. `Anchor.toml`:
   ```toml
   airdrop = "YourAirdropProgramIdHere"
   nft_airdrop = "YourNftAirdropProgramIdHere"
   ```
2. * `./programs/airdrop/src/lib.rs`:
    ```rust
    declare_id!("YourAirdropProgramIdHere");
    ```
   * `./programs/nft_airdrop/src/lib.rs`:
    ```rust
    declare_id!("YourNftAirdropProgramIdHere");
    ```

> ⚠️ Both values must be the same, otherwise Anchor will throw errors during testing or interaction.   

> ⚠️ Important: Do not commit your real deployed `program ID` into version control if it's specific to your development environment.

### Building / Deploying / Testing a Specific Program
By default, the commands below build, deploy, and test all programs in your project:
```
anchor build
anchor deploy
anchor test
```
To build, deploy, or test a single specific program (for example "airdrop"), use the `--program-name` flag:
```
anchor build --program-name airdrop
anchor deploy --program-name airdrop
anchor test --program-name airdrop
```
Replace airdrop with the name of the program (as defined in your programs/ folder).

## Notes
* Make sure your wallet has enough SOL to cover transaction fees when depositing and interacting with the programme.
* It is mandatory that `ANCHOR_PROVIDER_URL` and `ANCHOR_WALLET` variables are correctly specified  at `.env` for anchor successful deploy.
* Verify Programme ID to be the same in `Anchor.toml` and `lib.rs`. A mismatch will cause errors.
* Make sure that your Vault PDA is funded before testing the frontend.
* Do not commit `public-key.json` keys files or `.env` to version control for security reasons.
* Always verify the program ID and network match between backend and frontend.

## Learn More

* [Anchor Documentation](https://www.anchor-lang.com/docs).
* [Solana Documentation](https://solana.com/ru/docs).
