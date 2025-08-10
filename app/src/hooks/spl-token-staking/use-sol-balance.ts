import { useEffect, useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { connection } from "../../lib/connection.ts";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";

export const useSolBalance = () => {
    const wallet = useAnchorWallet() as Wallet;
    const [solBalance, setSolBalance] = useState<number | null>(null);

    const getSolBalance = useCallback(async () => {
        if (!wallet || !wallet.publicKey) {
            setSolBalance(null);
            return;
        }

        try {
            const balanceInLamports = await connection.getBalance(wallet.publicKey);
            const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;
            setSolBalance(balanceInSOL);
        } catch (err) {
            console.error("Failed to fetch SOL balance:", err);
            setSolBalance(0);
        }
    }, [wallet]);

    useEffect(() => {
        void getSolBalance();
    }, [getSolBalance]);

    return { solBalance, refreshSolBalance: getSolBalance };
};