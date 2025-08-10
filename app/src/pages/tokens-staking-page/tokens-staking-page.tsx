import React from "react";
import ConnectWalletButton from "../../components/connect-wallet-button/connect-wallet-button";
import styles from "./tokens-staking-page.module.scss";
import TokensStakingSection from "../../components/tokens-staking-section/tokens-staking-section.tsx";

const TokensStakingPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Let`s Earn By Staking</h1>
            <ConnectWalletButton />
            <TokensStakingSection />
        </div>
    );
};

export default TokensStakingPage;