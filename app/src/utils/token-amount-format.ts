import BN from "bn.js";

export const convertToDecimalAmount = (raw: BN, tokenDecimals: number): number => {
    return  Number(raw) / 10 ** tokenDecimals;
}

export const formatTokenAmount = (raw: BN, tokenDecimals: number): string => {
    const amount = convertToDecimalAmount(raw, tokenDecimals);
    return amount % 1 === 0
        ? amount.toString()
        : amount.toFixed(tokenDecimals);
};