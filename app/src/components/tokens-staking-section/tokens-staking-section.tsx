import React, { useState } from "react";
import styles from "./tokens-staking-section.module.scss";
import { useWallet } from "@solana/wallet-adapter-react";
import { useStakeTokens } from "../../hooks/spl-token-staking/use-stake.ts";
import { useUnstakeTokens } from "../../hooks/spl-token-staking/use-unstake.ts";
import { useClaimReward } from "../../hooks/spl-token-staking/use-claim-reward.ts";
import { useUserStakeData } from "../../hooks/spl-token-staking/use-user-stake-data.ts";
import { formatDuration } from "../../utils/time-format.ts";
import { StakingLockPeriodEnum } from "../../types/staking-lock-period.enum.ts";
import { formatLockPeriod } from "../../utils/lock-period-format.ts";
import { useTokenBalance } from "../../hooks/spl-token-staking/use-token-balance.ts";
import { useSolBalance } from "../../hooks/spl-token-staking/use-sol-balance.ts";
import { useTokenData } from "../../hooks/spl-token-staking/use-token-data.ts";

const TokensStakingSection: React.FC = () => {
    const { publicKey } = useWallet();
    const { stakeTokens } = useStakeTokens();
    const { unstakeTokens } = useUnstakeTokens();
    const { claimReward } = useClaimReward();
    const { tokenBalance, refreshTokenBalance } = useTokenBalance();
    const { solBalance, refreshSolBalance } = useSolBalance();
    const { tokenSymbol } = useTokenData();
    const { userStakeStatus, pendingReward, isUserStakeDataLoading, refreshStakeStatus, resetPendingReward } = useUserStakeData();

    const [amount, setAmount] = useState("1");
    const [lockPeriod, setLockPeriod] = useState(StakingLockPeriodEnum.ONE_HOUR);
    const [isSubmittingStake, setIsSubmittingStake] = useState(false);
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [isSubmittingUnstake, setIsSubmittingUnstake] = useState(false);
    const [stakeError, setStakeError] = useState<string | null>(null);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [unstakeError, setUnstakeError] = useState<string | null>(null);

    const isStaked = !!userStakeStatus;
    const isInteractionDisabled = !publicKey || isUserStakeDataLoading || isSubmittingStake || isSubmittingUnstake || isSubmittingClaim;
    const isStakeDisabled = isInteractionDisabled || isStaked || Number(amount) < 1;
    const isClaimDisabled = isInteractionDisabled || !isStaked || pendingReward === "0";
    const isUnstakeDisabled = isInteractionDisabled || !isStaked || userStakeStatus?.isTokensLocked;

    const refreshStatusAndBalances = async () => {
        await Promise.all([
            refreshStakeStatus(),
            refreshTokenBalance(),
            refreshSolBalance(),
        ]);
    };

    const handleStake = async () => {
        if (!amount || Number(amount) <= 0) {
            setStakeError("Amount must be a positive number");
            return;
        }

        if (!Object.values(StakingLockPeriodEnum).includes(lockPeriod)) {
            setStakeError("Invalid lock period selected");
            return;
        }

        setIsSubmittingStake(true);
        setStakeError(null);

        try {
            await stakeTokens(Number(amount), lockPeriod);
            await refreshStatusAndBalances();
        } catch (err) {
            setStakeError("An error occurred while staking");
        } finally {
            setIsSubmittingStake(false);
        }
    };

    const handleClaim = async () => {
        setIsSubmittingClaim(true);
        setClaimError(null);

        try {
            await claimReward();
            await refreshStatusAndBalances();
        } catch (err) {
            setClaimError("An error occurred while claiming rewards");
        } finally {
            resetPendingReward();
            setIsSubmittingClaim(false);
        }
    };

    const handleUnstake = async () => {
        setIsSubmittingUnstake(true);
        setUnstakeError(null);

        try {
            await unstakeTokens();
            await refreshStatusAndBalances();
        } catch (err) {
            setUnstakeError("An error occurred while unstaking");
        } finally {
            setIsSubmittingUnstake(false);
        }
    };

    return (
        <div className={styles.stakingContainer}>
            <div className={styles.header}>
                <span className={styles.title}>Token Staking</span>
                <div className={styles.statusBlock}>
                    <div className={styles.balanceBlock}>
                        <div className={styles.walletStatus}>
                            {tokenSymbol}:
                            {tokenBalance !== null ? ` ${tokenBalance}` : ` 0`}
                        </div>
                        <div className={styles.walletStatus}>
                            SOL: {solBalance !== null ? `${solBalance}` : "0"}
                        </div>
                    </div>
                    <div className={styles.walletStatus}>
                        {publicKey ? "Wallet Connected" : "Connect Wallet"}
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.stakeBox}>
                    <span className={styles.stakeBoxTitle}>Stake Tokens</span>
                    <label>
                        Amount to stake
                        <input
                            className={styles.input}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </label>
                    <label>
                        Lock period
                        <select
                            className={styles.select}
                            value={lockPeriod}
                            onChange={(e) => setLockPeriod(Number(e.target.value))}
                        >
                            <option value={StakingLockPeriodEnum.ONE_MIN}>1 min</option>
                            <option value={StakingLockPeriodEnum.ONE_HOUR}>1 hour</option>
                            <option value={StakingLockPeriodEnum.ONE_DAY}>1 day</option>
                            <option value={StakingLockPeriodEnum.ONE_WEEK}>1 week</option>
                            <option value={StakingLockPeriodEnum.TWO_WEEKS}>2 weeks</option>
                            <option value={StakingLockPeriodEnum.THREE_WEEKS}>3 weeks</option>
                            <option value={StakingLockPeriodEnum.ONE_MONTH}>1 month</option>
                        </select>
                    </label>
                    <div className={styles.buttonBlock}>
                        <button
                            className={`${styles.stakeBtn} ${isSubmittingStake ? styles.submittingBtn : ""}`}
                            onClick={handleStake}
                            disabled={isStakeDisabled}>
                            {isSubmittingStake ? "Staking..." : "Stake"}
                        </button>
                        {stakeError && <span className={styles.errorMessage}>{stakeError}</span>}
                    </div>
                </div>

                <div className={styles.rewardBox}>
                    <div className={styles.rewardTop}>
                        <span className={styles.rewardBoxTitle}>Pending Reward</span>
                        <div className={styles.claimRewardSection}>
                            <div className={styles.rewardAmount}>{pendingReward}</div>
                            <div className={styles.buttonBlock}>
                                <button
                                    className={`${styles.claimRewardBtn} ${isSubmittingClaim ? styles.submittingBtn : ""}`}
                                    onClick={handleClaim}
                                    disabled={isClaimDisabled}>
                                    {isSubmittingClaim ? "Claiming Reward..." : "Claim Reward"}
                                </button>
                                {claimError && <span className={styles.errorMessage}>{claimError}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.status}>
                        <span className={styles.statusBoxTitle}>Staking Status</span>

                        <div className={styles.statusItem}>
                            <span className={styles.label}>Staked</span>
                            <span className={styles.value}>{isStaked ? `${userStakeStatus.stakeAmountFormatted} ${tokenSymbol}` : `0 ${tokenSymbol}`}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Lock period</span>
                            <span className={styles.value}>{isStaked ? `${formatLockPeriod(userStakeStatus.lockPeriodInSeconds)}` : "—"}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Time left</span>
                            <span className={styles.value}>{isStaked ? `${formatDuration(userStakeStatus.timeLeftInSeconds)}` : "—"}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Total claimed</span>
                            <span className={styles.value}>{isStaked ? `${userStakeStatus.claimedRewardFormatted} ${tokenSymbol}` : `0 ${tokenSymbol}`}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.buttonBlock}>
                <button
                    className={`${styles.unstakeBtn} ${isSubmittingUnstake ? styles.submittingBtn : ""}`}
                    onClick={handleUnstake}
                    disabled={isUnstakeDisabled}>
                    {isSubmittingUnstake ? "Unstaking..." : "Unstake"}
                </button>
                {unstakeError && <span className={styles.errorMessage}>{unstakeError}</span>}
            </div>
        </div>
    );
};

export default TokensStakingSection;