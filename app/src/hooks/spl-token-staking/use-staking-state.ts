import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getSplTokenStakingProgram, getStakeStatePDA } from "../../lib/anchor-client.ts";
import { useCallback, useEffect, useState } from "react";
import type { Wallet } from "@coral-xyz/anchor";

export const useStakingState = () => {
    const wallet = useAnchorWallet() as Wallet;
    const [apr, setApr] = useState<number | null>(null);

    const getStakingState = useCallback(async () => {
        try {
            const program = getSplTokenStakingProgram(wallet);
            const [stakeState] = getStakeStatePDA(program.programId);
            const account = await (program.account as any).stakeState.fetch(stakeState);
            setApr(Number(account.apr));
        } catch (err) {
            console.error("Failed to fetch stake state account: ", err);
            setApr(null);
        }
    }, [wallet]);

    useEffect(() => {
        void getStakingState();
    }, [getStakingState]);

    return { apr };
};