import { useCallback, useEffect, useState } from "react";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { connection } from "../../lib/connection.ts";
import { MINT } from "../../lib/constants.ts";
import type { Wallet } from "@coral-xyz/anchor";

export const useTokenBalance = () => {
    const wallet = useAnchorWallet() as Wallet;
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);

    const getTokenBalance = useCallback(async () => {
        if (!wallet || !wallet.publicKey) {
            setTokenBalance(null);
            return;
        }

        try {
            const userTokenAccount = await getAssociatedTokenAddress(
                MINT,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
            setTokenBalance(tokenBalance.value.uiAmount);
        } catch (err) {
            console.error("Failed to fetch user token balance: ", err);
            setTokenBalance(0);
        }
    }, [wallet]);

    useEffect(() => {
        void getTokenBalance();
    }, [getTokenBalance]);

    return { tokenBalance, refreshTokenBalance: getTokenBalance };
};