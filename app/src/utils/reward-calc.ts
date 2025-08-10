export const calculatePendingReward = (
    stakeAmount: number,
    apr: number,
    lastRewardUpdateTime: number,
    lockEndTime: number
): number => {
    const now = Math.floor(Date.now() / 1000);
    const effectiveEndTime = Math.min(now, lockEndTime);
    const duration = effectiveEndTime - lastRewardUpdateTime;

    if (duration <= 0) return 0;

    const yearlyReward = (stakeAmount * apr) / 100;
    return (yearlyReward * duration) / (365 * 24 * 60 * 60);
};