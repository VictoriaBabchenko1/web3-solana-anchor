import { useCallback, useEffect, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getMintDecimals, getSplTokenStakingProgram, getUserStakePDA } from "../../lib/anchor-client";
import type { Wallet } from "@coral-xyz/anchor";
import type { UserStakeStatus } from "../../types/staking.ts";
import { formatTokenAmount } from "../../utils/token-amount-format.ts";
import { convertToDecimalAmount } from "../../utils/token-amount-format.ts";
import { useStakingState } from "./use-staking-state.ts";
import { calculatePendingReward } from "../../utils/reward-calc.ts";

export const useUserStakeData = () => {
    const wallet = useAnchorWallet() as Wallet;
    const { apr } = useStakingState();
    const [userStakeStatus, setUserStakeStatus] = useState<UserStakeStatus | null>(null);
    const [pendingReward, setPendingReward] = useState("0");
    const [isLoading, setIsLoading] = useState(false);
    const resetPendingReward = () => setPendingReward("0");

    const getUserStakeData = useCallback(async () => {
        if (!wallet || !wallet.publicKey || apr === null) {
            setUserStakeStatus(null);
            resetPendingReward();
            return;
        }

        setIsLoading(true);

        try {
            const program = getSplTokenStakingProgram(wallet);
            const [userStakePda] = getUserStakePDA(program.programId, wallet.publicKey);
            const tokenDecimals = await getMintDecimals();

            const account = await (program.account as any).userStakeAccount.fetch(userStakePda);
            const now = Math.floor(Date.now() / 1000);
            const start = Number(account.startTime);
            const periodInSeconds = Number(account.lockPeriod);
            const end = start + periodInSeconds;
            const timeLeft = Math.max(end - now, 0);

            const status: UserStakeStatus = {
                stakeAmount: convertToDecimalAmount(account.stakeAmount, tokenDecimals),
                stakeAmountFormatted: formatTokenAmount(account.stakeAmount, tokenDecimals),
                startTime: new Date(start * 1000),
                lockPeriodInSeconds: periodInSeconds,
                claimedReward: convertToDecimalAmount(account.claimedReward, tokenDecimals),
                claimedRewardFormatted: formatTokenAmount(account.claimedReward, tokenDecimals),
                lastRewardUpdateTimeInSeconds: Number(account.lastRewardUpdateTime),
                timeLeftInSeconds: timeLeft,
                isTokensLocked: timeLeft > 0,
                lockedUntil: new Date(end * 1000),
            };
            setUserStakeStatus(status);

            const reward = calculatePendingReward(
                status.stakeAmount,
                apr,
                status.lastRewardUpdateTimeInSeconds,
                Math.floor(status.lockedUntil.getTime() / 1000)
            );
            const formatted = reward <= 0 ? "0" : reward.toFixed(tokenDecimals);
            setPendingReward(formatted);
        } catch (err) {
            setUserStakeStatus(null);
            setPendingReward("0");
        } finally {
            setIsLoading(false);
        }
    }, [wallet, apr]);

    useEffect(() => {
        void getUserStakeData();
    }, [getUserStakeData]);

    return {
        userStakeStatus,
        pendingReward,
        isUserStakeDataLoading: isLoading,
        refreshStakeStatus: getUserStakeData,
        resetPendingReward
    };
};
