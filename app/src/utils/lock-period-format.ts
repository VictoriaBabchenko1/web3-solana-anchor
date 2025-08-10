import {StakingLockPeriodEnum} from "../types/staking-lock-period.enum.ts";

export const formatLockPeriod = (seconds: number): string => {
    const hours = Math.floor(seconds / StakingLockPeriodEnum.ONE_HOUR);
    const days = Math.floor(seconds / StakingLockPeriodEnum.ONE_DAY);

    if (seconds < StakingLockPeriodEnum.ONE_DAY) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    return `${days} day${days !== 1 ? "s" : ""}`;
};