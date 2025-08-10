export type UserStakeStatus = {
    stakeAmount: number;
    stakeAmountFormatted: string;
    startTime: Date;
    lockPeriodInSeconds: number;
    claimedReward: number;
    claimedRewardFormatted: string;
    lastRewardUpdateTimeInSeconds: number;
    timeLeftInSeconds: number;
    isTokensLocked: boolean;
    lockedUntil: Date;
}