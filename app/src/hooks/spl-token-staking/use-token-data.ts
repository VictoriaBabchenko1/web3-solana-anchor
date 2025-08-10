import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getUmi } from "../../lib/anchor-client.ts";
import { useEffect, useState } from "react";
import type { Wallet } from "@coral-xyz/anchor";
import { fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { MINT } from "../../lib/constants.ts";

export const useTokenData = () => {
    const [tokenSymbol, setTokenSymbol] = useState<string>("TOKEN");
    const [tokenDecimals, setTokenDecimals] = useState<number>(0);
    const wallet = useAnchorWallet() as Wallet;

    useEffect(() => {
        const getTokenMetadata = async () => {
            try {
                const umi = getUmi(wallet);
                const asset = await fetchDigitalAsset(umi, publicKey(MINT));

                setTokenSymbol(asset.metadata.symbol  || "TOKEN");
                setTokenDecimals(asset.mint.decimals ?? 0);
            } catch (err) {
                console.error("Failed to fetch token metadata: ", err);
            }
        };

        void getTokenMetadata();
    }, [wallet]);

    return { tokenSymbol, tokenDecimals };
};